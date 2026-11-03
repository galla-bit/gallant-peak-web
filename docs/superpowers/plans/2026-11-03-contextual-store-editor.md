# PR C implementation plan

**Goal:** Contextual Edit Store on the existing store route.
**Architecture:** Reuse existing client/forms; add editing lifecycle context,
capability filtering and unsaved navigation guard without new dependencies.
**Spec:** ../specs/2026-11-03-contextual-store-editor.md and owner handoff.

- [x] Baseline full tests/build in isolated linked worktree/feature branch.
- [x] RED contextual tests: profile-only/foreign/demo/all-false, real profile
  write, 401 draft freeze, 403 close, 412/422/503 preserved drafts. GREEN reuse
  forms with current access state and stable editing scope.
- [x] RED capability tests: news/listings create/update, event state restrictions,
  results-only selection/correction. GREEN filtered sections and canonical forms.
- [x] RED dirty tests: section/record switch, exit/logout, links/history and
  beforeunload. GREEN context registration and confirmation guard. No storage.
- [x] RED exact publication labels and changed-command/retry keys. GREEN minimal
  copy/workflow extensions. Existing client contract tests cover headers/errors.
- [x] Focused retailer/session/routing/Verified Stores suites, full suite, build,
  exact upstream OpenAPI JSON check, diff whitespace check.
- [x] Independent review; reproduce material findings with regression tests,
  repair, rerun verification and re-review.
- [ ] Commit/push one dedicated PR C, attach and check exact-head CI. Stop before
  merge/deploy/provider activation; report exact files, SHAs and prerequisites.

Review focus: late requests after scope loss, in-memory-only expired-session
drafts, results-only permission, browser back/forward cancellation, exact retry
identity and public/private product isolation. Execute inline, then one independent
review; no parallel implementation tasks sharing forms.
