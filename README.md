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

Dependencies are pinned and locked so local checks and CI use the same versions. Pull requests run tests and the production build; pushes to `main` also deploy to GitHub Pages. Pages must be configured to use GitHub Actions in repository settings. With hash routing, the admin preview URL is `/gallant-peak-web/#/admin` and the estimator is `/gallant-peak-web/#/custom`.

## TCG Hunt public consumer

TCG Hunt remains the sole stock-intelligence authority. The web application consumes only its deliberately public, versioned and delayed client contract; it does not collect retailer stock or inspect trusted monitoring state.

Public contract v1 requires `delayed: true` and `minimum_delay_seconds: 900`. Each public item must preserve the original validated `observed_at` value and must be at least 15 minutes old at artifact generation. Missing or altered delay metadata, too-recent items, stale artifacts, unsupported schemas, unsafe links and malformed records fail closed according to the contract tests. The UI explicitly states that the free public feed is delayed by at least 15 minutes and shows a human-readable age alongside the original observation timestamp.

`VITE_TCG_PUBLIC_FEED_URL` is optional and must point to an HTTPS public JSON snapshot. When it is absent, the TCG radar reports that it is not connected. When a configured request fails or otherwise fails validation, the radar reports unavailable and does not substitute demo inventory.

The fixture under `src/tcg/fixtures` contains fictional example data for tests and review only. It is never a runtime fallback. No real TCG Hunt endpoint is configured by this repository milestone; producer/public egress remains a separate TCG Hunt approval and implementation gate.

## Architecture

This repository owns web presentation only. Shared stock intelligence remains in `gallant-peak-tcg-hunt`; web, future mobile clients and Discord consume TCG Hunt-owned conclusions rather than maintaining independent stock authority. The web client never receives private/near-live streams, pending public states, credentials, trusted bridge state or internal publication timing metadata.
