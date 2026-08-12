# Pulse Sports — Step-by-Step Setup

Choose one path:

- **Demo website:** fastest; deploys the scoreboard to GitHub Pages. It does not include accounts, posts, predictions, or a private licensed-data key.
- **Full production app:** uses a server, licensed sports data, Supabase accounts/database, and the security features included in this project.

## Part 1 — Put the project on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Select **New repository**.
3. Name it `pulse-sports` and choose **Public** or **Private**.
4. Click **Create repository**.
5. On the next page, choose **uploading an existing file**.
6. Upload everything from this folder:

   `C:\Users\jthom\Documents\Codex\2026-08-07\create-a`

   Important: upload the whole folder's contents—not just the `outputs` folder. The `.github` folder is normally hidden, and it contains the deployment workflow.
7. Add a message such as `Initial Pulse Sports app` and click **Commit changes**.

## Part 2 — Fast demo deployment with GitHub Pages

1. In your new repository, select **Settings**.
2. Select **Pages** in the left sidebar.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Select the **Actions** tab at the top of the repository.
5. Open the workflow named **Deploy Pulse Sports to GitHub Pages**.
6. Wait for the green check mark. Open the deployment link shown in the workflow summary.

Your demo is now publicly accessible. Every time you update the `main` branch, GitHub deploys the latest version automatically.

## Part 3 — Install Node.js for the full app

GitHub Pages cannot run the secure server, so use this part only for the full production app.

1. Download the current LTS version of Node.js from [nodejs.org](https://nodejs.org/).
2. Install it using the defaults.
3. Open **PowerShell**.
4. Run:

   ```powershell
   cd C:\Users\jthom\Documents\Codex\2026-08-07\create-a
   npm start
   ```

5. Open `http://localhost:3000`.

## Part 4 — Create your Supabase database and accounts

1. Go to [supabase.com](https://supabase.com) and create an account.
2. Select **New project**, choose a name, region, and secure database password.
3. When the project is ready, select **SQL Editor**.
4. Click **New query**.
5. Open `supabase/schema.sql` from the Pulse Sports project, copy all of its contents, paste them into the editor, and click **Run**.
6. In Supabase, open **Authentication → Providers**.
7. Enable the sign-in method you want to offer first—email/password is the simplest.
8. Open **Project Settings → API** and copy:

   - Project URL
   - `anon` public key
   - `service_role` key

   Keep the `service_role` key private. Never place it in `pulse-sports.html` or commit it to GitHub.

## Part 5 — Add a licensed sports-data provider

1. Create a SportsDataIO account and purchase the data package needed for your planned leagues.
2. In its dashboard, generate an API key.
3. In the Pulse Sports folder, make a copy of `.env.example` named `.env`.
4. Open `.env` in a text editor and fill in the blank values:

   ```text
   SPORTS_DATA_PROVIDER=sportsdataio
   SPORTS_DATA_API_KEY=your_sportsdataio_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=3000
   ```

5. Save the file. Do not upload `.env` to GitHub; it is ignored automatically.

The included licensed-data adapter is ready for MLB. Add adapters for NFL, NBA, NHL, and soccer before enabling those leagues in a commercial release.

## Part 6 — Turn on account and community screens

The secure server routes and database tables are included. Before real people can sign in or publish content, connect the front-end sign-in, profile, follow, post, and prediction screens to Supabase Auth.

Use this order:

1. Add the Supabase project values to `.env`.
2. Create a test email/password account in Supabase Auth.
3. Run `npm start`.
4. Add and test the sign-in interface against your Supabase project.
5. Test a follow, post, and prediction with the test account.
6. Check the Supabase tables to confirm that each item belongs to the signed-in account only.

## Part 7 — Deploy the full production app

Use a Node-compatible host such as Render, Railway, Fly.io, or a similar provider. GitHub Pages is only for the static demo.

1. Create a new web-service project at your chosen host.
2. Connect it to the GitHub repository.
3. Choose Node 20 or newer.
4. Set the start command to:

   ```text
   npm start
   ```

5. In the host's **Environment Variables** section, add every value from your local `.env` file.
6. Deploy the service.
7. Open the host's public URL and verify that MLB scores load.

## Part 8 — Before sharing publicly

1. Replace the contact placeholder in `outputs/privacy.html` with your business name and privacy email.
2. Have a lawyer review the privacy notice and your sports-data license terms.
3. Turn on monitoring at your host and set alerts for failed deployments and high error rates.
4. Decide who can post, how reports are handled, and how inappropriate content is moderated.
5. Test on phone and desktop before inviting users.

## Quick troubleshooting

- **`npm` is not recognized:** install Node.js, then close and reopen PowerShell.
- **Scores are unavailable locally:** check your `SPORTS_DATA_API_KEY`, internet connection, and provider plan.
- **Accounts are not working:** confirm all three Supabase environment values and that the SQL schema was run.
- **GitHub Pages works but accounts do not:** expected. GitHub Pages cannot run the secure server or keep private API keys.
