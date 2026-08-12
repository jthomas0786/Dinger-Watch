import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
const root = join(process.cwd(), 'outputs');
const provider = process.env.SPORTS_DATA_PROVIDER || 'espn';
const sportsKey = process.env.SPORTS_DATA_API_KEY;
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const allowedLeagues = new Set(['mlb', 'nfl', 'nba', 'nhl', 'eng.1']);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const rateWindowMs = 60_000;
const rateLimit = 120;
const visitors = new Map();

function send(res, status, body, type = 'text/plain; charset=utf-8', headers = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...headers });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function json(res, status, data) { send(res, status, data, 'application/json; charset=utf-8'); }

function clientIp(req) { return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').toString().split(',')[0].trim(); }

function allowRequest(req, res) {
  const ip = clientIp(req); const now = Date.now(); const item = visitors.get(ip) || { start: now, count: 0 };
  if (now - item.start > rateWindowMs) { item.start = now; item.count = 0; }
  item.count += 1; visitors.set(ip, item);
  if (item.count > rateLimit) { json(res, 429, { error: 'Too many requests. Please try again shortly.' }); return false; }
  return true;
}

function sportsGame(game, league) {
  const away = game.AwayTeam || 'AWAY'; const home = game.HomeTeam || 'HOME';
  return {
    id: String(game.GameID || game.GlobalGameID || `${away}-${home}-${game.DateTime}`),
    status: { type: { state: /final/i.test(game.Status || '') ? 'post' : /in progress|live/i.test(game.Status || '') ? 'in' : 'pre', completed: /final/i.test(game.Status || ''), detail: game.Status || 'Scheduled' } },
    competitions: [{ venue: { fullName: game.StadiumDetails?.Name || game.Stadium || `${league.toUpperCase()} venue` }, competitors: [
      { homeAway: 'away', team: { abbreviation: away, displayName: away }, score: String(game.AwayTeamScore ?? game.AwayTeamRuns ?? 0) },
      { homeAway: 'home', team: { abbreviation: home, displayName: home }, score: String(game.HomeTeamScore ?? game.HomeTeamRuns ?? 0) }
    ] }]
  };
}

async function sportsData(res, league, endpoint) {
  if (!allowedLeagues.has(league) || !['scoreboard', 'standings'].includes(endpoint)) return send(res, 404, 'Not found');
  try {
    if (provider === 'sportsdataio') {
      if (!sportsKey) return json(res, 503, { error: 'SPORTS_DATA_API_KEY is required for the licensed provider.' });
      if (league !== 'mlb') return json(res, 501, { error: 'Configure a league adapter for this licensed provider before enabling this league.' });
      const year = new Date().getFullYear();
      const date = new Date().toISOString().slice(0, 10);
      const path = endpoint === 'scoreboard' ? `GamesByDate/${date}` : `Standings/${year}`;
      const upstream = await fetch(`https://api.sportsdata.io/v3/mlb/scores/json/${path}?key=${encodeURIComponent(sportsKey)}`, { signal: AbortSignal.timeout(8000) });
      if (!upstream.ok) return json(res, 502, { error: 'Licensed sports provider unavailable.' });
      const data = await upstream.json();
      if (endpoint === 'scoreboard') return json(res, 200, { events: data.map(game => sportsGame(game, league)) });
      return json(res, 200, { standings: { entries: data.map(team => ({ team: { displayName: team.Name || team.Team, abbreviation: team.Team }, stats: [{ name: 'wins', value: team.Wins }, { name: 'losses', value: team.Losses }] })) } });
    }
    const upstream = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${league}/${endpoint}`, { headers: { 'User-Agent': 'PulseSports/1.0' }, signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) return json(res, 502, { error: 'Development sports provider unavailable.' });
    send(res, 200, await upstream.text(), 'application/json; charset=utf-8');
  } catch (error) { console.error('sports-data-error', { league, endpoint, message: error.message }); json(res, 503, { error: 'Could not reach the sports provider.' }); }
}

function readJson(req) { return new Promise((resolve, reject) => { let data = ''; req.on('data', chunk => { data += chunk; if (data.length > 20_000) reject(Error('Payload too large')); }); req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(Error('Invalid JSON')); } }); req.on('error', reject); }); }

async function verifiedUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!supabaseUrl || !supabaseAnonKey || !token) throw Error('Authentication is required.');
  const reply = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(6000) });
  if (!reply.ok) throw Error('Your sign-in session is invalid.');
  return reply.json();
}

async function supabaseInsert(table, record, token) {
  if (!supabaseUrl || !supabaseAnonKey) throw Error('Supabase is not configured.');
  const reply = await fetch(`${supabaseUrl}/rest/v1/${table}`, { method: 'POST', headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(record), signal: AbortSignal.timeout(6000) });
  if (!reply.ok) throw Error('Could not save your update.');
  return reply.json();
}

async function community(res, req, kind) {
  try {
    const user = await verifiedUser(req); const token = req.headers.authorization;
    const body = await readJson(req);
    const record = kind === 'post' ? { user_id: user.id, league: String(body.league || '').slice(0, 20), event_id: String(body.event_id || '').slice(0, 80) || null, body: String(body.body || '').trim().slice(0, 500) } : { user_id: user.id, league: String(body.league || '').slice(0, 20), event_id: String(body.event_id || '').slice(0, 80), selection: String(body.selection || '').trim().slice(0, 80) };
    if (!record.league || (kind === 'post' && !record.body) || (kind === 'prediction' && (!record.event_id || !record.selection))) return json(res, 400, { error: 'Missing required fields.' });
    json(res, 201, await supabaseInsert(kind === 'post' ? 'posts' : 'predictions', record, token));
  } catch (error) { json(res, error.message.includes('Authentication') || error.message.includes('sign-in') ? 401 : 400, { error: error.message }); }
}

async function reportError(res, req) {
  try {
    const body = await readJson(req); const event = { message: String(body.message || 'Client error').slice(0, 500), path: String(body.path || '').slice(0, 200), metadata: { userAgent: String(req.headers['user-agent'] || '').slice(0, 200), context: body.context || null } };
    console.error('client-error', event);
    if (supabaseUrl && supabaseServiceKey) await fetch(`${supabaseUrl}/rest/v1/app_errors`, { method: 'POST', headers: { apikey: supabaseServiceKey, Authorization: `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event), signal: AbortSignal.timeout(6000) });
    json(res, 202, { received: true });
  } catch { json(res, 400, { error: 'Could not report error.' }); }
}

createServer(async (req, res) => {
  if (!allowRequest(req, res)) return;
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const api = url.pathname.match(/^\/api\/(mlb|nfl|nba|nhl|eng\.1)\/(scoreboard|standings)$/);
  if (req.method === 'GET' && api) return sportsData(res, api[1], api[2]);
  if (req.method === 'POST' && url.pathname === '/api/community/posts') return community(res, req, 'post');
  if (req.method === 'POST' && url.pathname === '/api/community/predictions') return community(res, req, 'prediction');
  if (req.method === 'POST' && url.pathname === '/api/errors') return reportError(res, req);
  const requested = url.pathname === '/' ? 'pulse-sports.html' : url.pathname.replace(/^\/+/, '');
  const file = normalize(join(root, requested));
  if (!file.startsWith(root)) return send(res, 403, 'Forbidden');
  try { send(res, 200, await readFile(file), types[extname(file)] || 'application/octet-stream'); } catch { send(res, 404, 'Not found'); }
}).listen(port, host, () => console.log(`Pulse Sports is running at http://localhost:${port} with ${provider} data.`));
