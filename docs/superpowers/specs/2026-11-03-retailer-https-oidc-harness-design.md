# Retailer HTTPS/OIDC browser qualification harness

Date: 3 November 2026, Pacific/Auckland.
Status: proposed design for owner approval. No harness implementation, dependency installation, certificate trust change, provider registration or deployment is authorised by this document alone.

## Intent and inspected baseline

Qualify the merged private retailer editor against the real merged API in a real browser, using disposable synthetic identities and content. This closes the gap between frontend fetch/jsdom tests and the existing backend in-process signed-OIDC tests. It does not connect a real retailer or make private records public.

Inspected revisions:

- Frontend `galla-bit/gallant-peak-web` main `697445089c61673fbf8e0f99f81b790175bd3a51`, merging PR #16 head `04cbd24ffc97c2b92b91910f91e244dff47ae266`.
- Backend `galla-bit/GallantDiscoveries` main `83b44e98464daa3fe447428e7ee24ba811d0f47c`, merging PR #12.
- Frontend specification and qualification: `docs/superpowers/specs/2026-11-03-retailer-editor-integration-design.md` and `docs/qualification/retailer-editor-contract-preview.md`.
- Backend `retailer_api/{app,config,auth_routes,security,oidc}.py`, existing synthetic issuer/helper tests, API qualification, and pinned optional API requirements.

Existing source facts:

- The frontend is a HashRouter application with asset base `/gallant-peak-web/`. The private route exists only when `VITE_RETAILER_EDITOR_PREVIEW` is exactly `true`. It does not implement sign-in initiation.
- The API callback is fixed to `/auth/callback` and returns a fixed 303 to `/retailer`. That path does not currently select the frontend hash route.
- `ApiConfig` requires exact canonical HTTPS origins/endpoints and port 443 or omitted. Arbitrary high HTTPS ports are not a supported shortcut.
- The real application requires matching concrete `ApiConfig`, `OIDCProvider` and an existing matching database. Startup does not migrate or seed a production database.
- The API uses `__Host-gp_retailer`, Secure/HttpOnly/SameSite=Lax, exact Host and Origin, server sessions, in-memory frontend CSRF, PKCE, one-use login admission, pinned metadata/token/JWKS URLs and RS256 validation. These remain intact.
- Existing issuer tests use injected HTTP transport. They are valuable unit evidence but do not qualify actual issuer HTTPS or browser redirects.

## Scope, non-goals and failure conditions

Build a test-owned serving/orchestration harness, not a new authentication system. Run the unchanged production API factory and unchanged editor build with an explicit preview flag against a small ephemeral HTTPS issuer implementing the required protocol endpoints. Use two isolated synthetic accounts, two stores, and explicit current grants seeded only in a fresh test database.

Out of scope: real identity-provider selection/MFA/recovery, real accounts or invitations, onboarding, production server/hosting/callback decisions, public feed projection/admission/badges, Shopify, stock collectors, Discord delivery, production migrations and cleanup/refactoring. MythicDeck remains demonstration-only. Do not merge/deploy implementation without the subsequent gates.

A passing harness must never mean production-ready, real-provider-qualified, publicly Verified, or publicly published. A missing browser/HTTPS environment is BLOCKED, not a simulated success.

## Approaches

1. **Recommended, test-only same-origin serving adapter.** Serve the real built editor and real API under one HTTPS application origin; preserve the API's fixed callback and add only a fixed harness route mapping `/retailer` to the current hash entry. A second HTTPS origin supplies the synthetic issuer. This exercises real cookies, Origin, redirects and protocol I/O without changing production contracts. The high-level local HTTPS/synthetic-issuer direction was already reserved in the approved editor milestone; these concrete serving/runtime choices are the author's proposal, not a prior owner decision.
2. **Change the production callback or frontend router now.** A permanent callback destination contract or BrowserRouter migration would involve production routing/security, existing public URLs and hosting. It expands this qualification task and is deferred.
3. **Cross-origin development server with weaker browser/security settings.** CORS expansion, SameSite=None, insecure cookies, bearer fallbacks, fake session headers, disabling TLS validation or a shipped mock login would test a different contract. Rejected.

Within the approved constraints, approach 1 is the useful next step. Owner approval of this design selects its concrete choices before implementation planning.

## Ownership and components

Keep backend-side serving, issuer, test-data setup and browser scenarios under a new test-only `tests/retailer_browser/` area and an explicit opt-in runner. Exact file layout and bounded helper decomposition belong in the implementation plan. Do not add fixture routes, issuer switches, session injection, or alternate authentication paths under shipped `src/gallantdiscoveries/retailer_api` or frontend `src/`.

The runner accepts an explicit frontend built-artifact directory plus a provenance manifest, or an explicitly supplied clean frontend checkout from which the reviewed build command creates that artifact. Pin both source SHAs, preview flag, dependency-lock digest and artifact digest in evidence. Never silently use an arbitrary existing `dist`, floating main or a dirty/unidentified checkout. Do not fetch private cross-repository source using invented CI credentials. CI must be given the approved source/artifact inputs through an explicitly configured mechanism; ordinary single-repository CI remains independent until that mechanism exists.

Reuse the API's pinned optional dependencies. Propose only test-scoped browser/server dependencies (e.g. Python Playwright and a minimal ASGI server) where necessary, separately pinned and hash-qualified in the implementation plan. They must not enter default discovery/runtime or frontend dependencies. The existing cryptographic library can generate ephemeral test CA/certificates and signing keys. No second HTTP client or new application auth library.

## HTTPS runtime and trust

Proposed first qualification target: a disposable isolated Linux test environment with Chromium, not the user's existing Chrome/Edge profile. A later Windows/Chrome run can be added as separately recorded platform evidence; this design does not claim it has occurred.

Use two exact loopback origins, provisionally `https://127.0.0.1` for the application and `https://127.0.0.2` for the issuer, on port 443. Their distinct hosts also allow genuine cross-site callback/negative-request tests. Validate OS/browser loopback reachability and cross-site classification during preflight rather than assuming it. If the environment cannot bind both origins or supply proper trust, stop BLOCKED. Do not relax `ApiConfig`, map traffic through a fake application transport, alter the user's hosts file, or use an unapproved remote address to make the run pass.

Generate a fresh test CA and exact-host leaf certificates per campaign. Trust this CA only inside the disposable test environment and browser execution context, and explicitly in the API client's test-owned verified TLS transport. The underlying API provider stays the actual concrete `OIDCProvider`; its transport must perform real network HTTPS with verification, not MockTransport/ASGITransport. Retain the provider's exact endpoint pinning, timeout, redirect and response bounds. Close the owned TLS transport during teardown.

No `ignoreHTTPSErrors`, global insecure TLS environment variables, certificate-error-ignore flags, disabled browser sandbox, broad trust in unrelated certificates, host-PC certificate installation or persistent browser/profile changes. If an isolated environment with these properties cannot be provisioned, that is an explicit prerequisite/gate, not a reason to weaken the test. Review and pin environment/tooling requirements before installing or running them. No network destinations beyond the two test origins are needed once dependencies/artifacts are prepared; unexpected browser/provider egress fails the campaign.

## Serving and fixed route adapter

The test-owned application-origin server dispatches:

- `/auth/*` and `/api/retailer/v1/*` to the real API unchanged, preserving actual scheme, host, browser cookies, Origin and request method. Do not synthesize forwarded identity/security headers or rewrite API responses/cookies.
- `/gallant-peak-web/` and reviewed static assets to the exact preview-enabled build, with correct MIME types and path containment.
- `GET /retailer` to one constant local destination `/gallant-peak-web/#/retailer`; reject unsupported methods and do not accept a return URL or carry arbitrary query/fragment inputs into the destination.
- A clearly named test-only login-start document outside the shipped frontend that calls the real bootstrap/login API in its browser origin and navigates only to the configured issuer authorization URL. Do not add a production sign-in button or account fixture to the frontend bundle.

Private/test pages use no-store and no-referrer. Preserve API security headers. Disable access/query logs and avoid third-party resources. Static dispatch must not serve test databases, keys, repository files or arbitrary filesystem paths. The fixed route adapter is test serving evidence, not an approved permanent production-hosting decision.

## Synthetic issuer and real browser flow

Run a separate, test-owned HTTPS issuer with real metadata, authorization, token and JWKS endpoints. Reuse the existing issuer's cryptographic constraints and negative cases, but do not reuse injected transport as the browser success path.

1. A fresh browser context obtains a pre-login session through the real API.
2. The test-only login starter submits real JSON/Origin/CSRF to `/auth/login`.
3. The browser follows the returned, exactly validated authorization URL to the synthetic issuer. Its visibly synthetic A/B identity choice is test-only; it is not a real retailer login mock shipped by the site.
4. The issuer issues a short-lived, single-use code bound to the approved client, exact callback, nonce and S256 challenge. The token endpoint validates the verifier and code before returning a signed RS256 ID token. Use in-memory state and locks where concurrency requires it.
5. The browser performs the real top-level callback; the API fetches metadata/token/JWKS over verified HTTPS, validates the identity, rotates the pre-login session and redirects through the fixed route adapter to the real editor.
6. The editor bootstraps its session/store selector and uses its existing same-origin client. No cookie or session is injected by the browser driver.

Only the test orchestrator can seed/revoke synthetic bindings/grants or advance an injected test clock via existing trusted domain boundaries. Do not expose a general HTTP administration, session-forging or clock-control endpoint. Assert the test DB is freshly created under the owned scratch directory; never open/migrate an existing user or production DB. Source values such as synthetic account IDs do not establish public eligibility.

## Required browser evidence

### Protocol and cookie boundary

- Normal complete A and B sign-in flows use real HTTPS/authorization/code/token/JWKS and the real API/provider. Check callback landing and hash/base asset routing without fake success responses.
- Inspect cookie metadata only: host-only prefix requirements, Secure, HttpOnly, SameSite=Lax, Path=/, bounded expiry and session rotation. Assert JavaScript cannot read the auth cookie; do not serialize its value.
- Distinct browser contexts remain isolated. The second origin demonstrates cross-site callback delivery, and negative unsafe cross-origin requests are denied. Wrong/missing CSRF on same-origin requests is denied.
- Invalid state/nonce/code/verifier/signature/issuer/audience and code replay do not authenticate. An unsolicited invalid callback must not sign out an already-valid session. Preserve one-use admission and binding-revocation semantics.
- Do not claim a real provider's consent/MFA/account-recovery or public PKI/browser-platform coverage from this synthetic issuer.

### Editor and authority lifecycle

- Through the real editor, create/update a synthetic profile, news and local listing; create a canonical event/result and explicitly correct a result. Check real persisted canonical IDs, revisions, ETags and receipts, not only DOM success copy.
- Exercise A/B store access, explicit multi-store grants where needed, store switching while a response is late, and account/session changes. Old records, intents and publication results must not leak into a new scope.
- Revoke a grant or business relationship through trusted test setup and confirm the next API operation denies access and the editor clears/rechecks its scope. Re-enabling a relationship alone does not revive old staff grants.
- Check logout success, failed/ambiguous logout copy, expiry and access loss. A clock-advanced server-expiry test is labelled as such; it is not evidence of real wall-clock browser-cookie expiry.
- Demonstrate stale If-Match conflict/compare and exact immutable retry after a committed response is dropped. Negative fault injection may drop/delay real responses, but never fabricate positive authentication or save receipts; report each injected case distinctly.
- Publication queue states remain separate from public visibility. No public consumer/feed/badge is updated, no publisher is started, and local products gain no promotion capability.

### Fail-closed operation and default build

- Missing inputs, wrong artifact SHA, TLS failure, unavailable listener, failed cleanup or skipped required cases produce BLOCKED/FAILED and nonzero exit, not PASS.
- Without the preview flag, public navigation remains intact, the editor stays absent, and no private session bootstrap occurs on public pages. No test bootstrap/issuer/identity material ships in either frontend bundle.
- Retain existing frontend 230-test and backend 607-test baselines as dated evidence, rerun the actual current suites and builds during implementation, and report resulting counts without a predetermined target. Keep ordinary unit/CI and opt-in browser qualification results separate.

## Artifacts, cleanup and gates

The campaign report records exact source/artifact/runtime versions, UTC and NZ display times, fixed case outcomes, safe counts, injected-fault labels, and explicit `synthetic_browser_qualified`, `real_provider_qualified=false`, `production_enabled=false` and `public_feed_connected=false`. A success requires every mandatory browser gate actually executed. Missing harness/runtime prerequisites stay visible. Do not invent a single operational readiness flag from synthetic evidence.

No browser traces, HAR, storageState, page/network dumps, token/body logs, private-key dumps or exception-local capture. Avoid sensitive assertions that print cookie/token/CSRF/nonce/code/verifier values. Only approved synthetic UI screenshots without auth material may be retained. Keys, codes, certs, sessions, grants and disposable DB remain under campaign ownership and are removed on shutdown; safe reports can remain. Do not alter inherited proxy/CA policy to access denied remote destinations.

Close browser contexts, listeners, owned provider transport and DB, then erase ephemeral secrets/DB. A cleanup failure downgrades a prospective pass. Do not kill unrelated browser/server processes or change host settings. Failure recovery must preserve useful safe diagnostics without leaving services enabled.

Gates:

1. Owner approves this design, including the disposable runtime, unchanged production auth, test-only route adapter and synthetic-only evidence boundary.
2. Write the detailed cross-repository implementation plan, exact files/dependencies, artifact handoff and environment preflight; stop for plan approval before code/dependency installation.
3. Implement test-first in isolated branches, run complete suites/builds, independent review and exact-head CI; no merge/deploy implied.
4. Execute the opt-in real-browser synthetic campaign in the qualified disposable environment and report limitations honestly.
5. Separate later decisions cover production routing/hosting, real provider and onboarding, public projection/admission, real-retailer pilot and deployment.
