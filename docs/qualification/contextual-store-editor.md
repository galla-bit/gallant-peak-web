# PR C qualification: contextual Edit Store

Frontend starting main: `1dfe01a9032ddf29ccf761c0757f9a8a6312a43a`.
Backend main: `d450aea2186b5556fd6fe1dda10e19fa31ca20c2`.
Both verified before edits and again before PR creation. Existing isolated
linked worktree reused on `feat/contextual-store-editor`; no backend edits.

Baseline: 283 tests and TypeScript/Vite production build passed.
Final verification: 32 PR C tests across 3 files; 168 retailer/session/routing/
Verified Stores tests across 31 files; all 315 tests across 45 files passed.
Production TypeScript/Vite build and git diff --check passed. Pinned upstream
OpenAPI fixture was compared with the exact backend source JSON and is equal.
No dependencies or hosting configuration changed.

Observed RED before contextual activation: 9 failures showing no editor for
owner/profile/errors/unsaved cases; existing foreign/demo/all-false checks
already passed. Publication-copy/new-command tests produced 6 intended failures,
then passed after minimal copy/workflow changes. Additional tests exercise
existing canonical client/form behaviour through the new contextual entry.

Independent review found five material lifecycle issues: editing scope surviving
store changes, stale-CSRF writes after opaque-session change, simultaneous event
and result drafts, same-record selection clearing dirty protection, and stale
history position after same-route router PUSH. Each was reproduced with a failing
regression test, fixed, and independently re-reviewed. The final review passed
31 tests across 3 suites, found no remaining material findings and approved
within scope. A final local-listing/global-surface test brings PR C coverage to 32.

Current capability hints select editor sections only. Server-authorised profile,
news, listings, events and nested results remain canonical. There are no browser
actor/organiser/verification claims or promotion controls. Events publishing is
not offered when events_publish is false; results-only access can select a
canonical event without event editing. Public profile remains separate from
private form state; saved local products never mutate global feed consumers.

401 freezes visible in-memory drafts and stops writes; changed CSRF also freezes
them. 403 closes/aborts editing and removes management presentation. 412/422/503
retain input. Explicit ambiguous retry retains immutable body/key; editing as a
new command creates a new key. Unsaved guards cover sections, records, exit,
logout, route links, Back/Forward and beforeunload. Real HashRouter history test
checks cancelled Back after A-to-B navigation restores both B URL and B UI.

Save receipt and projection status are separate. Exact labels are Awaiting
projection, Projection processed, No public projection required and Publication
status unavailable. No acknowledgement claims public visibility. Canonical
Recent Winners tests and PR B callback/session/multi-store regressions pass.

Limits: production same-origin HTTPS auth/API serving, fixed /retailer shell and
asset-base handling remain deployment prerequisites. Public retailer projection
remains unconnected; private membership never fabricates a public Verified badge.
Synthetic frontend tests do not qualify real OIDC/browser-cookie deployment.

Stop at one dedicated PR C review/merge approval. No merge/deployment/real
provider or retailer activation, reverse-proxy change, or unrelated cleanup.
