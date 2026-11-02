# Verified retailer editor and contract integration proposal

Date: 3 November 2026, Pacific/Auckland.

Status: Nathan approved option1 (Editor and contract tests first) on3 November2026. Detailed design/implementation-plan review remains the next gate. No implementation, dependency installation, deployment or provider integration is authorised by this document; detailed choices below remain proposals unless separately approved.

## Outcome and scope

Build a generic private retailer editor in `galla-bit/gallant-peak-web`, consuming the merged GallantDiscoveries private API contract. Qualify editor behaviour with synthetic HTTP responses in tests. Keep real browser OIDC/cookie integration as the following, separately approved local HTTPS milestone.

The result is a tested frontend adapter/editor, not a working retailer login service, connected Verified Stores directory or production onboarding system. Do not claim end-to-end browser authentication from jsdom/fetch tests.

## Inspected source and reusable components

- GallantDiscoveries current main: `83b44e98464daa3fe447428e7ee24ba811d0f47c`, merged PR #12; reviewed implementation `d47d60112734b604ddc398d6abc721e87c4ca1c7`. Fresh post-merge607 tests and476 core-only tests passed. Reuse `docs/contracts/retailer-api-v1.md`, its closed OpenAPI, and the existing canonical retailer-space authority/content domain.
- Frontend current main: `973c8fd2c4a7589823385a1f4c2cf4350567974e`, merged PR #15. `src/main.tsx` uses HashRouter; `vite.config.ts` uses base `/gallant-peak-web/`. Existing React19, TypeScript, Vitest/jsdom and Testing Library suffice; no new runtime dependency is proposed.
- `src/tcg/stores/VerifiedStores.tsx` provides the public directory/space and MythicDeck demonstration. `model.ts` deliberately accepts trusted presentation data, not editing authority. Preserve both; do not turn private store membership responses into public badges.
- `src/tcg/events/EventsView.tsx`, `types.ts`, `contract.ts`, `feed.ts` and `useEventsFeed.ts` already implement the separate public Events/Results presentation and fail-closed consumer. Preserve them. Stock and event availability remain independent.
- `src/App.tsx` owns routes and metadata; `src/styles.css` supplies existing visual conventions. Existing `/admin` is an unauthenticated architecture preview; it is not an account system and must not become retailer administration.
- The private API already has session/CSRF, scoped reads/writes, canonical events/results, strong revision preconditions, idempotent receipts, publication status and server-side revocation. Reuse them; do not build matching browser authority logic or a second content database.

## Approaches considered

1. **Recommended: editor plus contract qualification first.** Implement the frontend against the existing contract and test synthetic responses at the fetch boundary. Lowest infrastructure cost; produces reviewable editing/error/tenant behaviour. It does not qualify Secure cookies, OIDC redirects, actual same-origin integration or deployment.
2. **Larger option: include a local HTTPS synthetic browser harness now.** Exercise the real Python app and an ephemeral test issuer with browser automation. Stronger integration evidence but requires reviewed test-only serving, TLS, route rewrites, browser tooling and cross-repository fixture ownership. It should have a separate plan and approval.
3. **Rejected: weakening the backend for Vite/GitHub Pages convenience.** No broad CORS, SameSite=None, bearer fallback, HTTP-cookie downgrade, browser actor headers or shipped authentication mock.

Recommend option1. Option2 follows after editor review; it is not silently included.

## Architectural constraints that remain open

The backend callback redirects to origin-root `/retailer`; the current frontend URL would be `/gallant-peak-web/#/retailer`. Static hosting alone cannot serve the approved private API or satisfy that callback path. The later HTTPS integration design must explicitly resolve origin/root asset routing and the fixed callback destination without arbitrary redirect inputs. This draft does not change either repository's routing/hosting contract to hide the mismatch.

The private event/result DTOs are management records, not the frontend public Events v1 snapshot. Public DTOs also require eligibility, provenance, event labels and accepted verification fields. Do not cast private DTOs into public types, fabricate `eligible:true`/`verified:true`, inject saved edits directly into global Events, or use private membership as public Verified status. A separately reviewed public-domain adapter/serving milestone is still needed.

`GET /me/stores` intentionally returns no capability map. Show ordinary editor actions and handle server denial; the browser must not infer write permission from a store's presence. A future usability-oriented capability hint requires its own contract decision and must remain non-authoritative.

## Proposed frontend component boundaries

Create `src/retailer/` rather than attaching private writes to public feed loaders:

| Component/file | Responsibility |
| --- | --- |
| `contracts.ts`, `contracts.test.ts` | Versioned private DTO types and runtime decoding; fixtures derived from the committed API contract |
| `api.ts`, `api.test.ts` | Same-origin relative requests, cookies/CSRF, preconditions, idempotency, bounded safe errors and abort signals |
| `session.ts`, `session.test.ts` | In-memory session/store selection and generation-scoped cancellation; no storage of provider/session tokens |
| `RetailerWorkspace.tsx`, `.test.tsx` | Gated private route, session states, authorised-store selector and section navigation |
| `ProfileEditor.tsx`, `.test.tsx` | Canonical profile create/full replacement |
| `NewsEditor.tsx`, `.test.tsx` | News list/pagination/create/edit and publication-state choice |
| `ListingEditor.tsx`, `.test.tsx` | Local product list/create/edit, with clear global-publication boundary |
| `EventEditor.tsx`, `.test.tsx` | Canonical event fields/states with server-owned IDs/organiser |
| `ResultEditor.tsx`, `.test.tsx` | Canonical event result create/correction and explicit supersession |
| `PublicationStatus.tsx`, `.test.tsx` | Own-revision queued/acknowledged/not_required/unknown copy, never visibility claims |
| `fixtures/` under test ownership | Synthetic response and error examples only; no production fixture transport/import |

`src/App.tsx`, `src/vite-env.d.ts` and focused styles receive additive integration only. Add `VITE_RETAILER_EDITOR_PREVIEW`, default absent/false. Public production configuration remains unchanged. A flag exposes UI; it grants no authority. Do not add another TCG Hunt retailer tab, public retailer registration, invitation UI or administrator controls.

Proposed route: `#/retailer` with store/resource selection in component state. Existing public Verified Stores remains the insertion point for public browsing; the private workspace is a separate editing route, not another retailer directory/tab. Unknown store IDs are never treated as membership evidence.

## Private transport and session behaviour

- Consume only fixed origin-root `/auth/*` and `/api/retailer/v1/*` paths. No configurable arbitrary API origin, credentialed public feed or browser-supplied actor/account/role. Encode path segments; never concatenate unvalidated URL destinations.
- Use `credentials:'same-origin'`, `cache:'no-store'`, `redirect:'error'`, Accept JSON and abortable requests. JavaScript does not read or store the HttpOnly cookie. Keep CSRF only in memory; bootstrap through `GET /auth/session`.
- This milestone implements session/transport contracts and tests them with synthetic responses. It does not activate a real sign-in redirect. Preview UI clearly says authentication is not connected; no account chooser or fake login in shipped code. Actual login initiation/navigation awaits the HTTPS/provider integration gate.
- GET anonymous session means signed out; authenticated session plus `/me/stores` gives the server-approved selector, including a legitimate no-stores state. An authenticated account with no stores is not Verified.
- Mount the workspace only on its explicitly enabled route. Do not bootstrap private sessions on public pages. Avoid background polling that keeps idle sessions alive.
- Scope every load/save by selected store and session generation. Abort on switch/logout, and ignore late responses from older generations even when abort is not honoured. Clear private records, ETags, drafts, pending keys and CSRF on logout/session loss. Do not persist drafts/content/auth data to localStorage, sessionStorage, IndexedDB or service workers.
- On401 clear all private state and show session-ended. On403 clear the denied scope and revalidate the store selector without revealing other-store details; no automatic mutation retry.403 can be a missing capability, not necessarily total relationship loss.
- On failed logout, report that server logout was not confirmed and clear local private state; never claim browser state cleared the server session. Successful logout must use POST JSON and current CSRF.
- Never cache a positive membership/capability fact as authority. Server responses decide each request. Client tests demonstrate UX/isolation handling, not replacement of backend authorization tests.

## Editing and saved-state contracts

- Render plain text with React; no HTML/Markdown editors, `dangerouslySetInnerHTML`, arbitrary embedded content or unchecked URLs. Match server limits: names/titles/game200, body/description10000, HTTPS public URLs2048 without credentials/query/fragment. Unknown authority fields are never sent.
- Detail reads retain strong ETag `"r<N>"`. Updates send If-Match; profile/result creates send If-None-Match:*; collection creates use POST. No client-generated canonical content or organiser IDs.
- Each user-confirmed mutation gets a fresh `crypto.randomUUID()` Idempotency-Key and an immutable operation snapshot in memory: method/path/body/precondition/key/store/session generation. Explicit retry of an ambiguous transport failure reuses that exact snapshot. Edits to payload/path/version require a new intent/key. Disable double submission; do not blindly retry mutations or429s.
- On412/409 preserve same-scope unsaved input while showing a reload/compare choice; never silently overwrite current content or refresh ETag and resubmit. Tenant/session changes clear that input. On422 show safe field guidance without echoing server internals. On429 obey Retry-After for explicit retry availability; on503/network failure state that save is unconfirmed.
- A saved receipt's revision may be historical after replay. Re-read canonical detail for the editor's next baseline; do not combine an old ETag with newer fields. A failed reread leaves save receipt and unknown current baseline clearly distinguished.
- News/listing/profile states are DRAFT/PUBLISHED/WITHDRAWN. Events use DRAFT/PUBLISHED/CANCELLED. No hard delete. Product publication text says local listing only; no global promotion action exists.
- Event time input uses an explicit offset-bearing ISO instant and a separate supported timezone (UTC/Pacific/Auckland). Reject ambiguous naive local values rather than inventing an offset. No additional date library is proposed.
- Results belong to the selected canonical event. Creation and correction use the existing nested route; correction requires explicit confirmation and `supersedes_revision` equal to the loaded prior result revision. Do not offer a browser-editable verified/eligible/source-kind field. Server completion/ownership/correction rules remain decisive.
- Display `queued` as saved/awaiting publication processing; `acknowledged` as processing acknowledged, not publicly visible. Keep events/results independent of stock failures. Do not merge private records into public feed state or update public Verified badges optimistically.

## Proposed TDD implementation sequence

Each task: write focused tests; observe intended RED; implement minimum change; focused GREEN; relevant regressions; inspect diff; commit. Do not execute this sequence before design approval and a detailed implementation-plan gate.

1. **Private contract and transport.** Add contracts/api files and test-only fixtures. Pin exact DTO shapes/error categories, cookies/no-store, unknown authority fields excluded, encoded paths and aborts. Test malformed/schema-mismatched responses fail closed. Reuse backend JSON examples/OpenAPI rather than inventing a parallel schema; add representative cross-contract fixtures for session/stores/profile/news/listing/event/result/publication and errors.
2. **Workspace/session isolation.** Add session/workspace files, disabled-by-default route and metadata. Test anonymous/authenticated/no-stores/unavailable states; A/B stores; session expiry/logout; delayed A response after switching toB; delayed response after logout; unchanged public routes/metadata/focus. No production fake session source.
3. **Profile, news and local listing editing.** Add corresponding editors with accessible labels/status/focus and pagination. Test exact create/update headers, same-key ambiguous retry, payload-changing new key, duplicate-click prevention,412/409 conflict recovery,422/429/503, and no local product promotion/public feed mutation.
4. **Canonical events/results.** Add event/result editors against existing DTOs/routes. Test canonical event/organiser IDs retained, stock unavailable independently, naive-time rejection, state-specific denial, result create/correction/supersession, stale ETag and completed-event conflicts. Assert no public verification/eligibility flags sent.
5. **Publication and lifecycle UX.** Add publication status presentation and ensure all editors share request-generation/clear-on-denial semantics. Test historical receipt reread, publication unknown, partial event/result queue status, read-only/removed membership denied saves, business reactivation remaining denied until fresh server-granted access. These frontend scenarios mirror the server contract; backend tests remain authority evidence.
6. **Whole frontend qualification and independent review.** Full `pnpm test`, `pnpm build`, `git diff --check`; existing public stock/Events/Verified Stores/MythicDeck regression suites intact. Verify preview disabled by default and no test fixtures/auth bypass in shipped imports. Keyboard/focus interaction tests for the editor and browser rendering QA of unchanged/default public pages, then independent review; authenticated editor browser QA belongs to the subsequent HTTPS harness gate. reproduce material findings with failing tests, fix, re-review. Stop at separate frontend PR/CI review gate; do not merge/deploy. Backend remains unchanged in this milestone.

Before execution: freshly verify frontend main and clean state, create an isolated frontend feature worktree/branch from current main, establish the baseline test count/build, and confirm the backend contract SHA. Proposed branch `feat/retailer-editor-contract-preview`. No new dependencies are expected; if tooling becomes necessary, qualify and request scope review rather than adding it silently.

## Subsequent integration gate (not part of this proposal's implementation)

Design a loopback-only HTTPS browser harness with ephemeral synthetic OIDC keys and two isolated synthetic retailer accounts. Keep all serving/bootstrap/issuer helpers under test ownership, use the real unchanged API authentication adapter, and persist only disposable test databases. Qualify real Secure/HttpOnly/SameSite cookies, redirects/PKCE/CSRF, origin-root callback route, logout/expiry/revocation and cross-store denial in a browser. Do not add bypass hooks to shipped code, weaken CORS/HTTPS or configure a real provider to make tests pass.

Also separately design the trusted public projection adapter/current-authority overlay, Events v1 consumer bridge and badge freshness/recovery qualification before claiming retailer edits appear in the existing public interface. Existing canonical IDs/organiser relationships travel through that adapter; it must not become another event database. No private management DTO may stand in for a public eligibility decision.

## Approval requested

Approve option1's scope and the proposed private editing route, default-off flag, no real sign-in activation, in-memory-only drafts and explicit conflict/retry behaviour. After approval, write the detailed task-based implementation plan in the frontend repository; review it before authorising execution. If Nathan chooses the larger HTTPS scope, revise this proposal before planning it.

Deferred throughout: real identity provider/credentials/invitations/onboarding, production listener/hosting, live schema migration, production publisher/scheduler, Shopify, collector changes, deployment, automatic public verification/promotion and whole-system cleanup. MythicDeck remains demonstration-only and is not an account seed.
