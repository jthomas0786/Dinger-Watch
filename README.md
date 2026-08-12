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

On GitHub Pages, the app reads live scoreboards and standings directly from ESPN's public site API. Locally, it uses the included server route. It supports MLB, NFL, NBA, NHL, and Premier League.

## Before a commercial launch

- Use a licensed sports-data provider.
- Add authentication and a database for real user accounts, follows, posts, and predictions.
- Add rate limiting, privacy policy, monitoring, and error reporting.
