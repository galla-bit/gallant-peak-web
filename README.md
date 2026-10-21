# Gallant Peak Web

Customer-facing Gallant Peak website and web-admin review experience.

## Current milestone

Review build for the approved Git migration. It includes Home, Shop presentation, Custom indicative estimator, TCG Hunt presentation, Story, Contact and `/admin` information-architecture preview.

Commerce, production authentication, private artwork uploads, live TCG data, Discord automation and payments are intentionally not represented as live until their secure backends are connected.

## Commands

- Use Node.js 22.22.2 or a supported newer LTS release (24.15+).
- `npm ci`
- `npm run dev`
- `npm test`
- `npm run build`

Dependencies are pinned and locked so local checks and CI use the same versions.
Pull requests run tests and the production build; pushes to `main` also deploy
to GitHub Pages. Pages must be configured to use GitHub Actions in the repository
settings. With hash routing, the admin preview URL is
`/gallant-peak-web/#/admin` and the estimator is `/gallant-peak-web/#/custom`.

## Architecture

This repository owns web presentation only. Future shared business services belong behind a Gallant Peak API. `gallant-peak-tcg-hunt` remains a separate monitoring/intelligence service and must not be coupled directly to this frontend.
