# Pulse Sports

Pulse Sports is a live sports-scoreboard app with standings, game details, fan predictions, and automatic 30-second refreshes.

## Put it on GitHub Pages

1. Create a new GitHub repository.
2. Upload this folder's files to that repository, then commit and push them to the `main` branch.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Open the **Actions** tab and wait for “Deploy Pulse Sports to GitHub Pages” to finish.
6. GitHub will show the public web address in the workflow summary and in **Settings → Pages**.

No Node installation is needed for GitHub Pages. The included workflow deploys automatically whenever you push an update to `main`.

## Run it on your computer

If you prefer a local server, install Node.js 20 or later and run:

```bash
npm start
```

Then visit `http://localhost:3000`.

## Live data

For a demo deployed on GitHub Pages, the app reads live scoreboards and standings directly from ESPN's public site API. GitHub Pages cannot securely hold a licensed-provider key.

For production, run the included Node server and configure a licensed provider:

1. Copy `.env.example` to `.env`.
2. Set `SPORTS_DATA_PROVIDER=sportsdataio` and add your SportsDataIO key.
3. Run `npm start`.

The included SportsDataIO adapter currently supports MLB scoreboard and standings. Add provider adapters for the other leagues before enabling them in a commercial release.

## One-click production-host configuration

`render.yaml` is included for Render. After pushing this project to a GitHub repository, create a **Blueprint** in Render and select that repository. Render reads the configuration automatically; paste the requested secret values into its environment-variable screen. Its health check uses `/api/health`.

## Accounts and community features

Pulse Sports includes authenticated API routes for posts and predictions and a Supabase database schema.

1. Create a Supabase project.
2. Run `supabase/schema.sql` in its SQL Editor.
3. Enable your chosen Supabase Auth sign-in providers.
4. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the server environment.
5. Connect the client sign-in UI to Supabase Auth before exposing posts or predictions.

The server verifies a user session before accepting community writes. It uses database row-level security to restrict each user’s own profile, follows, and predictions.

## Safety and operations

- The server limits each IP address to 120 requests per minute.
- Client and server errors are structured in server logs; when a Supabase service key is configured, client errors are also saved to `app_errors`.
- A starter privacy notice is available at `/privacy.html`. Replace the placeholder contact details and have counsel review it before launch.
- Add a commercial sports-data agreement, moderation tooling, consent analytics, uptime monitoring, and backups before public release.
