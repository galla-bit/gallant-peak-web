# PR B implementation plan

**Goal:** Resolve authenticated retailers directly to the existing store space.
**Architecture:** Extend existing contracts/client/session; reuse public profile.
**Stack:** Existing React, TypeScript, React Router, Vitest and npm lockfile.
**Spec:** ../specs/2026-11-03-retailer-session-shell-design.md and owner handoff.

## Constraints and review focus

No content writes, backend edits, deployment, real accounts/provider activation.
Review stale responses, route changes, focus return, demo ID collisions, missing
public projection and server expiry. Membership is never public verification.

## Tasks (inline execution, independent branch review at end)

- [x] Establish clean baseline with npm test and npm run build.
- [x] Contract/client RED: six closed strict booleans; reject missing/extra or
  nonboolean fields. Login POST uses anonymous CSRF and rejects unsafe URLs.
  GREEN: extend contracts.ts/api.ts and update canonical OpenAPI test fixture.
- [x] Resolver RED: anonymous login, zero/one/multiple stores, explicit choice,
  401/403/unavailable and CSRF logout. GREEN: RetailerEntry and session lifecycle.
- [x] Store route RED: public/owner/foreign/demo, forged URL and unavailable
  private service. GREEN: reuse RetailerProfile and add read-only route wrapper.
  Recheck on route/focus/expiry; clear obsolete owner hints immediately.
- [x] Integrate App metadata/routes while retaining public focus and preview
  regressions. No second event/result model or product feed injection.
- [x] Focused suites, entire frontend suite, build and git diff --check.
- [x] Independent security/routing/public-content review; reproduce material
  findings with failing tests, repair and repeat full checks as needed.
- [ ] Commit, push dedicated branch, open PR B, attach PR, inspect exact-head CI.
  Stop before merge and report baselines/head/files/results/prerequisites.
