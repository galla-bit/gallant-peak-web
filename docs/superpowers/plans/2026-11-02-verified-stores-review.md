# Verified Stores review gate — 2 November 2026

Branch: `feat/verified-stores`; base: current main at clone time, `904d795bf173d36f7c1e30af649a26d9f301bee1`.

## Implemented

The existing Stores slot is now Verified Stores. A generic directory/profile supports Overview, Products, News & Updates, and Events & Competitions. No production authorised retailers are configured. MythicDeck is a separate, explicitly opened demonstration pilot; it is never admitted to the authorised directory.

## Architecture decisions

- `RetailerSpace.relationship` is supplied by trusted Gallant Peak configuration. Only an explicit authorised relationship with a nonempty reference admits a store. Collector observations, discovery, stock confidence and checkout evidence cannot promote a store. This frontend selector is not an onboarding/authentication backend; future production projection must enforce authorisation server-side.
- Retailer event association uses canonical `organiser_id`. `retailerEvents` filters the existing public event/result domains without cloning records, replacing failures or coupling results to stock. Both retailer and Events surfaces reuse `EventsView`, its filters, freshness rules and winner selection.
- Demonstration event/result records have one shared definition using existing types and IDs. They are displayed against an explicitly labelled fixed reference date. Global Events keeps public-feed status visible and requires an opt-in checkbox for the separate demonstration. No demo provenance/registration links are actionable.
- Retailer products and news are local profile content. No path feeds these products into Products/Radar/New & Upcoming. Broader publication remains Gallant Peak controlled. No Shopify, inventory or checkout integration was introduced.
- Existing stock feed validation, event parsing/fetching and contracts remain intact. No legacy implementation was deleted or whole-system cleanup undertaken.

## Changed files

- `src/tcg/RadarViews.tsx`: existing slot rename and retailer view insertion.
- `src/tcg/TcgRadar.tsx`: shared event data passed to stores; opt-in, separate demonstration Events section.
- `src/tcg/events/EventsView.tsx`: demonstration presentation suppresses real registration/provenance links; public rendering defaults unchanged.
- `src/tcg/stores/model.ts`: generic retailer types, relationship admission and canonical event scoping.
- `src/tcg/stores/demonstration.ts`: static MythicDeck pilot content and shared example event/result records.
- `src/tcg/stores/VerifiedStores.tsx`: directory, profile sections, notices and focus management.
- `src/styles.css`: scoped retailer layout, checkbox and sticky-header scroll offset.
- `src/tcg/RadarViews.test.tsx`: updated navigation and directory expectations; remaining New & Upcoming fail-closed assertion retained.
- `src/tcg/VerifiedStores.integration.test.tsx`: explicit preview, local product isolation and shared event/results coverage.
- `src/tcg/stores/model.test.ts`: authorisation exclusion and canonical domain scoping/independent failure coverage.
- `src/tcg/stores/VerifiedStores.test.tsx`: generic retailer, revocation, empty sections and keyboard focus coverage.
- `docs/superpowers/plans/2026-11-02-verified-stores.md`: implementation scope and decisions.
- This review record.

## Verification

- Baseline: 148 tests passed.
- TDD: integration tests failed on missing Verified Stores navigation; model tests failed on missing model. Implemented and observed green. Independent review's keyboard finding reproduced with a failing focus test before the fix.
- Final complete frontend suite: `pnpm test` — 17 files, 154 tests passed, exit 0.
- Final production build: `pnpm build` (`tsc -b && vite build`) — passed, exit 0; 37 modules transformed.
- `git diff --check` — passed. Git emitted only local line-ending conversion notices.
- Browser: opened TCG Hunt, directory and MythicDeck overview; verified demonstration wording and focus movement/restoration. Nested section/header style conflicts were corrected, with a scroll offset for the sticky site header.
- Independent reviewer found one P2 keyboard focus issue; fixed and regression-tested. No other correctness/architecture findings reported. No unresolved review findings.

## Limits / gate

This is a frontend framework and demonstration, not an operational retailer onboarding or management service. Real authorisation, retailer editing/persistence, live commerce and broader publication workflows are not connected. Event previews are intentionally fixed-date examples, not live announcements or results.

No merge, deployment or push performed. Nathan’s explicit approval is required before merge or deployment.

Local handoff issue: Git commit could not be created because this environment has no configured author name/email. All 13 changed files are staged on `feat/verified-stores`; no author identity was invented or global Git settings changed.
