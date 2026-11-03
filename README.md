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

## Retailer session and contextual Edit Store

`#/retailer` resolves the opaque backend session: signed-out login action, no
current access, a direct one-store destination, or an explicit multi-store chooser.
`#/tcg-hunt/verified-stores/:storeId` reuses the existing public store profile.
Current `/me/stores` membership and its closed management booleans affect only
presentation. Edit Store opens the capability-filtered profile, news, local
listing and canonical event/result forms inside this store page. Foreign stores,
demonstrations and all-false capabilities remain read-only. A 403 immediately
drops editing; a 401 freezes visible drafts in memory and offers sign-in.
Revalidation disables writes temporarily and a changed session cannot reuse
old CSRF. Unsaved changes are guarded on editor/record/section exit, route
navigation, browser history, logout and page unload. Drafts are never stored.
Logout clears presentation immediately and continues across route navigation;
failed logout is reported without claiming the server session ended.

The earlier editor contract preview is still default-off and is now isolated at
`#/retailer-preview` behind the exact `VITE_RETAILER_EDITOR_PREVIEW=true` flag.
It is not linked from the resolver or Edit Store; contextual editing reuses the
same closed client and forms. ETag/precondition/CSRF/idempotency semantics remain
server-enforced. An ambiguous retry keeps its original command/key; choosing to
edit a new command requires a fresh key.

The public store projection is not connected in this build. A currently
accessible private store without that projection resolves to its named route
shell with “Public store content is not connected.” Private membership never
manufactures a public Verified badge, products, news, events or winners.

Private requests use fixed origin-root relative URLs, same-origin cookies,
no-store responses and backend CSRF. No API origin configuration, bearer fallback
or browser token storage is provided. Synthetic tests qualify client behaviour;
they do not qualify production OIDC/cookies or activate a real provider/account.

**Deployment prerequisite:** static GitHub Pages alone cannot serve this private
API/auth flow. A future HTTPS same-origin application/reverse proxy must serve
`/auth/*`, `/api/retailer/v1/*`, and the fixed callback destination `/retailer`.
It must serve the application at that path and reconcile the asset base. Before
HashRouter mounts, the frontend replaces the exact `/retailer` pathname with no
hash by `/#/retailer`, using same-origin history replacement. It does not forward
query parameters or change existing hash routes. Preserve backend
Origin/CSRF/host-only Secure HttpOnly cookie protections;
do not solve this with credentialed cross-origin requests. No deployment or
hosting change is part of PR C.

Projection status is separate from a successful save: Awaiting projection,
Projection processed, No public projection required or Publication status
unavailable. Processing acknowledgement never claims public visibility.
Retailer-local listings do not enter Radar, global Products, New & Upcoming
or Releases without separately controlled Gallant Peak promotion.
