# Retailer editor contract-preview qualification

3 November 2026 (Pacific/Auckland). Frontend-only synthetic contract qualification; no operational authentication or deployment readiness claim.

## References and scope

Frontend base `973c8fd2c4a7589823385a1f4c2cf4350567974e`; GallantDiscoveries contract at merged `83b44e98464daa3fe447428e7ee24ba811d0f47c`. Exact upstream OpenAPI is pinned under test-only fixtures with canonical JSON SHA256 `1931ec083379f5e2fdd294a2be7f6667b4ab65c7d5ebb60c0fcffaf70da2c4ef`. Canonical JSON hashing avoids checkout newline differences; it is not a live integration probe or general JSON Schema validator.

The private hash route is disabled unless VITE_RETAILER_EDITOR_PREVIEW is exactly true. No public navigation/tab, real sign-in redirect, registration, mock login/account chooser, provider configuration or credential is supplied. Existing public Products/Events/Verified Stores/stock consumers and MythicDeck demonstration remain separate. Accessible private stores never establish public Verified status.

## Implementation

Eight planned tasks retain task-level commits: closed management DTO/transport; in-memory generation-scoped sessions; immutable save/profile workflow; own news/local products; canonical events; canonical result corrections; scoped publication/lifecycle; final contract/build/review qualification.

Requests use fixed relative origin-root API routes, same-origin cookies, no-store and redirect:error. Browser Origin is not set by JavaScript. Unsafe writes use server-issued in-memory CSRF, per-intent idempotency keys and exact revision preconditions. No bearer/actor/role headers or persistent browser token/draft storage. Server authorization remains authoritative on each request.

Store/session changes abort prior scope and discard forms/ETags/drafts/keys; late responses are ignored. Failed logout explicitly does not claim server logout. Conflict/precondition errors preserve same-scope input and offer explicit comparison. Ambiguous retries retain immutable request identity; receipts do not imply a current baseline or public visibility. Completed result corrections require explicit supersession. Plain React text and closed HTTPS URL/time/body validation; no rich content.

## Verification evidence before independent review

- Fresh main baseline:154 tests across17 files, production build, clean/whitespace checks passed.
- Task7 retailer/TCG regression set:195 passed. StrictMode form lifecycle defect was reproduced RED and fixed; publication enum type coercion was reproduced RED and fixed during final contract qualification.
- Full pre-review frontend suite:218 tests across30 files passed; the subsequent explicit-enabled route case passed with its7-case route suite. Final combined count will be recorded after review.
- TypeScript, default production build and whitespace checks passed. Preview-enabled build is checked separately without changing default build configuration.
- Default production browser QA: Home -> TCG Hunt -> Verified Stores preserves fail-closed disconnected stock and demonstration-only admission; direct private hash route gives Page Not Found. Screenshot/DOM inspection found no rendering problem. No authenticated browser editor/cookie/OIDC qualification was performed.
- Default bundle excludes the private workspace text, synthetic account identity, pinned contract digest and canonical news test example. Test-only mock/contract files are not imported by shipped components. No package/lock/dependency changes.

Independent whole-branch review/re-review, final suite/build, exact-head CI and PR gate remain pending. No production qualification is implied by synthetic test success.

## Decisions and deferred work

Established sibling Git worktree and PowerShell ledger used; existing installed node_modules reused via ignored local junction with no new dependencies. Focused runs use pnpm exec vitest run because this environment forwards pnpm test -- as a literal separator. Client editor props explicitly carry CSRF and abort signal; shared ContentForm/CollectionEditor handle already-required workflows. JavaScript safe-integer bounds reject unrepresentable revisions rather than rounding backend int64 values. No global Git configuration changed or legacy code deleted.

Deferred: local HTTPS/OIDC browser harness; hash/base/root callback routing decision; real provider/MFA/recovery/client credentials; invitations and real onboarding; public domain projection bridge/current-authority overlay/badge freshness; production hosting/migrations/publisher/scheduler; Shopify; collectors; deployment; whole-system cleanup. Backend and collector code remain unchanged.
