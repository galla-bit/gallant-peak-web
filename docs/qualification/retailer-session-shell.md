# PR B qualification

Starting frontend main: `697445089c61673fbf8e0f99f81b790175bd3a51`.
Backend main: `d450aea2186b5556fd6fe1dda10e19fa31ca20c2`.
Both rechecked before PR creation. Backend post-merge pytest/core-without-api
checks were successful. Backend code is unchanged.

Baseline: 230 frontend tests passed; TypeScript/Vite production build passed.
Final focused suite: 8 files, 51 tests passed. Full suite: 40 files, 274 tests
passed. Production build and git diff --check passed. No new dependencies.

Observed RED before implementation: management object rejected and login method
absent (6 failures); resolver placeholder missing all 8 required states; store
route placeholder failed 12 cases; hash routing integration failed 2 cases.
GREEN followed each implementation. Upstream OpenAPI fixture JSON was compared
against the exact backend merge and is equal, with canonical SHA-256 pinned.

Independent review found a P2 logout/read race and P3 fallback back-navigation
issue. Each was reproduced with a failing regression test, fixed and rechecked.
Logout is now independent of read aborts and its in-memory result survives route
mounts; focus/navigation cannot restore old hints. HTTP 401 during login/logout
also returns to anonymous state. Reviewer rechecked both fixes, passed 24 focused
tests and approved within PR B scope with no unresolved findings.

Coverage includes anonymous/zero/one/multiple stores, deliberate selection,
foreign store/name/organiser spoofing, strict management decoding, disabled
owner affordance, demo-ID collision, private failure preserving public pages,
current canonical event/winner filtering, hash routes and keyboard focus,
CSRF logout/login, expiry, late responses, focus/visibility revalidation and
no browser token storage. Existing product isolation and Recent Winners tests
remain in the passing full suite. No content write request is introduced by
the new routes; pre-existing editors remain gated at /retailer-preview.

Limitations: the public retailer projection remains unconnected. A private
accessible store resolves to a named unavailable-content shell without claiming
public Verified status. Same-origin HTTPS serving of the private API/auth paths
and the fixed /retailer callback destination remains a deployment prerequisite.
No real OIDC/cookie/browser integration, deployment, retailer/provider activation,
or production write form is qualified by these synthetic frontend tests.

Stop at dedicated frontend PR review/merge approval. No PR C work.
