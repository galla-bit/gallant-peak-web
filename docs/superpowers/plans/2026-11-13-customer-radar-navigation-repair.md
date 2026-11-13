# Customer Radar navigation repair implementation plan

> Execute inline using superpowers:executing-plans; use TDD and one final fresh-context review.

**Goal:** Preserve the public Verified Stores directory and existing TCG navigation while keeping all Radar data inaccessible until protected server integration.

**Spec:** Owner's consolidated 13 November 2026 handoff: general pages remain public; Radar requires sign-in; active Free is delayed 17 minutes and redacted; Premium requires server entitlement; existing retailer workspace/navigation must remain intact. No merge, deployment, billing, Discord or live collector activation.

**Design:** Reuse RadarViews for navigation and VerifiedStoreDirectory for owner-authorized public directory cards. Products contains the existing trusted-session loading/sign-in/unavailable placeholder. Restore legacy profile redirects to the directory through existing route state. Do not remount the legacy public stock feed or connect a new data source. Keep unconnected event/release placeholders. Replace the stale public-feed page test with explicit loading, visitor, Free, Premium and failure behavior; retain the existing directory regression tests. Update metadata to state sign-in requirements. Run CI for all PR base branches so this stacked PR receives validation.

**Stack:** Existing React/TypeScript, router, Vitest, Vite; no new dependencies.

- [x] Red: verify existing directory tests fail; add page tests for public directory access without stock requests, redirect return, and signup metadata. Add deterministic server-session mocks for loading/visitor/Free/Premium/error states.
- [x] Green: compose existing navigation and directory around the protected placeholder; correct metadata and allow CI on stacked PRs.
- [x] Verify focused tests, full frontend suite and TypeScript/Vite build; check that requests are session-only and retailer workspace behavior remains covered.

**Review focus:** anonymous stock leakage; tier supplied by browser state; accidental legacy feed fetch; profile redirect route state; public directory independence from stock entitlement. Public directory cards may identify authorized retailers; they are not Free Radar stock results.

**Scope ruling:** do not alter unused legacy feed components or implement the protected Radar display in this repair. Identity, billing, Discord and live data remain unconnected.

## Execution evidence

The focused red run had 4 expected failures / 7 passes (missing directory navigation and signup metadata). After repair all 11 focused tests passed. The full suite passed 334 tests in 49 files (68.52 seconds); TypeScript/Vite build passed. Node 24.22.1 was used locally; CI verifies the configured Node 22 environment. A separate fresh-context repair reviewer found no blocking issues. No protected Radar feed, identity provider, payment or Discord integration was activated.
