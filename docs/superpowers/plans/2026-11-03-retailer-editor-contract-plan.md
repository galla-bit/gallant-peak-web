# Verified retailer editor and contract preview implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Preserve task-level commits and perform independent whole-branch review/re-review before the PR gate.

**Goal:** Build a default-off private retailer editor against the approved GallantDiscoveries API, qualified with synthetic HTTP responses in frontend tests, without activating sign-in or connecting a real retailer.

**Architecture:** Add an isolated `src/retailer/` frontend adapter and workspace in gallant-peak-web. Cookie/session/store authority remains entirely in the existing GallantDiscoveries API. Synthetic transport exists only in tests; public Verified Stores, Products and Events remain independent consumers.

**Tech Stack:** Existing React19/TypeScript/Vite, Vitest/jsdom and Testing Library; browser Fetch/AbortController/crypto.randomUUID. No added runtime or test dependency is planned.

**Spec:** [Retailer editor integration proposal](../specs/2026-11-03-retailer-editor-integration-design.md). Nathan selected **Editor and contract tests first** on3 November2026. This confirms the smaller scope; detailed implementation approval remains the next gate.

## Global constraints

- Edit only gallant-peak-web during eventual execution. GallantDiscoveries is contract reference only; no backend, collector or other repository runtime changes.
- Baseline references: frontend main `973c8fd2c4a7589823385a1f4c2cf4350567974e`; backend merged main `83b44e98464daa3fe447428e7ee24ba811d0f47c`. Refresh references and verify current main before execution; stop for incompatible contract drift.
- Trusted contract: backend `docs/contracts/retailer-api-v1.md`, `.openapi.json`, `models.py`, `queries.py`, and route adapters. Keep their ownership in GallantDiscoveries; do not copy Python source or create another event domain.
- Default-off `VITE_RETAILER_EDITOR_PREVIEW`; only exact string `true` enables the route. An enabled UI grants no identity or authority. Disabled build must not bootstrap a private session.
- Route `/retailer` is inside existing HashRouter (`/gallant-peak-web/#/retailer`). It is private editing UI, not a new TCG retailer tab. Do not change Vite base, HashRouter, backend `/retailer` callback, `/admin` preview or public navigation architecture.
- No operational sign-in button/redirect, test account chooser, public registration, mock authentication mode or fixture import in shipped components. Anonymous workspace says sign-in is not connected. Tests alone provide synthetic authenticated responses.
- Origin-root relative `/auth/session`, `/auth/logout`, `/api/retailer/v1/*`; cookies same-origin, no-store, redirect:error. Never set forbidden Origin manually; browser supplies Origin for real same-origin unsafe requests. Fetch mocks cannot qualify actual Origin/cookie behaviour.
- No bearer/header actors, browser account/role/capability authority, provider tokens, credentialed cross-origin API, CORS relaxation, localStorage/sessionStorage/IndexedDB drafts or persistent client cache.
- HTML/Markdown/rich-text editing/storage is out of scope. Render values as React text and accept only validated HTTPS public links.
- Save success means a canonical revision was saved; it does not mean public visibility. Local products never auto-promote globally. Public Verified status is never inferred from login or accessible stores.
- Preserve canonical event/result IDs, organiser relationship, supersession rules, revision-pinned grants, public fail-closed feeds and stock-independent Events/Results. MythicDeck remains demonstration-only, never seeded as an authenticated retailer.
- No dependency installation for planning. At execution, use existing lock/setup; any new dependency or scope expansion requires review before introduction.

## Review focus

1. Late response after store switch/logout must not restore private content (Tasks2/7).
2. Ambiguous save and later receipt replay must not duplicate content or silently use a stale revision (Tasks3/7).
3. Membership/capability removal must be handled without browser authority assumptions or cross-store data disclosure (Tasks2/7).
4. Private draft/results must never be converted into public verified/eligible records (Tasks4–8).
5. Preview-disabled builds and malformed responses must fail closed, with no fake session or public-feed substitution (Tasks1/2/8).

## File map and shared interfaces

All following paths are relative to gallant-peak-web. No generated API client or query/state library is needed.

- `src/retailer/contracts.ts`: closed private request/response types, runtime decoders and plain-input checks; `.test.ts` plus `src/retailer/__tests__/fixtures.ts` and `fixtures/*.json` for contract examples.
- `api.ts`: injectable `createRetailerClient(fetcher:typeof fetch=fetch):RetailerClient`; `.test.ts`.
- `session.ts`: `useRetailerSession(client:RetailerClient):RetailerSessionController`; `.test.tsx`. Internal context/generation is cancellation bookkeeping, never an authority field sent to the server.
- `RetailerWorkspace.tsx`: `RetailerWorkspace({client}: {client?:RetailerClient})`; `.test.tsx`. Default real client, test client injected in tests only.
- `mutations.ts`: immutable pending-intent creation/execution and conflict handling; `.test.ts`.
- `ProfileEditor.tsx`, `NewsEditor.tsx`, `ListingEditor.tsx`, `EventEditor.tsx`, `ResultEditor.tsx`, `PublicationStatus.tsx`, with matching `.test.tsx` files.
- Modify `src/App.tsx`, `src/vite-env.d.ts`, `src/styles.css` additively. Add `src/retailer/qualification.test.tsx`, `src/retailer/fixtures.test.ts`, `docs/qualification/retailer-editor-contract-preview.md`.
- Shared test setup `src/retailer/__tests__/http.ts` uses injected Fetch-compatible functions and native Response/Headers; no shipped mock adapter or new dependency.

**Contract types:** `ContentKind='profile'|'news'|'listing'|'event'|'result'`; `CollectionKind='news'|'listing'|'event'`; `BodyByKind` exactly matches backend bodies. Profile/news/listing states DRAFT/PUBLISHED/WITHDRAWN; event states DRAFT/PUBLISHED/CANCELLED; result has event_at/winner/source_url, optional deck_archetype and positive supersedes_revision. Content DTO state is top-level; fields excludes state/supersedes_revision. Event/result organiser_id and result event_id are read-only top-level attributes.

`ContentDTO<K>` holds schema_version:1,id,retailer_id,kind:K,revision,state,fields,updated_at and the kind-specific read-only attributes. `Versioned<K>={record:ContentDTO<K>,etag:string}`. `ContentList<K>={schema_version:1,items:ContentDTO<K>[],next_after_id:string|null}`. `SavedReceipt={schema_version:1,id,revision,publication_status:'queued'|'not_required'}`. Session `{authenticated,csrf_token,expires_at}`; accessible stores `{schema_version:1,stores:{id,name,organiser_id}[]}`. Publication DTO exactly matches backend domain/state enums.

Runtime validation uses exact keys/types, schema version, identifier grammar `[A-Za-z0-9._:-]{1,128}`, positive safe-integer revisions, valid offset-bearing instants and known state enums. Reject integers beyond `Number.MAX_SAFE_INTEGER` as unsupported rather than rounding; backend int64 contract is not changed. Detail ETag must be a strong `"r<N>"` matching DTO revision. No casts from unknown JSON or private DTOs to public feed models.

`RetailerClient` produces methods `getSession(signal?)`, `getStores(signal?)`, `logout(csrf,signal?)`, `getProfile(storeId,signal?)`, `list<K extends CollectionKind>(storeId,kind,{afterId?,limit?},signal?)`, `get<K extends CollectionKind>(storeId,kind,id,signal?)`, `getResult(storeId,eventId,signal?)`, `publication(storeId,kind,id,signal?)`, and `save(intent:MutationIntent,csrf:string,signal?)`. Detail methods return `Versioned<K>`, list methods `ContentList<K>`, save returns validated `SavedReceipt`. No login/navigation/admin/promotion client methods in this milestone.

`MutationIntent` is a readonly discriminated union capturing method/path/body/precondition/key and local session-generation/store metadata. `createIntent(input:MutationInput,key:string):MutationIntent` derives permitted endpoint/method from kind/operation; it accepts no arbitrary URL/actor/role. `MutationInput` discriminates profile-create, collection-create, item-update, result-create and result-correct. Create preconditions follow contract; all updates require original ETag. Client strips local metadata before transport and revalidates known body fields. The serialised body and request preconditions are snapshotted once, not rebuilt from current form on retry.

`RetailerApiError` exposes only safe category (`session-ended|denied|not-found|conflict|precondition|invalid|limited|unavailable|contract`) plus optional correlation ID/retry deadline; no server body HTML or secrets. Unknown statuses/malformed responses become unavailable/contract errors, not success.

## Task 1: Private contracts and same-origin transport

**Files:** contracts/api and matching tests; test-only fixtures/http helpers above.

**Consumes:** authoritative backend OpenAPI/examples. **Produces:** contract types/decoders and the `RetailerClient` interface above.

- [ ] Write decoder table tests for valid session/stores/all five content kinds/lists/save/publication; unknown keys, wrong schema/type/state, foreign authority fields, unsafe URLs, naive dates, mismatched ID/kind/ETag and imprecise revision fail closed. Include a verbatim backend news example and record source SHA.
- [ ] Write transport tests with assertions equivalent to `expect(init.credentials).toBe('same-origin')`, `expect(init.cache).toBe('no-store')`, `expect(init.redirect).toBe('error')`; exact permitted paths; abort signal forwarded; no Authorization/X-Actor/X-Account/X-Role or browser-set Origin.
- [ ] Test unsafe writes send JSON, X-CSRF-Token, Idempotency-Key and exactly one appropriate precondition. GET sends no CSRF in URL. Invalid identifiers/body/intent fail before fetch; error HTML is never rendered/logged. Cover413/415/428 alongside401/403/404/409/412/422/429/503 and malformed success JSON.
- [ ] Run `pnpm test -- src/retailer/contracts.test.ts src/retailer/api.test.ts`; observe intended missing-boundary RED.
- [ ] Implement minimal decoders/client; default real Fetch, no fixture import. Implement closed body construction and response checks; never follow arbitrary redirect URLs.
- [ ] Run focused tests GREEN, then `pnpm test -- src/tcg/feed.test.ts src/tcg/events/feed.test.ts`; inspect diff/`git diff --check`; commit `feat: define private retailer editor API contracts`.

## Task 2: Default-off workspace, session and tenant isolation

**Files:** session/workspace files and tests; App.tsx, vite-env.d.ts, additive styles; navigation regression tests.

**Consumes:** Task1 client. **Produces:** controller with `status`, `stores`, `selectedStoreId`, `generation`, `selectStore(id)`, `recheck()`, `logout()`, `onDenied(status)` and `signalForGeneration()`. Workspace passes selected store/generation/client to children; it does not pass account IDs or capabilities.

- [ ] RED tests: preview flag absent/false/TRUE keeps `/retailer` unavailable and causes zero `/auth`/private calls; exact true enables it. Public routes never call private bootstrap. Check route metadata/focus and preserve `/admin` preview semantics.
- [ ] RED tests: anonymous -> sign-in-not-connected; authenticated/no stores -> no authorised spaces; authenticated/two stores -> selector only server-returned stores; spoofed unknown store selection rejected locally and no authority inferred.
- [ ] RED tests: pending A response after switch toB or logout is ignored even if injected fetch ignores abort. New session/generation cannot reuse old store records/CSRF/ETags/drafts/keys.401 clears private state;403 clears denied scope and rechecks selector without silently retrying writes.
- [ ] RED tests: logout success clears state; failed POST clears local private state but displays logout-unconfirmed, not signed out, and does not automatically bootstrap/reveal content. Explicit recheck can re-establish server state. No idle keep-alive polling or persistent storage.
- [ ] Run `pnpm test -- src/retailer/session.test.tsx src/retailer/RetailerWorkspace.test.tsx src/navigation.test.tsx`; confirm intended RED.
- [ ] Implement controller and gated route with existing HashRouter. No sign-in redirect/start-login handler; explanatory text only when unauthenticated. Use accessible heading/section navigation, store selector and status/error focus.
- [ ] Focused GREEN; run existing VerifiedStores/TcgPage/navigation tests; diff/whitespace review; commit `feat: add isolated retailer workspace preview`.

## Task 3: Immutable save intents and profile editor

**Files:** mutations.ts/.test.ts; ProfileEditor.tsx/.test.tsx; wire workspace Overview.

**Consumes:** Tasks1/2. **Produces:** reusable intent/save workflow with `prepare(input,key=crypto.randomUUID())`, `submit(csrf,signal)`, `retry(csrf,signal)`, `discard()`; a new intent replaces the previous immutable snapshot only on a new deliberate save. `ProfileEditor({client,storeId,generation,onDenied})` uses this workflow.

- [ ] RED tests: initial profile404 offers creation; create sends If-None-Match:*; existing profile uses canonical ID/ETag and full replacement. Do not conflate foreign resource404 with a creatable profile until store scope is current.
- [ ] RED tests: double-click sends once; timeout after server commit -> unconfirmed status; explicit retry uses identical method/path/body/key/ETag. Changed body/version/path requires a new intent/key. Changing stores cancels retry capability.
- [ ] RED tests: receipt revision1 followed by reread revision3 loads fields/ETag3, never mixes receipt1 with fields3. Reread failure shows saved receipt/current baseline unknown and disables subsequent update until reload.
- [ ] RED tests:409/412 preserves same-scope unsaved input and offers reload/compare; no automatic ETag refresh/resubmit. Session/store change clears input.422 gets safe validation guidance;429 explicit retry only after Retry-After; network/503 never claims success.
- [ ] Run `pnpm test -- src/retailer/mutations.test.ts src/retailer/ProfileEditor.test.tsx`; confirm RED.
- [ ] Implement minimal workflow and plain-text profile form. Display saved status separately from current/publication baseline. Reuse only UI helpers that are already necessary; no speculative generic form framework.
- [ ] Focused GREEN, session/API regressions, diff/whitespace review; commit `feat: edit retailer profiles with safe revision retries`.

## Task 4: News and local-product editors

**Files:** NewsEditor.tsx/ListingEditor.tsx plus tests; workspace sections.

**Consumes:** Tasks1–3; list pagination, intent lifecycle. **Produces:** `NewsEditor` and `ListingEditor` with the same `{client,storeId,generation,onDenied}` props.

- [ ] RED tests: own list pagination follows next_after_id with bounded limit50; switch discards old pages/cursors; drafts/withdrawn rows are labelled; no other-store fixture visible. Detail GET precedes update to obtain authoritative ETag.
- [ ] RED tests: collection POST has no If-Match/If-None-Match; canonical receipt ID opens the saved item; updates preserve returned ID and use PUT/If-Match. DRAFT/PUBLISHED/WITHDRAWN are exact states.
- [ ] RED tests: plain-text/name/body/description/URL limits mirror contract, unknown authority fields never sent; HTML text never executes. Local products display the Gallant-controlled global-publication explanation and have no promotion button.
- [ ] Run `pnpm test -- src/retailer/NewsEditor.test.tsx src/retailer/ListingEditor.test.tsx`; confirm RED.
- [ ] Implement accessible list/detail/forms using existing styles and intent workflow; no browser persistence or automatic feed update.
- [ ] Focused GREEN, then existing `src/tcg/VerifiedStores.integration.test.tsx` and public product tests; diff/whitespace review; commit `feat: edit retailer news and local listings`.

## Task 5: Canonical event editor

**Files:** EventEditor.tsx/.test.tsx; workspace Events & Competitions.

**Consumes:** existing event API methods and Tasks2/3 lifecycle. **Produces:** `EventEditor({client,storeId,generation,onDenied,onSelectResult(eventId)})`.

- [ ] RED tests: event create/update retains server canonical ID and read-only organiser_id; body never includes id/retailer_id/organiser_id/verified/eligible/source_type. DRAFT/PUBLISHED/CANCELLED match contract.
- [ ] RED tests: explicit offset instant plus UTC/Pacific/Auckland only; naive date/time rejected with understandable guidance. Optional fields stay absent/null as contract allows; no blank-value coercion that changes meaning silently.
- [ ] RED tests:403 on publish is handled even if store is listed and draft write previously worked; no client capability grant.409 completed-event identity conflict and412 stale version do not silently overwrite. Existing stock feed unavailable does not disable private events.
- [ ] Run `pnpm test -- src/retailer/EventEditor.test.tsx`; confirm RED.
- [ ] Implement plain form and canonical selection; no conversion into public TcgEvent type or optimistic insertion into public Events.
- [ ] Focused GREEN and existing event feed/EventsView tests; diff/whitespace review; commit `feat: edit canonical retailer events`.

## Task 6: Canonical result creation and explicit corrections

**Files:** ResultEditor.tsx/.test.tsx; workspace selected-event result view.

**Consumes:** selected canonical event ID, getResult and intent workflow. **Produces:** `ResultEditor({client,storeId,eventId,generation,onDenied})`.

- [ ] RED tests: result404 inside a current own event offers create using nested event route and If-None-Match:*; existing result ID retained and read-only event_id must match selected event. Changing event invalidates earlier result responses/drafts/intents.
- [ ] RED tests: correction requires explicit user confirmation; PUT uses original ETag and supersedes_revision equal to loaded result revision. No browser field controls verification/eligibility/source kind or changes canonical event ID.
- [ ] RED tests: future/incomplete/foreign event denial, ownership404, conflict409 and stale412 produce safe guidance without side effects/retry. Valid winner/deck/source fields render as text and source URL passes public-link validation.
- [ ] Run `pnpm test -- src/retailer/ResultEditor.test.tsx`; confirm RED.
- [ ] Implement create/correction flow against existing domain contract. Describe accepted organiser publication without claiming current Verified Store badge or independent Gallant review.
- [ ] Focused GREEN; event/mutation/session regressions, diff/whitespace review; commit `feat: manage canonical organiser result corrections`.

## Task 7: Publication status and full lifecycle regression

**Files:** PublicationStatus.tsx/.test.tsx; qualification.test.tsx; targeted lifecycle corrections to earlier files only.

**Consumes:** saved receipts/current record revisions, scoped publication client, all editors. **Produces:** `PublicationStatus({client,storeId,kind,id,generation,onDenied})`, with rendered queue status only.

- [ ] RED tests: queued/acknowledged/not_required/unknown use explicit non-visibility copy. Partial event/winner domain states remain independent. No publisher/promotion request is sent; status unavailable never invents a public result.
- [ ] RED integrated scenario: synthetic two stores -> profile/news/local listing -> event/result -> queued acknowledgement -> membership removal403 -> selector refresh -> no automatic reactivation -> server-granted access only; no browser-created membership/badge. Existing public stock/Events feeds remain unavailable and unchanged throughout.
- [ ] RED integrated races: delayed publication/detail/save after switch/logout cannot appear in new scope.401 clears all;403 does not leak other store data. Historical receipt cannot replace later canonical content. No draft/key/CSRF survives store/account/session generation changes.
- [ ] Run `pnpm test -- src/retailer/PublicationStatus.test.tsx src/retailer/qualification.test.tsx`; observe RED; implement status/lifecycle glue.
- [ ] Focused GREEN; all `src/retailer` tests and existing TCG suites; diff/whitespace review; commit `feat: report scoped retailer publication and lifecycle state`.

## Task 8: Contract alignment, release-disabled qualification and review

**Files:** fixtures.test.ts; test-only pinned OpenAPI JSON and representative fixtures; docs/qualification/retailer-editor-contract-preview.md; focused regression tests for findings.

**Consumes:** all preceding deliverables. **Produces:** reproducible contract alignment check and honest qualification report, not operational readiness.

- [ ] Write failing fixture-alignment tests before implementing the check. Pin a byte-exact copy of approved backend OpenAPI under test-only fixtures with upstream repo/path/SHA/digest manifest; compare canonical structures for the used route/method/body/response schema nodes against explicit expected contract structures, and pass representative examples through the frontend decoders. Do not build a general JSON Schema engine or claim arbitrary-schema conformance. If selected nodes change or contain an unhandled shape, fail and request contract review. No production schema-validation dependency.
- [ ] Record manual source comparison against the exact backend contract; ensure fixture tests exercise frontend decoders as well as route/DTO expectations. Copying fixtures alone is not live interoperability evidence. The backend contract remains authoritative.
- [ ] Check all authored runtime files for fixture/mock/auth bypass imports, token persistence, innerHTML, arbitrary URL/authority headers and public feed mutation. Inspect a default production bundle/route behaviour with the preview flag absent. Inspect test-only schema/fixtures excluded from runtime dependency graph.
- [ ] Run complete `pnpm test`, `pnpm build`, `git diff --check`. Preview-enabled tests must also pass via explicit flag injection; add focused enabled-build verification if compile-time flag branching requires it. Preserve original154 frontend tests while adding meaningful coverage; report actual final count, no predetermined target.
- [ ] Keyboard/focus tests cover all editor controls/errors/section transitions in jsdom. Browser QA covers default public pages. Authenticated editor browser/cookie/login QA is explicitly deferred to the HTTPS harness; do not claim it here or ship a mock login for screenshots.
- [ ] Independent full-branch review: authority/header leakage, cross-store/session races, CSRF transport, stale revisions/idempotency, plain-text/XSS, public/private publication confusion, feature-disabled behaviour and no shipped bypass. Reproduce material findings with failing regression tests, fix, rerun suite/build and re-review.
- [ ] Write qualification: baseline/head/base SHAs, exact dependency reuse, actual counts, commands/results, contract digest/source, review findings/fixes, limitations and deferred work. Diff review confirms only frontend scope, no legacy deletion/unrelated refactor.
- [ ] Commit `test: qualify retailer editor contract preview`; working tree clean. Push/open frontend implementation PR only after separately authorised execution/final checks. Against current frontend main, report exact-head CI and review findings. Stop for Nathan's review; no merge/deployment.

## Execution start and stop gates

Before code: fresh frontend fetch/update and clean main; confirm merged Verified Stores remains; full `pnpm test`, `pnpm build`, `git diff --check`; stop/diagnose baseline failure. Create isolated `feat/retailer-editor-contract-preview` worktree from current frontend main using the established repository workflow. Compare authoritative backend contract before pinning it. Do not install new packages to bypass a mismatch.

Keep independently reviewable task commits. If inspection reveals an API gap, do not modify the backend from this frontend milestone; document the contradiction and seek a separate scope decision. Existing data ownership, server authorization and canonical IDs are binding.

This document is ready for implementation review but is not execution approval. No implementation, commit, push or PR is performed by this planning task. Detailed plan and proposal currently live in the task workspace; on authorised execution, preserve them in frontend `docs/superpowers/plans/` and `docs/superpowers/specs/` with references updated, rather than altering main to publish them incidentally.

Deferred: real browser HTTPS/OIDC harness; callback/root/base routing solution; real provider/credentials/invitations/onboarding; frontend public projection integration/current badge freshness/recovery; backend/admin/runtime changes; production serving/migration/publishing; Shopify; collectors; deployment; cleanup.
