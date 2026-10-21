# Gallant Peak Web

Customer-facing Gallant Peak website and web-admin review experience.

## Current milestone

Review build for the approved Git migration. It includes Home, Shop presentation, Custom indicative estimator, TCG Hunt presentation, Story, Contact and `/admin` information-architecture preview.

Commerce, production authentication, private artwork uploads, live TCG data, Discord automation and payments are intentionally not represented as live until their secure backends are connected.

## Commands

- `npm install`
- `npm run dev`
- `npm test`
- `npm run build`

## Architecture

This repository owns web presentation only. Future shared business services belong behind a Gallant Peak API. `gallant-peak-tcg-hunt` remains a separate monitoring/intelligence service and must not be coupled directly to this frontend.
