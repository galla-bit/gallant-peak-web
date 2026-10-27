# TCG Radar Events & Recent Winners Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Events view to TCG Radar for trustworthy upcoming retailer competitions and the winners of the three most recent eligible completed competitions without weakening stock-feed truth boundaries.

**Architecture:** Extend the PR #13 product-first UI with a separate events/results presentation boundary. Events and winners consume their own deliberately public validated projection, remain independent of stock/release health, and fail closed when unconfigured, unavailable, invalid, or stale. Recent Winners sorts qualifying completed competitions by validated event time descending and displays at most three verified winner records.

**Tech Stack:** React 19.3.1, TypeScript 7.0.2, Vite 8.3.5, Vitest 5.0.5, Testing Library, existing Gallant Peak styles.

**Spec:** `docs/superpowers/specs/2026-10-28-tcg-radar-events-winners-design.md`

## Global Constraints

- Preserve PR #13 product-first stock behavior and schema-v1 stock contract unchanged.
- Navigation target is Products | New & Upcoming | Events | Stores.
- Event/result data is independent from stock and release-intelligence health.
- Hybrid sources are allowed only when provenance is retained: official game/organiser sources and retailer/organiser-published information.
- Upcoming events must be explicitly supported by a retailer/organiser source; do not infer recurring events from history.
- Recent Winners is winner-only and limited to the three most recent eligible competitions that have passed and have a verified published winner. Do not publish Top 4/Top 8 standings.
- Recency for winners is based on validated competition/event time, not discovery/publication time.
- A completed competition without a published winner is omitted and does not consume one of the three winner slots.
- Winner name/handle must be reproduced only as publicly published; do not enrich identity.
- Winning deck/archetype is optional and shown only when explicitly published.
- Missing information remains missing/unknown; never fabricate fee, format, registration status, winner, deck, or dates.
- Registration/checkout remains external to Gallant Peak.
- No live scraping, retailer automation, credentials, private feeds, collector changes, Discord changes, or production egress are authorised by this plan.
- No runtime demo/fixture fallback.
- Do not merge or deploy without explicit user approval.

## Review Focus

1. More than three valid historical winner records must still render only the newest three qualifying completed competitions.
2. A recent completed competition with no published winner must not consume a Recent Winners slot; continue to older qualifying results until three are found or data is exhausted.
3. A stale/unavailable events projection must not affect Products stock rendering and must not show old events as current.
4. Events that have already started must not remain in Upcoming merely because the source is stale or unordered.
5. Source/provenance URLs must be safe public HTTPS links; registration links must remain external and must not expose credentials/query secrets.

---

### Task 1: Public events/results contract and validation

**Files:**
- Create: `src/tcg/events/types.ts`
- Create: `src/tcg/events/contract.ts`
- Create: `src/tcg/events/contract.test.ts`

**Interfaces:**
- Produces `TcgEvent`, `TcgWinnerResult`, `TcgEventsSnapshot`, and `parseTcgEventsSnapshot(input, now)`.
- Snapshot carries a version, generated timestamp, events, winners, and per-record provenance/source URL.

- [ ] Write failing tests covering a valid upcoming event, a valid winner-only result, optional deck/archetype omission, invalid/non-HTTPS source and registration URLs, missing winner, invalid dates, and records containing unsupported standings.
- [ ] Run the focused contract test and verify RED for the missing parser/types.
- [ ] Implement the minimal strict contract/parser. Preserve only explicitly supplied public fields; reject malformed records individually while keeping the snapshot fail-closed for invalid envelope/version/freshness.
- [ ] Add tests proving winner records cannot encode Top 4/Top 8 standings and that winner identity is not enriched/transformed.
- [ ] Run the focused tests and verify GREEN.
- [ ] Commit: `feat: add TCG events public contract`.

### Task 2: Independent events feed adapter

**Files:**
- Create: `src/tcg/events/feed.ts`
- Create: `src/tcg/events/feed.test.ts`

**Interfaces:**
- Consumes `parseTcgEventsSnapshot`.
- Produces a load result that distinguishes loading/unconfigured/available/unavailable and rejected-record counts without sharing state with the stock feed.

- [ ] Write failing tests for no endpoint, HTTPS-only endpoint, request failure, stale/invalid snapshot, valid snapshot, and absence of runtime fixture fallback.
- [ ] Verify RED.
- [ ] Implement the minimal independent feed adapter following the existing stock feed's fail-closed conventions without modifying `src/tcg/feed.ts`.
- [ ] Add regression proving an events-feed failure cannot mutate or reinterpret stock availability.
- [ ] Verify GREEN.
- [ ] Commit: `feat: add independent TCG events feed`.

### Task 3: Event and winner presentation model

**Files:**
- Create: `src/tcg/events/presentation.ts`
- Create: `src/tcg/events/presentation.test.ts`

**Interfaces:**
- Produces `getUpcomingEvents(events, now)`, `getRecentWinners(winners, now, limit = 3)`, and game/store filtering helpers.
- Upcoming is chronologically ordered and excludes already-started events.
- `getRecentWinners` includes only verified winner records for competitions before `now`, sorts by validated event time newest first, and returns at most `limit` records (production default `3`).

- [ ] Write failing tests for chronological ordering, past-event exclusion, multiple games/stores, missing optional fields, and source provenance preservation.
- [ ] Verify RED.
- [ ] Implement minimal pure event presentation helpers.
- [ ] Write failing winner tests with at least five historical competitions proving: one winner per result; future competitions are excluded; missing-winner records do not consume a slot; optional deck/archetype is not inferred; ordering uses event time rather than source/publication time; and the default result is exactly the newest three qualifying completed competitions.
- [ ] Implement `getRecentWinners(winners, now, limit = 3)` and winner filters.
- [ ] Verify GREEN.
- [ ] Commit: `feat: add TCG event presentation model`.

### Task 4: Events view and Recent Winners UI

**Files:**
- Create: `src/tcg/events/EventsView.tsx`
- Create: `src/tcg/events/EventsView.test.tsx`
- Modify: `src/tcg/RadarViews.tsx`
- Modify: `src/tcg/RadarViews.test.tsx`

**Interfaces:**
- Adds `Events` to the existing Products/New & Upcoming/Stores navigation.
- Renders Upcoming Events followed by Recent Winners from the independent events load result.
- Recent Winners consumes the presentation model's default latest-three result; the component does not independently choose a different limit.

- [ ] Write failing navigation tests asserting `Events` appears between New & Upcoming and Stores and is keyboard/selectable without changing Products as the initial view.
- [ ] Verify RED.
- [ ] Add the Events navigation seam.
- [ ] Write failing EventsView tests for event game/name/store/location/date-time, optional format/fee/registration status, source freshness/provenance, external View/Register link, and honest missing optional fields.
- [ ] Add failing Recent Winners UI tests with four qualifying supplied results proving only the newest three are displayed, in newest-first order, with published winner name/handle, game/event/store/date, optional explicitly-published deck/archetype, and no Top 4/Top 8 UI.
- [ ] Implement minimal accessible UI with safe external links (`target=_blank`, `rel=noreferrer`).
- [ ] Add unconfigured/unavailable/stale/no-upcoming/no-results states that never substitute demo data.
- [ ] Verify GREEN.
- [ ] Commit: `feat: add TCG events and recent winners view`.

### Task 5: Integrate independent event loading into TCG Radar

**Files:**
- Modify: `src/tcg/TcgRadar.tsx`
- Modify: `src/tcg/TcgRadar.test.tsx`
- Modify as needed: `src/tcg/events/EventsView.tsx`

**Interfaces:**
- Products continues to consume the existing stock load path unchanged.
- Events consumes only the new events feed path and can fail independently.

- [ ] Write failing integration tests proving Products still renders when Events is unavailable and Events can render when stock is unavailable.
- [ ] Verify RED.
- [ ] Wire the independent events state into the Radar view without modifying stock schema/parser semantics.
- [ ] Add filters for game and store within Events where data exists; do not reuse stock availability filters as event truth.
- [ ] Add integration test proving a feed containing more than three historical winner records renders only the three newest qualifying completed competitions.
- [ ] Add tests for no-match filters and independence of rejected-record counts.
- [ ] Verify focused TCG Radar/Page suites GREEN.
- [ ] Commit: `feat: integrate TCG Radar event intelligence`.

### Task 6: Visual hierarchy, responsive behavior, and accessibility

**Files:**
- Modify: `src/styles.css`
- Modify tests as required: `src/tcg/events/EventsView.test.tsx`, `src/tcg/RadarViews.test.tsx`

**Interfaces:**
- Reuses Gallant Peak visual language while clearly separating Upcoming Events and Recent Winners.

- [ ] Write/extend accessibility tests for selected navigation state, headings/regions, external-link names, filter labels, and empty/error states.
- [ ] Verify RED where new semantics are absent.
- [ ] Add event cards/list styling, winner rows/cards, provenance/freshness treatment, responsive mobile layout, visible focus states, and compact information hierarchy without third-party artwork.
- [ ] Verify accessibility tests GREEN.
- [ ] Commit: `style: refine TCG events and winners experience`.

### Task 7: Full regression, review, and PR handoff

**Files:**
- Review all changed files; no unrelated production files.

- [ ] Run `npm test`; expected all tests PASS.
- [ ] Run `npm run build`; expected TypeScript and Vite PASS.
- [ ] Run `git diff --check`; expected clean.
- [ ] Search production imports to confirm no fixture/demo fallback and no changes to the stock schema-v1 contract/feed semantics.
- [ ] Review for no live scraping, credentials, private feeds, collector/backend/Discord changes, third-party artwork, or invented event/result claims.
- [ ] Perform fresh whole-branch review. Critical/Important findings receive one RED→GREEN fix pass followed by full suite/build verification; Minor findings are recorded.
- [ ] Open a follow-up PR targeting the PR #13 branch (or main only after #13 is merged) titled `TCG Radar: add events and recent winners`.
- [ ] PR body must state that Events/Recent Winners are independently sourced, winner-only, Recent Winners is limited to the three newest qualifying completed competitions, fail closed, and remain unconnected until an approved public events projection is configured.
- [ ] STOP at review gate. Do not merge or deploy.

## Self-review

- Spec coverage: navigation, hybrid provenance, upcoming competitions, latest-three winner-only results, optional published deck/archetype, independence from stock, fail-closed behavior, external registration, and no live ingestion authority are each assigned to a task.
- Interfaces are sequential: contract → feed → presentation → UI → Radar integration.
- Review-focus cases are explicitly exercised in Tasks 1–5, including >3 winners and missing-winner slot behavior.
- The stock schema/parser/feed are intentionally not implementation targets.
- Production event collection and retailer-specific ingestion are deliberately deferred; this plan builds the safe public-consumer boundary and website experience first.