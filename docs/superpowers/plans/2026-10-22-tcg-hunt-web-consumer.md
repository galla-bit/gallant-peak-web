# TCG Hunt Web Consumer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Gallant Peak website's fixture-tested, fail-closed TCG Hunt public discovery client without connecting or modifying live TCG Hunt monitoring.

**Architecture:** TCG Hunt remains the sole stock-intelligence authority. Gallant Peak Web consumes a deliberately public versioned contract through a small TypeScript boundary; phase-one development uses a non-sensitive fixture and the live endpoint remains unconfigured until TCG Hunt explicitly authorizes public egress.

**Tech Stack:** React 19.3.1, TypeScript 7.0.2, Vite 8.3.5, Vitest 5.0.5, Testing Library, jsdom.

**Spec:** `docs/superpowers/specs/2026-10-22-tcg-stock-watch-web-integration-design.md`

## Global Constraints

- TCG Hunt is the single stock-intelligence authority; the web client must not determine stock independently.
- Do not access collectors, trusted/admin bridges, raw retailer responses, Discord configuration, credentials, audit/security internals or unpublished supplier data.
- Do not connect live TCG Hunt egress until the backend's then-current authority explicitly permits public egress.
- Missing, malformed, unsupported, unsafe, stale or unknown data must fail closed and must never become an `in_stock` claim.
- Public v1 availability values are exactly `in_stock`, `limited`, `out_of_stock`, `unknown`.
- `price_nzd` is a decimal string or absent; never infer a price.
- Public IDs are opaque.
- Only HTTPS retailer destinations may become actionable links.
- No retailer HTML is rendered with `dangerouslySetInnerHTML` or equivalent.
- The website must not imply Gallant Peak is the seller for third-party inventory.
- Existing navigation, metadata, focus handling and custom-estimator accessibility must remain intact.

## Review Focus

- A syntactically valid artifact with a future/invalid `generated_at` must become unavailable, not fresh.
- A valid top-level artifact containing a mixture of good and bad item records must retain valid records while rejecting invalid ones.
- Unsafe or malformed retailer URLs must never render as clickable links.
- Unknown/new availability strings must never inherit a previous visual treatment that implies stock.
- A configured endpoint that fails at runtime must show an unavailable state and must not silently substitute fixture/demo inventory.

---

### Task 1: Define and validate the public v1 contract

**Files:**
- Create: `src/tcg/types.ts`
- Create: `src/tcg/contract.ts`
- Test: `src/tcg/contract.test.ts`

**Interfaces:**
- Produces: `TcgAvailability`, `TcgPublicItem`, `TcgPublicSnapshot`.
- Produces: `parseTcgPublicSnapshot(value: unknown, nowMs: number, maxAgeMs: number): {snapshot: TcgPublicSnapshot | null; rejectedItems: number; reason?: string}`.
- Later tasks consume only validated `TcgPublicSnapshot` values.

- [ ] **Step 1: Write failing contract tests** for exact schema version `1`, all four availability values, optional price, opaque string IDs, ISO timestamps, HTTPS retailer URLs, mixed valid/invalid records, future/invalid timestamps, unsupported schema and unknown availability.
- [ ] **Step 2: Run `npm test -- src/tcg/contract.test.ts`** and verify the tests fail because the contract modules do not exist.
- [ ] **Step 3: Implement `src/tcg/types.ts` and `src/tcg/contract.ts`** with explicit runtime guards; reject unsafe links and individual malformed records; fail the entire snapshot for invalid top-level integrity, unsupported schema or stale/future generation time.
- [ ] **Step 4: Run `npm test -- src/tcg/contract.test.ts`** and verify PASS.
- [ ] **Step 5: Commit** with `feat: add TCG public contract validation`.

### Task 2: Add a non-sensitive development fixture

**Files:**
- Create: `src/tcg/fixtures/public-snapshot-v1.ts`
- Test: `src/tcg/fixtures/public-snapshot-v1.test.ts`

**Interfaces:**
- Consumes: `TcgPublicSnapshot` from Task 1.
- Produces: `publicSnapshotV1Fixture` for tests/review only; it is not a runtime fallback for failed live requests.

- [ ] **Step 1: Write a failing fixture test** asserting schema v1, `delayed: true`, representative Pokémon/One Piece/Yu-Gi-Oh! records, HTTPS example retailer URLs, no internal/security keys, and successful validation through `parseTcgPublicSnapshot`.
- [ ] **Step 2: Run `npm test -- src/tcg/fixtures/public-snapshot-v1.test.ts`** and verify FAIL because the fixture is absent.
- [ ] **Step 3: Add the typed fixture** using clearly fictional/example retailer data and no copied raw monitor evidence.
- [ ] **Step 4: Run the fixture and contract tests** and verify PASS.
- [ ] **Step 5: Commit** with `test: add safe TCG public contract fixture`.

### Task 3: Build the stock-feed adapter without enabling live egress

**Files:**
- Create: `src/tcg/feed.ts`
- Create: `src/tcg/feed.test.ts`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: `parseTcgPublicSnapshot` from Task 1.
- Produces: `loadTcgFeed(options: {endpoint?: string; fetcher?: typeof fetch; nowMs: number; maxAgeMs: number}): Promise<TcgFeedResult>`.
- Produces: `TcgFeedResult` discriminated union with `ready`, `unconfigured`, and `unavailable` states.

- [ ] **Step 1: Write failing adapter tests** for no endpoint, successful validated fetch, HTTP failure, network failure, invalid JSON, stale payload, unsupported schema, mixed records and the rule that request failure never loads the development fixture.
- [ ] **Step 2: Run `npm test -- src/tcg/feed.test.ts`** and verify FAIL because the adapter does not exist.
- [ ] **Step 3: Implement `loadTcgFeed`** with an injected fetcher for tests and optional `VITE_TCG_PUBLIC_FEED_URL` typing; no endpoint means `unconfigured`, not an attempted request.
- [ ] **Step 4: Run contract/fixture/feed tests** and verify PASS.
- [ ] **Step 5: Commit** with `feat: add fail-closed TCG feed adapter`.

### Task 4: Add the public TCG discovery components

**Files:**
- Create: `src/tcg/TcgRadar.tsx`
- Create: `src/tcg/TcgRadar.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `TcgFeedResult` and validated `TcgPublicItem` values.
- Produces: `TcgRadar({feed}: {feed: TcgFeedResult})`.

- [ ] **Step 1: Write failing UI tests** for unconfigured/unavailable states, delayed disclosure, retailer/product/price/status/observed-time rendering, missing price, unknown status not presented as available, safe external-link attributes, filtering by game/availability and mixed-record rejection notice where applicable.
- [ ] **Step 2: Run `npm test -- src/tcg/TcgRadar.test.tsx`** and verify FAIL because the component does not exist.
- [ ] **Step 3: Implement `TcgRadar`** using semantic controls/status text and existing Gallant Peak visual conventions; do not introduce a new component framework.
- [ ] **Step 4: Add focused CSS** for radar controls/cards/statuses with visible focus states and responsive behavior.
- [ ] **Step 5: Run the component tests** and verify PASS.
- [ ] **Step 6: Commit** with `feat: add TCG Hunt discovery radar`.

### Task 5: Integrate the radar into `/tcg-hunt`

**Files:**
- Modify: `src/App.tsx`
- Create: `src/tcg/TcgPage.test.tsx`
- Modify: `src/navigation.test.tsx` only if existing assertions require updated TCG copy while preserving navigation behavior.

**Interfaces:**
- Consumes: `loadTcgFeed` from Task 3 and `TcgRadar` from Task 4.
- Produces: `/tcg-hunt` page behavior using `VITE_TCG_PUBLIC_FEED_URL` when configured and fail-closed status otherwise.

- [ ] **Step 1: Write failing page tests** proving the route retains Gallant Peak/TCG Hunt identity, explains legitimate NZ retail discovery, does not claim real-time data, shows unconfigured/unavailable state safely, and does not disturb route metadata/focus behavior.
- [ ] **Step 2: Run `npm test -- src/tcg/TcgPage.test.tsx src/navigation.test.tsx`** and verify the new expectations fail before integration.
- [ ] **Step 3: Refactor only the TCG page portion of `src/App.tsx` as needed** to load the feed in an effect and render `TcgRadar`; keep the rest of the single-file application structure intact rather than restructuring unrelated pages.
- [ ] **Step 4: Run page/navigation tests** and verify PASS.
- [ ] **Step 5: Commit** with `feat: connect TCG Hunt page to public client boundary`.

### Task 6: Verify accessibility, regression safety and build behavior

**Files:**
- Modify: `README.md`
- Modify tests only where verification reveals a real gap.

**Interfaces:**
- Consumes: completed web consumer.
- Produces: documented local/review configuration and verification evidence; does not publish a real TCG endpoint.

- [ ] **Step 1: Document `VITE_TCG_PUBLIC_FEED_URL`** as optional and explicitly state that absence keeps the radar unconfigured; document that fixture data is test/review data and is never a runtime failure fallback.
- [ ] **Step 2: Run `npm test`** and require the full suite to pass with zero failed tests.
- [ ] **Step 3: Run `npm run build`** and require TypeScript/Vite production build success.
- [ ] **Step 4: Inspect the built/source tree** and confirm no TCG credentials, raw retailer responses, trusted bridge URLs or real private monitor data were introduced.
- [ ] **Step 5: Verify the five Review Focus cases are each pinned by tests**; add a narrowly scoped regression test if any is missing, then rerun `npm test` and `npm run build`.
- [ ] **Step 6: Commit** with `docs: document TCG web consumer configuration`.

### Task 7: Review branch without connecting live TCG Hunt

**Files:**
- No planned production-file changes unless review finds a defect.

**Interfaces:**
- Produces: review-ready web consumer branch that can be evaluated with fixtures while live TCG Hunt egress remains gated.

- [ ] **Step 1: Compare the completed branch against the approved spec** and confirm every spec requirement is either implemented or explicitly gated as backend/public-egress work.
- [ ] **Step 2: Run `npm test` and `npm run build` once more on the exact review head** and record the exact results in the PR.
- [ ] **Step 3: Open/update the implementation PR** with the explicit statement that no real TCG endpoint, collector, credential or public egress has been enabled.
- [ ] **Step 4: Request whole-branch review before merge.**

## Self-review result

- Spec coverage: web-consumer responsibilities, public contract, failure behavior, security boundary, fixture-first development, UX, tests and deployment gating are covered. TCG Hunt producer/publication implementation is intentionally excluded because its current repository authority has not permitted that stage.
- Step scan: tasks are independently reviewable contract, fixture, adapter, UI, integration, verification and review units.
- Type consistency: later tasks consume the exact `TcgPublicSnapshot`, `TcgFeedResult`, `loadTcgFeed` and `TcgRadar` interfaces defined earlier.
- Review Focus: all five identified failure classes are assigned to Tasks 1, 3 and 4/5 tests.
- Proportion: implementation bodies are intentionally omitted; signatures, required behavior and verification commands carry the decisions.