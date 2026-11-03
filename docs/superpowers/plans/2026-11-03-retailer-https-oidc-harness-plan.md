# Retailer HTTPS/OIDC Browser Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Qualify the existing editor and unchanged API together in a real browser using verified loopback HTTPS, disposable synthetic identities and no production integration.

**Architecture:** A test-owned HTTPS ASGI wrapper serves a provenance-checked preview-enabled frontend artifact and the real API on one origin. A second origin runs an ephemeral signed OIDC issuer. An opt-in Python Playwright campaign runs inside a disposable network-isolated Linux container and emits only safe, per-case evidence after resource cleanup.

**Tech Stack:** Existing Node22/frontend lock; Python3.13.18; existing pinned retailer API/HTTPX2/Authlib/cryptography; proposed test-only Uvicorn0.54.0 (minimal, no standard extra) and Python Playwright1.64.1 with its matching Chromium. Resolve and hash-pin their complete closure during Task3 without upgrading existing API pins.

**Spec:** `docs/superpowers/specs/2026-11-03-retailer-https-oidc-harness-design.md` (owner approved 3 November2026; provisional numeric origins resolved below).

## Global Constraints

- Backend baseline `galla-bit/GallantDiscoveries@83b44e98464daa3fe447428e7ee24ba811d0f47c`; frontend baseline `galla-bit/gallant-peak-web@697445089c61673fbf8e0f99f81b790175bd3a51`. Recheck before execution; review changes if either baseline moved.
- This is a test-only harness. No production authentication changes, real issuer/retailer/accounts/invitations, public projection/badges, Shopify, collectors, Discord, production migration, deployment or unrelated cleanup.
- Origins are **`https://app.gp-retailer.test`** and **`https://id.gp-issuer.test`**, port443; bind only127.0.0.1 and127.0.0.2 respectively inside the container. Docker-owned host mappings only, never the user's hosts file. Different registrable domains support actual cross-site tests.
- Concrete `ApiConfig`, `OIDCProvider` and `create_app` remain unchanged. Real issuer network TLS and signature verification are mandatory; no positive MockTransport/ASGITransport authentication success path, cookie injection, bearer/actor headers, CORS expansion or SameSite downgrade.
- `VITE_RETAILER_EDITOR_PREVIEW` is exactly `true` only for the explicit test artifact. The default site stays disabled. The static callback adapter is test-only, constant and accepts no return URL.
- Test CA trust is confined to the disposable Linux container and its non-root browser user. Keep certificate verification and Chromium sandbox enabled. No certificate-ignore flags, `ignoreHTTPSErrors`, `--no-sandbox`, privileged container, host networking or Docker socket mount inside the campaign.
- No arbitrary source fetch or private cross-repository credential assumption. A clean explicit checkout creates a hashed artifact; the campaign consumes explicit verified paths and SHAs. No floating main or dirty/stale `dist`.
- Keys/certificates/DB/issuer state live in owned ephemeral storage; no HAR/trace/storageState/query logs or secret-bearing assertion dumps. Never print cookies, tokens, CSRF, code, state, nonce or verifier values.
- Missing prerequisites, skipped required cases, failed TLS, unexpected egress and failed cleanup cannot produce PASS. No implementation or dependency installation before plan approval.

## Review Focus

- A provenance-valid manifest paired with changed/symlinked assets must fail before serving (Task1/2).
- A browser that trusts certificates only because validation/sandbox was disabled must fail preflight (Task3).
- Two apparent origins that are actually same-site must not count as cross-site cookie evidence (Task6).
- Duplicate/late code redemption and concurrent browser contexts must preserve one-use admission and account separation (Task4/6).
- A dropped successful save response, access withdrawal or cleanup failure must never become duplicate content, public visibility or a false qualification pass (Task7/8).

## Decisions, source facts and repository ownership

Inspection during planning found `AuthAdministration.bind_identity` calls the existing `public_url`, which rejects numeric IP issuer URLs. The design's provisional numeric HTTPS origins therefore cannot use the trusted binding path. Reserved `.test` names mapped only in the container resolve this without modifying validation or seeding an unsupported identity. The backend's existing test fixtures also use `.test` issuer names. Do not use shared `example.test` subdomains for both origins: they would not prove cross-site SameSite behavior.

The frontend contribution is limited to a test-artifact exporter and its tests/CI step. Backend contributions live under `tests/retailer_browser/`, optional requirements/container tooling and explicit test workflows. No harness production entry point or login UI is added to either `src/` tree.

Use separate implementation branches: frontend `test/retailer-harness-artifact`, backend `test/retailer-https-oidc-harness`. Preserve this approved spec/plan with their source refs. Separate PRs remain unmerged at the implementation review gate; no cross-repository auto-merge.

### File map

Frontend:

- Create `tools/retailer-harness/export-frontend.mjs`, `export-frontend.test.mjs`: clean-checkout build and deterministic file manifest.
- Modify `.github/workflows/ci.yml`: run the exporter unit tests, without cross-repository checkout/credentials or deployment.

Backend, all new test-owned files unless marked otherwise:

- `tests/retailer_browser/__init__.py`, `model.py`: closed non-secret campaign inputs/results and private owned-resource handles.
- `provenance.py`, `report.py`, `test_provenance.py`, `test_report.py`: artifact admission and safe complete report.
- `tls.py`, `preflight.py`, `test_tls.py`, `test_preflight.py`: ephemeral certs/trust and hard runtime gates.
- `issuer.py`, `test_issuer.py`: bounded, single-use synthetic OIDC issuer over real HTTPS in the campaign.
- `fixtures.py`, `serving.py`, `test_fixtures.py`, `test_serving.py`: fresh DB/bootstrap, trusted admin controls, static/API dispatcher and fixed callback landing.
- `browser_support.py`, `browser_protocol.py`, `browser_editor.py`: real-browser cases and tightly scoped negative fault injection.
- `runner.py`, `test_runner.py`: explicit campaign lifecycle/CLI; browser case files deliberately do not use pytest's default `test_` discovery prefix.
- `requirements/retailer-browser-py313.txt`: additional complete hash-qualified test environment including unchanged API pins.
- `tools/retailer-browser/Dockerfile`, `run-container.py`, `seccomp.json`, `environment-lock.json`, `README.md`: disposable non-root Linux runtime, pinned image/browser/dependency metadata, owned container cleanup.
- Modify `pyproject.toml`: optional `retailer-browser-harness` extra containing only exact Uvicorn/Playwright pins. No default dependency or console entry point.
- Modify `.github/workflows/tests.yml`: preserve existing API/core jobs and add separate harness-unit job; core/API jobs exclude this new optional test directory. No browser job using unavailable private-artifact credentials.
- Create `docs/qualification/retailer-https-oidc-browser.md`: reproducible commands, observed results/limitations, sources, dependency and cleanup evidence.

## Shared interfaces

`model.py` defines immutable dataclasses:

- `HarnessInputs(frontend_root: Path, manifest_path: Path, default_frontend_root: Path, default_manifest_path: Path, expected_preview_manifest_sha256: str, expected_default_manifest_sha256: str, expected_frontend_sha: str, expected_backend_sha: str, work_root: Path)`.
- `FrontendArtifact(root: Path, source_sha: str, manifest_sha256: str, preview_enabled: bool, files: tuple[tuple[str,str], ...])`; admitted file paths and SHA256 values only, no mutable unverified fallback.
- `HarnessArtifacts(preview: FrontendArtifact, default: FrontendArtifact)`; both must share the exact source and lock digest but have opposite explicitly validated preview flags.
- `CaseResult(name: str, status: Literal['passed','failed','blocked'], code: str | None, injected_fault: str | None = None)`; fixed name/code allowlists owned by `report.py`.
- `PreflightResult(ready: bool, code: str | None, runtime: dict[str,str])`; fixed metadata keys/length bounds, no raw environment/process/browser args.
- `CampaignReport(schema_version: int, status: Literal['passed','failed','blocked'], cases: tuple[CaseResult,...], cleanup_passed: bool, synthetic_browser_qualified: bool, real_provider_qualified: bool, production_enabled: bool, public_feed_connected: bool, metadata: dict[str,str])`; last three booleans are always false.

`TestClock.now() -> datetime` and `.advance(delta: timedelta) -> None` are test-owned, reject negative advances, and never exposed as HTTP endpoints. All browser operations use `playwright.async_api`; ASGI servers and browser tasks share the event loop without blocking it. The CLI uses `asyncio.run(run_campaign(inputs))`.

Private handles holding keys/tokens/browser/provider/repository use `repr=False` and are never serialized by generic dataclass dumping. The explicit serializer has an allowlist rather than `asdict` on resources.

---

### Task1: Verifiable frontend test artifact

**Files:** frontend exporter/tests/CI step from the file map.
**Consumes:** explicit clean checkout and full expected SHA, Node22 and unchanged npm lock.
**Produces:** `exportFrontend({checkoutPath, expectedCommit, outputPath, preview}): Promise<FrontendManifest>` plus CLI `node tools/retailer-harness/export-frontend.mjs --checkout PATH --expected-commit SHA --output NEW_DIR --preview true|false`.

Manifest JSON exact keys: `schema_version:1`, `repository:'galla-bit/gallant-peak-web'`, `source_commit`, `package_lock_sha256`, `preview_enabled` (actual explicit boolean), `files:[{path,sha256}]`. Paths are sorted, unique POSIX paths under `dist/`; no timestamps, links, credentials, source/test fixtures or manifest self-hash. The output contains `dist/` and `frontend-provenance.json`. Print only the manifest SHA256 and source SHA for trusted handoff; the operator supplies those expected manifest digests independently to the campaign, not by reading an untrusted digest field from the artifact itself.

- [ ] Write failing `export-frontend.test.mjs` cases: `rejects_dirty_or_wrong_head`, `rejects_existing_output_and_symlinks`, `records_sorted_exact_file_hashes`, `rejects_build_failure`, `builds_only_explicit_artifact_role`. Use owned temporary miniature Git/build fixtures; assert actual output and refusal, never an implementation-mirroring hardcoded manifest.
- [ ] Run `node --test tools/retailer-harness/export-frontend.test.mjs`; observe intended RED.
- [ ] Implement the exporter. Verify repository identity/HEAD and clean tracked/untracked source; build into a fresh owned output, set `VITE_RETAILER_EDITOR_PREVIEW=true` only for the explicit preview child, and explicitly set it to `false` for the default child regardless of inherited environment, fail on any build exit. Validate paths/links before producing the manifest, then recheck HEAD/clean source and hashes. Never install packages or clone implicitly.
- [ ] Run exporter tests GREEN; full `npm test`, `npm run build`, and explicit preview build. Export both separately hashed artifact roles from the same clean source/lock. Assert default bundle omits private workspace/test identity/digest, preview bundle includes the real editor but no test bootstrap, and roles cannot be interchanged. Add only the exporter test command to frontend CI.
- [ ] Commit frontend task `test: export provenance-checked retailer preview artifact`. Record exact frontend implementation head; all later campaign commands use that SHA, not the historical frontend baseline.

### Task2: Artifact admission and non-secret campaign contracts

**Files:** backend `model.py`, `provenance.py`, `report.py`, associated tests and package marker.
**Consumes:** Task1 manifest and explicit expected frontend/backend SHAs.
**Produces:** `validate_inputs(inputs: HarnessInputs) -> HarnessArtifacts`; `make_report(cases: tuple[CaseResult,...], *, cleanup_passed: bool, metadata: dict[str,str]) -> CampaignReport`; `write_report(report: CampaignReport, path: Path) -> None`.

- [ ] Write RED tests `test_tampered_asset_is_rejected`, `test_symlink_traversal_duplicate_unlisted_file_and_wrong_sha_rejected`, `test_replaced_manifest_with_self_consistent_hashes_is_rejected`, `test_existing_or_foreign_work_root_rejected`, `test_required_case_missing_cannot_pass`, `test_secret_like_unknown_metadata_is_not_serialized`.
- [ ] Run `python -m pytest tests/retailer_browser/test_provenance.py tests/retailer_browser/test_report.py -q --assert=plain --tb=line`; observe RED.
- [ ] Implement closed manifest/paths/hashes and exact source checks for both artifact roles, requiring matching source/lock SHAs, the correct true/false flags, and independently supplied expected manifest SHA256 values before decoding/serving any asset. A self-consistent replacement manifest is not its own provenance authority. Resolve root containment without following unapproved links; require a newly created owned work directory and known backend revision. Use fixed failure codes; never embed arbitrary exceptions. Task8 supplies the final mandatory-case names, and unknown/duplicate names are rejected.
- [ ] Run GREEN; no optional browser/server import is needed for these tests. Report pass requires a nonempty complete mandatory-case set, every case passed and successful cleanup; it never infers operational/public readiness.
- [ ] Commit `test: validate retailer browser artifacts and safe reports`.

### Task3: Reproducible isolated HTTPS and sandbox preflight

**Files:** TLS/preflight modules/tests, optional extra/lock, Docker/container tooling, environment lock, qualification dependency section.
**Consumes:** Task2 input/report types; existing `requirements/retailer-api-py313.txt` and current security configuration.
**Produces:** `create_tls_material(work_root: Path) -> TLSMaterial` defines CA certificate and app/issuer certificate/key paths owned by the campaign (private-key paths repr-hidden; CA signing key erased immediately after issuing the leaves); `preflight(inputs: HarnessInputs, artifacts: HarnessArtifacts) -> PreflightResult`; `run-container.py` accepts the same artifact/source/report arguments as the Task8 campaign CLI, including both default-artifact paths.

- [ ] RED tests cover fixed DNS SANs, CA constraints and permissions, non-loopback bind/config refusal, existing trust/profile refusal, wrong-host/untrusted-cert rejection, disabled TLS/sandbox configuration refusal, occupied443/missing browser/daemon, cleanup failure and inherited-network-policy refusal with fixed codes. Generate only temporary test material in unit tests.
- [ ] Run `python -m pytest tests/retailer_browser/test_tls.py tests/retailer_browser/test_preflight.py -q --assert=plain --tb=line`; observe RED.
- [ ] Select minimal Uvicorn0.54.0 and Playwright1.64.1 test pins; verify official PyPI release/wheel/Python requirements, hashes and advisory metadata for the entire closure at execution time. Preserve every existing API pin; if incompatible, stop for dependency review rather than upgrading API packages. Produce the complete binary-wheel hash lock; install only in an explicitly owned test environment after plan approval. Verify `pip check` and absence of legacy HTTPX.
- [ ] Pin the official Python3.13.18 slim-bookworm base by registry digest in `environment-lock.json`, OS/browser-support packages and Playwright browser revision/archive or installed-tree digest. Retrieve the reviewed Playwright seccomp profile from an exact upstream commit, preserve the default policy and only documented user-namespace additions; record its digest. Build through the environment's approved proxy/CA workflow, never insecure download flags. No Dockerfile/global tool installs are executed during planning.
- [ ] Implement per-run CA and exact `app.gp-retailer.test` / `id.gp-issuer.test` leaf certificates under container-owned tmpfs with private-key mode0600. Trust the CA only in the disposable user's Chromium NSS store (`/home/qualifier/.local/share/pki/nssdb` for the pinned Chromium, verified by probe) and an explicit HTTPX2 verified SSL context; close that transport. Do not change Windows/host trust or reuse real profiles.
- [ ] Runtime: owned labelled container, `--network none`, no published ports, fixed container-only `--add-host` entries to127.0.0.1/127.0.0.2, `--user qualifier`, `--cap-drop ALL`, exact seccomp profile, `--init`, bounded resources and private `--shm-size` rather than host IPC. Permit443 via `net.ipv4.ip_unprivileged_port_start=0` only in its private network namespace; do not set host sysctls/capabilities. Source/artifacts mount read-only; keys/DB/home are disposable. Browser launch uses `chromium_sandbox=True`, TLS validation enabled and no unsafe flags.
- [ ] Preflight must execute real verified HTTPS probes for both origins, reject a wrong/untrusted certificate, launch the sandboxed browser with its disposable trust, check endpoint containment, and prove no unrelated external destination is admitted. This runs before identity/session/content setup. Missing Docker, kernel sandbox support or port/trust capability returns BLOCKED/nonzero; do not repair the user's OS or alter managed network policy. No preflight may claim success from configuration alone.
- [ ] GREEN tests, runtime dependency checks and actual preflight evidence if the qualified runtime is available. Add a separate harness-unit CI job installing the new hash lock; existing core/API jobs exclude `tests/retailer_browser` and otherwise keep their dependency boundaries. Commit `test: prepare isolated verified HTTPS browser environment`. If actual preflight is blocked, report the exact prerequisite and stop browser execution; pure harness work may remain reviewable but unqualified.

### Task4: Single-use synthetic network OIDC issuer

**Files:** `issuer.py`, `test_issuer.py`.
**Consumes:** Task3 TLS and fixed issuer/client/callback values; existing Authlib/cryptography/joserfc and shared test clock.
**Produces:** `create_issuer(*, issuer_origin: str, client_id: str, redirect_uri: str, clock: Callable[[], datetime]) -> SyntheticIssuer`; `.app` ASGI; `.select_fault(case: str | None)`, `.safe_counts() -> dict[str,int]`, `.close()`. Private auth state/key material is hidden and never returned as report data.

- [ ] Write RED cases for exact discovery/JWKS metadata, RS256 key use, S256, client/callback/scope pinning, bounded authorization fields, one-use code/expiration, nonce binding, two concurrent distinct transactions and invalid/replayed codes. Negative signed-claim/header variations mirror existing `tests/retailer_api/issuer.py`; add no arbitrary identity/authority claim acceptance.
- [ ] Run `python -m pytest tests/retailer_browser/test_issuer.py -q --assert=plain --tb=line`; observe RED.
- [ ] Implement only `/metadata`, `/authorize`, `/authorize/choose`, `/token`, `/jwks`. Test-only A/B choice is explicitly synthetic; bind its one-use choice ticket to that authorization transaction. Code lifetime60s, bounded state stores and atomic consumption; code, PKCE verifier, client and exact callback must agree. Generate ephemeral RSA key/nonce/code values; no reusable secret fixtures or arbitrary response URLs. Claims/times use the same campaign clock as the API. Metadata/token/JWKS use real HTTPS during browser campaigns, not injected successful transport.
- [ ] GREEN all issuer tests, including concurrency and teardown. Log only fixed codes/counters; no request/response/query dumps. Commit `test: add ephemeral signed network OIDC issuer`.

### Task5: Fresh synthetic authority and real API/static composition

**Files:** `fixtures.py`, `serving.py`, associated tests.
**Consumes:** Task1/2 artifact, Task3 TLS, Task4 issuer; existing `SQLiteRetailerRepository`, `RetailerService`, `AuthAdministration`, schema migration and real API/provider factory.
**Produces:** `create_fixture(work_root: Path, *, issuer: str, clock: TestClock) -> FixtureState`; `create_serving_app(artifact: FrontendArtifact, *, api_app: ASGIApp, issuer_authorization_url: str) -> ASGIApp`; async context manager `open_runtime(inputs: HarnessInputs, artifacts: HarnessArtifacts, *, frontend_role: Literal['preview','default'] = 'preview') -> HarnessRuntime` owning fixture, issuer, TLS listeners and provider transport.

`FixtureState` owns repr-hidden `repository`, `service`, `administration` and `clock`, plus `.grant(account_id: str, store_id: str, capabilities: tuple[Capability,...])`, `.revoke(account_id: str, store_id: str)`, `.withdraw(store_id: str)`, `.reactivate(store_id: str)`, `.disable_account(account_id: str)` and `.advance_clock(delta: timedelta)`, all returning `None` and using trusted current revisions. `HarnessRuntime` exposes the private fixture/issuer handles, fixed app/issuer origins and `.safe_counts() -> dict[str,int]`, and closes through its async context manager; it has no network-accessible control interface. The Task3 TLS/probe resources and Task5 listeners are independently cleaned up on partial startup failure.

- [ ] RED tests: existing/aliased DB refusal; synthetic bootstrap binds reserved issuer through `AuthAdministration.bind_identity`; A/B stores/current grants; no sessions pre-issued. Assert account/grant revocation uses current expected revisions and canonical domain services, not browser request authority.
- [ ] RED serving tests: exact `/auth/*` and `/api/retailer/v1/*` delegation preserves scheme/Host/Origin/method/cookies; fixed GET `/retailer` landing only; query/return URL/unsupported method rejected; static MIME/containment/allowlist; no database/key/source leakage; test login starter validates its fixed issuer destination.
- [ ] Run `python -m pytest tests/retailer_browser/test_fixtures.py tests/retailer_browser/test_serving.py -q --assert=plain --tb=line`; observe RED.
- [ ] Implement scratch-only database initialization and explicit v1->v2 migration using existing trusted functions. Bootstrap only synthetic base account rows locally, approve relationships using `RetailerService.approve_relationship`, bind identities and grant/revoke membership using `AuthAdministration` with `BindIdentity`/`MembershipAccess`. Expose trusted test controls as Python methods on `FixtureState` for grants/revocation/account disable/clock advance; no HTTP control endpoint. No direct session issuance or cookie seeding.
- [ ] Implement no-store/no-referrer serving: route the unchanged API object under root paths; serve only admitted built files; GET `/retailer` redirects to constant `/gallant-peak-web/#/retailer`. Test-only `/qualification/login` calls real bootstrap/login from browser JS and navigates only to configured issuer `/authorize`; its local nonce/CSP script does not enter the shipped frontend. Preserve API response headers; configure Uvicorn with `proxy_headers=False`, no forwarded-header trust, disabled access/query logs and no debug/trace exception-local logging; no proxy identity headers or altered response cookies.
- [ ] Open two owned TLS Uvicorn listeners with bounded startup/shutdown deadlines and real API `OIDCProvider` using an HTTPX2 TLS transport that trusts only the campaign CA and retains endpoint pinning. `open_runtime` fails without Task3 preflight. GREEN tests plus existing API regression suite. Commit `test: compose real retailer API with synthetic HTTPS serving`.

### Task6: Real-browser authentication, cookies and negative protocol cases

**Files:** `browser_support.py`, `browser_protocol.py`; extend only test fixtures/issuer for necessary fault knobs.
**Consumes:** `HarnessRuntime`, real browser contexts, fixed `CaseResult` outputs.
**Produces:** `async run_protocol_cases(runtime: HarnessRuntime, browser: Browser) -> tuple[CaseResult,...]`; reusable `async sign_in(page: Page, account: Literal['a','b']) -> None` through the test login document/issuer UI, never through injected sessions.

- [ ] Write negative fixture tests before helpers, then real-browser scenarios with no positive route fulfillment: `protocol_a`, `protocol_b`, `cookie_boundary`, `cross_site_origin`, `bad_csrf`, `oidc_negative`, `callback_replay`, `valid_session_survives_unsolicited_callback`, `logout_and_expiry`. The runner's explicit browser command must fail if these cases are skipped or cannot execute.
- [ ] Observe each scenario's intended RED with a controlled fault (wrong nonce, ignored CSRF, missing route adapter or missing trust in the fixture), then restore the real guard and verify GREEN. Do not weaken application source to stage RED; change only test-owned inputs/issuer behavior.
- [ ] Cookie assertions inspect only names/flags/host/path/expiry metadata and boolean value-rotation equality, never print values. Assert `document.cookie` lacks the auth cookie, distinct contexts do not share it, and the actual cross-site navigation carries the required pre-login cookie to callback. Distinct-host strings are insufficient: capture the callback request's boolean cookie-present and `Sec-Fetch-Site` classification safely at the test-owned wrapper, without retaining raw headers/query. Cross-site unsafe requests from the issuer origin must fail; missing/wrong same-origin CSRF must fail.
- [ ] Run the real library against invalid state/nonce/code/verifier/signature/issuer/audience, code replay and an unsolicited callback during a valid session. Assert zero authenticated session issuance for rejected cases and preservation of the existing session where required. Replayed concurrent callback yields at most one authenticated admission.
- [ ] Use trusted injected clock advance for server-side expiry and label it explicitly. Do not claim real wall-clock cookie expiry. Check real POST logout clears cookie/session; failed/dropped logout confirms the editor's unconfirmed copy in Task7. No live provider/MFA/recovery claim.
- [ ] Verify GREEN in the qualified offline container. Commit `test: qualify real browser OIDC and cookie boundaries`.

### Task7: Real-editor canonical writes, ambiguity and authority loss

**Files:** `browser_editor.py`, tightly scoped support helpers; no frontend production hook.
**Consumes:** real API/editor/browser, Task6 login helper, trusted fixture controls and `CaseResult`.
**Produces:** `async run_editor_cases(runtime: HarnessRuntime, browser: Browser) -> tuple[CaseResult,...]`; `async run_default_case(inputs: HarnessInputs, artifacts: HarnessArtifacts, browser: Browser) -> CaseResult` opens a new owned runtime with `frontend_role='default'` after the preview runtime has closed.

- [ ] Define RED browser cases `canonical_edits`, `result_correction`, `immutable_save_retry`, `etag_compare`, `store_session_isolation`, `authority_revocation`, `logout_unconfirmed`, `publication_boundary`, `default_build_boundary`. Assert DOM plus real DB/canonical revision/receipt outcomes, not just client status text.
- [ ] Use the real editor to create/update profile, news, local listing and canonical event/result; correction must name the currently loaded prior revision and require fresh explicit consent. Check canonical IDs retained and no browser-provided organiser/verification authority.
- [ ] For `immutable_save_retry`, forward the actual save to the real API, commit it, then drop exactly that response. The explicit retry must use the same method/path/body/precondition/key and yield one saved record/revision; do not record secret header values or fulfill a fabricated successful receipt. For `etag_compare`, make a trusted competing same-record edit, preserve the user's rejected input, compare current canonical content and require deliberate adoption. Mark these cases as injected faults.
- [ ] Delay a real response, switch stores/log out, release it and prove no old-scope data/intents/publication appears. Revocation/relationship withdrawal must deny the next real operation; re-enable alone cannot revive staff grants. Use separate contexts and explicit temporary multi-store grants; no UI membership assumption.
- [ ] Verify logout failure only through negative transport fault; local clearing is not claimed as server logout. Observe queue statuses without starting any publisher, changing a public consumer or establishing a Verified badge. Test default artifact separately with preview absent: private route404, existing public navigation and no private bootstrap, no test issuer/bootstrap/digest in either bundle. A preview-only artifact is not sufficient: use the separately built and admitted default artifact, a fresh browser context and a fresh owned runtime whose request counters start at zero.
- [ ] GREEN protocol/editor suites in the qualified container and full existing frontend tests/builds. Commit `test: qualify retailer editor against real synthetic browser sessions`.

### Task8: Bounded runner, cleanup, CI and final review gate

**Files:** `runner.py`, `test_runner.py`, final safe report schema/case list, container runner/readme, backend CI additions, qualification report.
**Consumes:** Tasks1–7; exact artifacts, source SHAs, runtime preflight and all case results.
**Produces:** `async run_campaign(inputs: HarnessInputs) -> CampaignReport`; explicit CLI `python -m tests.retailer_browser.runner --frontend-root PATH --manifest PATH --frontend-sha SHA --backend-sha SHA --default-frontend-root PATH --default-manifest PATH --preview-manifest-sha256 SHA256 --default-manifest-sha256 SHA256 --work-root NEW_DIR --report SAFE_JSON` inside the owned container. Artifact role admission is explicit and cannot be interchanged. After preview protocol/editor cases, close that runtime completely before opening the separate default-artifact runtime; occupied ports or failed cleanup stop the campaign rather than retrying or overlapping listeners.

- [ ] RED unit tests name every required case from Tasks6/7; missing/duplicate/failed/blocked/skipped case, timeout, trust/preflight denial, foreign resource or teardown exception cannot set `synthetic_browser_qualified=true`. Failure metadata accepts only fixed categories. Unit tests do not require Playwright/server imports at collection time.
- [ ] Run `python -m pytest tests/retailer_browser/test_runner.py tests/retailer_browser/test_report.py -q --assert=plain --tb=line`; observe RED.
- [ ] Implement campaign lifecycle: verify both artifact roles and backend SHA; preflight before DB/identity creation; run cases with 30s page/API-operation bounds and 15-minute global campaign deadline; no unbounded retries. Negative/revocation fixtures reset between scenarios to avoid rate-limit/account-state cross-contamination; do not disable actual throttles.
- [ ] Close owned browser contexts/process, HTTPS listeners, provider transport, DB/issuer state; remove ephemeral secrets/DB/trust, then compute pass and atomically write the safe report. Container controller waits for teardown acknowledgement before forcibly removing only its owned container on deadline. Failed/uncertain cleanup downgrades pass. Keep safe source/runtime/case metadata, no sensitive screenshots/traces or exception-local dumps.
- [ ] Run current complete backend suite, harness-unit suite, core-without-API suite and dependency/compile checks. Run current complete frontend suite plus both builds/exporter tests. Preserve ordinary CI default/core coverage and add explicit optional-harness unit coverage. Browser execution remains a separate opt-in command with supplied artifact inputs; no unconfigured private cross-repository workflow credential or skipped required-browser job is called qualified.
- [ ] Execute the actual sandboxed verified-HTTPS campaign if preflight permits; otherwise record BLOCKED with specific safe prerequisite. Record the exact complete test counts, browser cases, source/artifact/environment hashes, fixed injected faults, real cleanup results and limitations in `docs/qualification/retailer-https-oidc-browser.md`. Never substitute units for unavailable browser evidence.
- [ ] Independent whole-branch review: actual cookie/Origin/TLS/PKCE/admission handling, artifact containment, concurrency, positive-path non-mocking, canonical ID/revision preservation, client scope clearing, no production imports, safe diagnostics/cleanup. Reproduce material findings RED, fix, full relevant GREEN, re-review. Push separate frontend/backend PRs and verify exact-head CI. Stop for owner implementation/merge review; no merge, deployment, real provider activation or public integration.

## Self-review resolutions and acceptance matrix

Spec coverage: provenance Task1/2; real TLS/runtime Tasks3/5; issuer/PKCE Task4/6; routing Task5/6; authority/editor Task5/7; default/public boundary Task1/7; safe reports/cleanup/blocked execution Task2/8; independent review/exact-head CI Task8. No real provider/public projection/production gate is silently included.

Execution method recommendation: **Native implementation with an independent whole-branch review**, using the existing APIs and explicit task interfaces, keeps this tightly coupled harness in one implementation context. A fresh review is mandatory before the final PR gate. If the owner chooses per-task subagents instead, preserve the same task contracts and approval boundaries.

## Planning provenance and sources

Design approved in chat on3 November2026 at docs PR #17 head1893d2e0101fb3e9567004b2db09f4bc60b65524. Numeric-origin incompatibility was found by reading actual `AuthAdministration.bind_identity` and `retailer_spaces.validation.public_url`; the reserved-hostname resolution preserves the approved isolation/security approach.

Official planning references inspected on3 November2026: PyPI [Uvicorn0.54.0](https://pypi.org/project/uvicorn/0.54.0/) and [Playwright1.64.1](https://pypi.org/project/playwright/1.64.1/), [Uvicorn settings](https://uvicorn.dev/settings/), [Playwright Docker/version/sandbox guidance](https://playwright.dev/python/docs/docker), [Chromium Linux certificate management](https://chromium.googlesource.com/chromium/src/+/main/docs/linux/cert_management.md). Version selection is not an installed compatibility/security qualification; Task3 must resolve hashes and prove compatibility before using them. The selected chat environment currently has no Docker executable available; no qualified runtime is claimed, installed or started by this plan.

Plan only. No implementation, dependency install, trust/profile/hosts change, issuer configuration, listener or production action has occurred. Owner plan approval is required before execution.
