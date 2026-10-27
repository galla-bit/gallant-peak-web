# TCG Radar Product-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat per-retailer TCG Radar result grid with a truthful product-first comparison experience while preserving the schema-v1 public-feed trust boundary and fail-closed runtime behavior.

**Architecture:** Keep `contract.ts` and `feed.ts` unchanged as the public validation boundary. Add a pure presentation module that conservatively groups validated v1 offers by normalized game + product text, then render those groups through focused React components inside `TcgRadar`. Products is the only live-data view in this phase; New & Upcoming and Stores expose honest unconnected states until approved public projections exist.

**Tech Stack:** React 19.3.1, TypeScript 7.0.2, Vite 8.3.5, Vitest 5.0.5, Testing Library, existing `src/styles.css` design system.

**Spec:** `docs/superpowers/specs/2026-10-28-tcg-radar-product-first-design.md`

## Global Constraints

- Schema v1 remains authoritative; do not add fields to `TcgPublicItem` or loosen `parseTcgPublicSnapshot`.
- No runtime fixture/demo fallback when the public feed is unconfigured, unavailable, stale, or invalid.
- No backend/public-egress, collector, Mighty Ape, Farmers, ChangeDetection.io, Discord, or MythicDeck collection changes.
- Do not infer retailer health, language, release state, relationship status, imagery, or event history from v1 names or missing rows.
- Group only by whitespace/case-normalized `game` + `product`; do not strip edition, language, set, size, or other meaningful product text.
- Unknown or missing evidence must remain unknown; monitoring failure must never be rendered as out of stock.
- Retailer checkout stays external and each retailer CTA uses the validated HTTPS `retailer_url`.
- Work stays on a feature branch/PR; do not merge or deploy to `main` without explicit approval.
- Demo/review data, if added later, must be explicitly named and must never be imported by production runtime modules.

## Review Focus

1. Two offers differing only by case/extra whitespace should group, while meaningful product-name differences must remain separate.
2. Duplicate observations from the same retailer/product must not crash the UI or fabricate a retailer-health conclusion; each validated offer remains inspectable.
3. Missing prices and non-available states must not contribute to the displayed lowest available price.
4. `unknown` availability must never be promoted to in-stock at product or retailer level.
5. Loading, unconfigured, unavailable, rejected-record, and zero-filter-match states must remain truthful after the component split.

---

## File Structure

- Create `src/tcg/presentation.ts` — pure v1-to-product-group transformation, normalization, aggregate availability, lowest eligible price, freshness summary, and filtering helpers.
- Create `src/tcg/presentation.test.ts` — unit tests for grouping and derived presentation semantics.
- Create `src/tcg/ProductCard.tsx` — product summary plus accessible expand/collapse retailer comparison.
- Create `src/tcg/ProductCard.test.tsx` — product-card rendering and retailer-row behavior.
- Create `src/tcg/RadarViews.tsx` — Products/New & Upcoming/Stores navigation and honest unconnected states for unsupported public projections.
- Create `src/tcg/RadarViews.test.tsx` — view navigation tests and proof that unsupported views do not fabricate data.
- Modify `src/tcg/TcgRadar.tsx` — orchestrate validated feed state, filters, product grouping, and view components.
- Modify `src/tcg/TcgRadar.test.tsx` — integration coverage for grouping, filtering, rejected records, and existing fail-closed states.
- Modify `src/styles.css` — focused product-card, retailer-row, view-navigation, compact-view, status, focus, and responsive styles.
- Keep `src/tcg/types.ts`, `src/tcg/contract.ts`, `src/tcg/feed.ts`, and their contract/feed tests unchanged in this phase.

---

### Task 1: Pure product presentation model

**Files:**
- Create: `src/tcg/presentation.ts`
- Create: `src/tcg/presentation.test.ts`

**Interfaces:**
- Consumes: `TcgPublicItem` and `TcgAvailability` from `src/tcg/types.ts`.
- Produces: `ProductGroup`, `groupTcgItems(items: TcgPublicItem[]): ProductGroup[]`, and `filterProductGroups(groups: ProductGroup[], filters: {game: string; availability: string}): ProductGroup[]`.
- `ProductGroup` fields: `key`, `game`, `product`, `offers`, `retailerCount`, `aggregateAvailability`, `lowestAvailablePriceNzd?`, `latestObservedAt`.

- [ ] **Step 1: Write failing grouping tests**

Add tests named `groups_case_and_whitespace_equivalent_product_offers`, `keeps_meaningful_product_name_differences_separate`, and `keeps_duplicate_validated_offers_inspectable`. Assert two equivalent names produce one group with both offers, while `Booster Box Japanese` and `Booster Box English` remain separate.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- src/tcg/presentation.test.ts`
Expected: FAIL because `presentation.ts`/exports do not exist.

- [ ] **Step 3: Implement conservative grouping**

In `src/tcg/presentation.ts`, implement normalization that trims, collapses internal whitespace, and lowercases only for the key. Preserve original display text and all original offers unchanged.

- [ ] **Step 4: Add failing aggregate-semantics tests**

Test `aggregateAvailability` precedence as `in_stock` > `limited` > `unknown` > `out_of_stock`; assert unknown-only groups remain unknown. Test that `lowestAvailablePriceNzd` considers priced `in_stock`/`limited` offers only, ignores missing prices and `out_of_stock`/`unknown` prices, and is absent when no eligible price exists. Assert `latestObservedAt` is the newest offer timestamp and `retailerCount` counts distinct retailer names.

- [ ] **Step 5: Implement aggregate fields and filters**

Implement the exact `ProductGroup` fields above. `filterProductGroups` must retain a group for an availability filter when at least one underlying offer has that exact state; game filtering uses the validated display game value.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/tcg/presentation.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/tcg/presentation.ts src/tcg/presentation.test.ts
git commit -m "feat: add TCG product presentation model"
```

---

### Task 2: Product card and retailer comparison

**Files:**
- Create: `src/tcg/ProductCard.tsx`
- Create: `src/tcg/ProductCard.test.tsx`

**Interfaces:**
- Consumes: `ProductGroup` from Task 1.
- Produces: `ProductCard({group}: {group: ProductGroup})`.

- [ ] **Step 1: Write the failing collapsed-card test**

Assert the card renders game, product name, aggregate availability, distinct retailer count, `From NZ$…` only when `lowestAvailablePriceNzd` exists, and the latest observation time. Assert retailer rows are initially hidden behind an accessible expand control.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/tcg/ProductCard.test.tsx`
Expected: FAIL because `ProductCard` does not exist.

- [ ] **Step 3: Implement the collapsed product card**

Create `ProductCard` using semantic `article` markup and a button with `aria-expanded`. Use the existing availability labels (`In stock`, `Limited`, `Out of stock`, `Unknown`) without adding inferred health labels.

- [ ] **Step 4: Write the failing retailer-comparison test**

After expanding, assert every offer renders retailer name, its own availability, price or `Price not supplied`, its own `observed_at`, and `View at {retailer}` with `target="_blank"` and `rel="noreferrer"`. Include duplicate same-retailer observations and assert both remain inspectable.

- [ ] **Step 5: Implement retailer rows and expand/collapse**

Render one row per validated offer. Do not deduplicate observations or infer collector state. Use only fields present on the offer.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/tcg/ProductCard.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/tcg/ProductCard.tsx src/tcg/ProductCard.test.tsx
git commit -m "feat: add TCG retailer comparison cards"
```

---

### Task 3: Radar view navigation with honest unsupported states

**Files:**
- Create: `src/tcg/RadarViews.tsx`
- Create: `src/tcg/RadarViews.test.tsx`

**Interfaces:**
- Consumes: product-view React content supplied by `TcgRadar`.
- Produces: `RadarViews({products}: {products: React.ReactNode})` with tabs/buttons for `Products`, `New & Upcoming`, and `Stores`.

- [ ] **Step 1: Write failing navigation tests**

Assert Products is selected initially and renders supplied content. Switching to New & Upcoming shows the approved GallantDiscoveries lifecycle wording plus an explicit `not connected`/`coming soon` state. Switching to Stores shows an explicit public retailer projection `not connected` state.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm test -- src/tcg/RadarViews.test.tsx`
Expected: FAIL because `RadarViews` does not exist.

- [ ] **Step 3: Implement accessible view navigation**

Use buttons with an accessible selected state. Unsupported views must contain no retailer/product fixture data, no MythicDeck live claim, and no inferred monitoring-health labels.

- [ ] **Step 4: Add a no-fallback assertion**

Assert the unsupported views do not contain `MythicDeck`, `Mighty Ape`, `Farmers`, `$XX.XX`, or `In stock` as fabricated runtime data.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/tcg/RadarViews.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/tcg/RadarViews.tsx src/tcg/RadarViews.test.tsx
git commit -m "feat: add TCG Radar view navigation"
```

---

### Task 4: Integrate product-first rendering into TcgRadar

**Files:**
- Modify: `src/tcg/TcgRadar.tsx`
- Modify: `src/tcg/TcgRadar.test.tsx`

**Interfaces:**
- Consumes: `groupTcgItems`, `filterProductGroups`, `ProductCard`, `RadarViews` from Tasks 1–3 and the existing `TcgFeedResult`.
- Produces: existing public `TcgRadar({feed}: {feed: TcgFeedResult})` signature unchanged.

- [ ] **Step 1: Extend the ready-feed fixture for product grouping**

Add a second validated offer for the existing `Booster Box` product from another retailer. Write a failing assertion that only one `Booster Box` product heading is rendered and that the card reports two retailers.

- [ ] **Step 2: Run the focused integration test and verify failure**

Run: `npm test -- src/tcg/TcgRadar.test.tsx`
Expected: FAIL under the current flat-card implementation.

- [ ] **Step 3: Replace flat item mapping with the presentation model**

Keep the early returns for `loading`, `unconfigured`, and `unavailable` unchanged in meaning. In the ready state, group `feed.snapshot.items`, apply filters through `filterProductGroups`, and render `ProductCard` inside the Products view.

- [ ] **Step 4: Update filter tests for product semantics**

Assert game filtering hides nonmatching product groups. Assert availability filtering keeps a product if an underlying retailer offer has the selected exact state and does not promote unknown. Assert a zero-match filter produces `No validated results match these filters.`

- [ ] **Step 5: Preserve trust-state tests**

Keep/add assertions for delayed-public-stock copy, rejected-record count, loading with no stock, unconfigured with no simulated stock, and unavailable with no cached/demo stock.

- [ ] **Step 6: Run Radar tests**

Run: `npm test -- src/tcg/TcgRadar.test.tsx src/tcg/TcgPage.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/tcg/TcgRadar.tsx src/tcg/TcgRadar.test.tsx
git commit -m "feat: make TCG Radar product first"
```

---

### Task 5: Visual hierarchy, compact mode, and responsive behavior

**Files:**
- Modify: `src/tcg/TcgRadar.tsx`
- Modify: `src/tcg/TcgRadar.test.tsx`
- Modify: `src/tcg/ProductCard.tsx`
- Modify: `src/tcg/ProductCard.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: existing product-group truth path; no new data source.
- Produces: `cards | compact` local display mode that changes presentation only.

- [ ] **Step 1: Write failing display-mode behavior test**

Assert the default mode is Cards, a `Compact` control switches the result container to compact presentation, and switching modes does not change the number/content of product groups or retailer offers.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/tcg/TcgRadar.test.tsx`
Expected: FAIL because display mode does not exist.

- [ ] **Step 3: Implement display-mode state without a second data path**

Add local `displayMode: 'cards' | 'compact'` state to `TcgRadar`. Both modes receive the same filtered `ProductGroup[]`; compact mode changes class/markup density only.

- [ ] **Step 4: Add focused styles**

In `src/styles.css`, add styles for `.radar-views`, `.tcg-product-grid`, `.tcg-product-card`, `.tcg-product-summary`, `.tcg-retailer-list`, `.tcg-retailer-row`, `.tcg-display-toggle`, compact variants, focus states, and mobile stacking. Preserve the existing dark Gallant Peak typography and restrained visual system; do not add third-party artwork or retailer logos.

- [ ] **Step 5: Add accessibility assertions**

Assert expand controls remain keyboard buttons with `aria-expanded`, view/display controls expose selected state, and external retailer links remain accessible by retailer name.

- [ ] **Step 6: Run component tests**

Run: `npm test -- src/tcg/ProductCard.test.tsx src/tcg/TcgRadar.test.tsx src/tcg/RadarViews.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/tcg/TcgRadar.tsx src/tcg/TcgRadar.test.tsx src/tcg/ProductCard.tsx src/tcg/ProductCard.test.tsx src/styles.css
git commit -m "style: refine product-first TCG Radar"
```

---

### Task 6: Regression verification and PR handoff

**Files:**
- Verify only unless a failing test reveals a scoped defect.
- Do not modify `src/tcg/types.ts`, `src/tcg/contract.ts`, or `src/tcg/feed.ts` merely to make UI tests pass.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a reviewable feature branch with passing tests/build and no production deployment.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test`
Expected: all Vitest tests PASS, including unchanged contract/feed validation tests.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 3: Verify runtime-boundary invariants by repository search**

Confirm production runtime files do not import anything under `src/tcg/fixtures`; confirm `TcgPublicItem` is still schema-v1-only; confirm `loadTcgFeed` still requires HTTPS and returns unconfigured when no endpoint is supplied.

- [ ] **Step 4: Review the branch diff**

Verify no changes exist to collectors, public egress/backend, monitoring configuration, Discord, MythicDeck automation, or unrelated website sections. Verify no third-party logos/character artwork were introduced.

- [ ] **Step 5: Open a pull request without merging**

PR title: `TCG Radar: product-first retailer comparison`

PR body must summarize product grouping, retailer comparison, Products/New & Upcoming/Stores navigation, unchanged schema-v1 trust boundary, test/build results, and explicitly state that New & Upcoming/Stores are honest unconnected states pending approved public projections.

- [ ] **Step 6: Stop at review gate**

Do not merge or deploy. Present the PR and verification evidence for explicit approval.

---

## Self-review result

- Spec coverage: product-first grouping, retailer comparison, three views, freshness, uncertainty, retailer isolation boundary, unsupported richer fields, fail-closed states, compact mode, responsive design, and deployment gate are covered.
- Deliberately deferred: schema v2, live retailer-health projection, GallantDiscoveries public projection, relationship badges in production, event history, approved imagery, and MythicDeck live integration.
- Type consistency: production public types remain unchanged; new presentation types are local to `presentation.ts`.
- Review-focus cases are assigned to Tasks 1, 2, 3, and 4.
- The plan does not require backend or collector work and remains independently testable as a frontend feature.