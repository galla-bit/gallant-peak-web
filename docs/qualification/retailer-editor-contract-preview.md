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

## Independent review and remediation

Independent full-branch review at11e82bb reproduced three material findings. Permanent regressions were observed failing before separate fixes:

- `7a27192`: unvalidated/malformed successful mutation responses now retain the original immutable intent and allow only exact retry, avoiding a duplicate create with a fresh key.
- `09589ec`: adopting compared current content resets explicit result-correction consent for the new revision.
- `540644d`: store content and canonical selections live in a generation-keyed component, destroyed before any new-store rendering/request.

Further qualification work e48ee99 adds structural assertions for all used closed request/detail/list DTOs and route response/body references, deliberate upstream-drift failures, a single profile/news/local-listing/published-event/result/access-loss scenario, and selected-retailer/section/validation-error focus assertions. A failing local-validation guidance regression also corrected its safe error category.

Independent re-review at `e48ee996be1dbdce59574e35fae169d70d41924a` passed17 tests across6 targeted files, confirmed all material findings resolved, and found no new material issues. These checks do not claim comprehensive browser/keyboard accessibility or real cookie/Origin/OIDC interoperability.

Accepted minor deferrals: a collection list may retain a previous title/state after editing until the section is reopened; canonical detail rereads use the current revision. Compressed source formatting could be improved in a later scoped maintenance task. Neither authorises unrelated cleanup now.

The first final-suite attempt passed230 real tests but also collected an ignored review-evidence .test.tsx copy with stale relative imports. The evidence was preserved as .txt; no permanent regression or test filter was removed. Final rerun passed **230 tests across35 files**, the production build and worktree/full-branch whitespace checks. The corrected preview-enabled build also passed; default bundle marker exclusion was rechecked. Exact-head CI remains the implementation PR gate. No production qualification is implied by synthetic test success.

## Decisions and deferred work

Established sibling Git worktree and PowerShell ledger used; existing installed node_modules reused via ignored local junction with no new dependencies. Focused runs use pnpm exec vitest run because this environment forwards pnpm test -- as a literal separator. Client editor props explicitly carry CSRF and abort signal; shared ContentForm/CollectionEditor handle already-required workflows. JavaScript safe-integer bounds reject unrepresentable revisions rather than rounding backend int64 values. No global Git configuration changed or legacy code deleted.

Deferred: local HTTPS/OIDC browser harness; hash/base/root callback routing decision; real provider/MFA/recovery/client credentials; invitations and real onboarding; public domain projection bridge/current-authority overlay/badge freshness; production hosting/migrations/publisher/scheduler; Shopify; collectors; deployment; whole-system cleanup. Backend and collector code remain unchanged.
