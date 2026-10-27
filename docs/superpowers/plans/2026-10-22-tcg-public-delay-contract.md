# TCG Public Delay Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Gallant Peak web consumer with the approved 15-minute TCG Hunt public publication contract without enabling live public egress.

**Architecture:** TCG Hunt remains the sole stock authority and public-delay enforcer. The website only consumes the delayed public v1 artifact, validates the machine-readable 900-second minimum delay and qualified observation age, and presents explicit delay/freshness disclosure.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, jsdom.

**Spec:** `docs/superpowers/specs/2026-10-22-tcg-stock-watch-web-integration-design.md`

## Global Constraints

- Do not enable or configure a real TCG Hunt endpoint.
- Keep TCG Hunt as the sole stock-intelligence authority.
- Public v1 requires `minimum_delay_seconds: 900`.
- A public item must represent a state observed at least 900 seconds before artifact generation.
- Public UI must state that the free public feed is delayed by at least 15 minutes.
- Invalid delay metadata or too-recent item state fails closed.
- Preserve original `observed_at`; do not rewrite it to publication time.
- No private/pending/near-live TCG Hunt data, credentials, monitor intervals, or trusted bridge state may enter the browser contract.

## Review Focus

- Missing `minimum_delay_seconds` must make the snapshot unavailable.
- A value other than `900` must make the snapshot unavailable.
- An item observed less than 15 minutes before `generated_at` must not render as public stock.
- Existing stale/future/schema fail-closed behavior must remain intact.
- Unconfigured/loading/unavailable/ready UI states must all avoid implying live or real-time public stock.

---

### Task 1: Enforce the 15-minute public contract

**Files:**
- Modify: `src/tcg/types.ts`
- Modify: `src/tcg/contract.ts`
- Test: `src/tcg/contract.test.ts`
- Test: `src/tcg/feed.test.ts`

**Interfaces:**
- `TcgPublicSnapshot` gains required literal `minimum_delay_seconds: 900`.
- `parseTcgPublicSnapshot(...)` continues returning `{snapshot, rejectedItems, reason?}` and rejects invalid delay metadata.

- [ ] **Step 1: Add failing tests** for missing/wrong `minimum_delay_seconds` and a too-recent item relative to `generated_at`.
- [ ] **Step 2: Run `npm test -- src/tcg/contract.test.ts src/tcg/feed.test.ts`** and confirm the new contract tests fail for the expected reasons.
- [ ] **Step 3: Implement the minimal type/parser changes** so only `900` is accepted and item states younger than 900 seconds at artifact generation are rejected.
- [ ] **Step 4: Update existing valid test payload timestamps and delay metadata** without weakening stale/future/schema tests.
- [ ] **Step 5: Run the focused tests and require PASS.**

### Task 2: Align fixture and public presentation

**Files:**
- Modify: `src/tcg/fixtures/public-snapshot-v1.ts`
- Modify: `src/tcg/fixtures/public-snapshot-v1.test.ts`
- Modify: `src/tcg/TcgRadar.tsx`
- Modify: `src/tcg/TcgRadar.test.tsx`
- Modify: `src/tcg/TcgPage.test.tsx`

**Interfaces:**
- Fixture remains fictional/test-only and satisfies the 900-second contract.
- `TcgRadar` continues consuming only validated `TcgFeedResult` values.

- [ ] **Step 1: Add regression expectations** for `minimum_delay_seconds: 900`, explicit “at least 15 minutes” disclosure, and human-readable age derived from original `observed_at`.
- [ ] **Step 2: Update the fictional fixture** with the required delay field and qualifying observation timestamps.
- [ ] **Step 3: Update radar presentation** so loading, unavailable, unconfigured, and ready states do not imply live data and the ready state exposes the minimum delay plus original observation age/time.
- [ ] **Step 4: Run fixture/radar/page tests and require PASS.**

### Task 3: Documentation and exact-head verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Documentation describes the web consumer only; producer/publication implementation remains gated in TCG Hunt.

- [ ] **Step 1: Document the required 900-second public delay contract and state that no real endpoint is configured.**
- [ ] **Step 2: Run `npm test` and require zero failures.**
- [ ] **Step 3: Run `npm run build` and require success.**
- [ ] **Step 4: Confirm no real endpoint, private TCG data, credential, pending-state metadata, or near-live path was introduced.**
- [ ] **Step 5: Open a review PR from `fix/tcg-public-delay-contract` to `main` and record exact-head verification.**

## Self-review result

- Spec coverage: required 900-second field, minimum state age, public disclosure, original observation time, fail-closed behavior, and no-live-egress scope are covered.
- Type consistency: the only contract-shape change is the required literal `minimum_delay_seconds: 900`.
- Review focus: all five identified drift/failure cases are pinned to Tasks 1–2.
- Scope: no producer, collector, deployment configuration, credential, private stream, or TCG Hunt runtime change is included.
