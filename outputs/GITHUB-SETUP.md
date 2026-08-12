# Pulse Sports — GitHub Setup

The app file is `pulse-sports.html` in this folder.

The GitHub deployment files live one folder above this `outputs` folder:

- `README.md` — full instructions
- `.github/workflows/deploy-pages.yml` — automatic GitHub Pages deployment workflow
- `index.html` — GitHub Pages entry point
- `package.json` and `server.mjs` — optional local/server deployment

When uploading to GitHub, upload the **entire `create-a` folder**, not only the `outputs` folder. Hidden folders must be included; `.github` contains the deployment workflow.

After uploading, go to the repository’s **Settings → Pages**, choose **GitHub Actions**, and then check the **Actions** tab for the deployment link.
