# Harness artifact continuation after merged PR20

Binding plan/spec: frontend draft PR17, head
`fccca2565215a8425cc616312fcc89afbf92e252`. PR19 remains draft/unmerged.
Original PR19 head: `c28520a3fa3f6eca2e5088b1b9beb9540db79afe`.
Verified frontend main: `04ed5b5b1a3bc96a603d2976eaaebcdd2d2479a6`.
Backend draft PR14 observed head: `6594f0a0bfad5a61dcb6b879ce0435856cd3351f`.

## Execution ledger / rulings

Ruling: update PR19 with a normal merge of current main, preserving its existing
exporter commits rather than rebuilding or force-pushing reviewed history. The
cost is an extra merge commit; no existing implementation is discarded.

Ruling: PR20's default contextual editor conflicts with the binding synthetic-only
artifact boundary. Keep `/retailer` and the PR B callback bridge intact, but require
the existing exact `VITE_RETAILER_EDITOR_PREVIEW=true` for contextual editing.
The default artifact remains read-only even for a capable opaque session.
Public-store pages in the default role do not bootstrap private sessions; the
explicit `/retailer` resolver remains available as introduced by PR B. Tests
first reproduced that unwanted public-store bootstrap, then passed after the
existing session hook gained a read-only disabled mode for those pages.
This minimally changes contextual activation/rendering; backend authority, private
client paths, cookies/CSRF and real editor implementations are unchanged. The cost
is that contextual qualification must explicitly use the preview role. This is
not a real-provider/production enablement decision.

Ruling: historical default-private-route-404 assumptions apply to the older
`/retailer-preview` route, not the merged `/retailer` resolver. Future browser
cases must enter the current store resolver/contextual Edit Store flow, preserving
its chooser and foreign/demo handling. The test-only serving adapter still has
its constant destination; no arbitrary callback/return-URL change is introduced.

Observed RED: default-capable sessions exposed Edit Store for absent/false/TRUE
flags (3 failures); exporter accepted a default contextual-editor leak (1 failure).
The exact flag gate and both-role marker checks made these tests GREEN.

Observed RED: Windows could not execute the existing npm.cmd launch (2/7 exporter
tests failed build_failed even with npm on PATH). Invoke the trusted npm CLI via
the existing Node executable on Windows, with argument arrays and no shell
interpolation. A generated link uses an owned directory junction there, preserving
the same symlink refusal assertion without requiring host file-link privileges.
All eight exporter tests pass; no provenance checks were relaxed.

Independent review found no Critical/Important issue, independently passed all
eight exporter tests and 39 role/contextual/store tests, and confirmed the
BLOCKED/UNQUALIFIED disposition. The stale backend documentation finding is
addressed in the continuation update to its qualification document.

## Verification and downstream handoff

Run Node exporter tests, the full frontend suite, default TypeScript/Vite build
and explicit preview build. Default assets must omit both private-workspace and
contextual-editor markers; explicit preview assets must include both. Neither
artifact includes test issuer/bootstrap or pinned fixture digest material.

Observed continuation verification on Node22.22.2: eight Node exporter tests and
319 frontend tests across46 files passed. Default and explicit preview production
TypeScript/Vite builds passed; diff whitespace check passed. The official Windows
Node22.22.2 archive was SHA-256 checked against its published SHASUMS256 entry:
`7c93e9d92bf68c07182b471aa187e35ee6cd08ef0f24ab060dfff605fcc1c57c`.
Windows build/unit evidence does not qualify the target Linux browser runtime.

Export from the final clean exact implementation head using both explicit roles.
The exporter prints each manifest SHA-256, independently supplied downstream;
the manifest lists exact asset hashes. The backend qualification report records
the final implementation head and both generated manifest digests, avoiding a
self-referential source commit in its own manifest.

This reconciliation is unit/build/provenance evidence only. The available host
has no Docker engine/runtime; OS package/browser-tree lock fields and real
sandboxed verified-HTTPS preflight remain unresolved. Browser campaign remains
BLOCKED / UNQUALIFIED. No deployment, trust/hosts change, provider/retailer
activation, public projection, or production enablement occurred.

## Foundation security follow-up (4 November 2026)

Preserves the continuation above, including contextual editor gating and Windows
npm CLI launch. Adds the earlier independent foundation review fixes: refuse
ignored build inputs outside installed node_modules, reject inherited Git source
and config overrides, and validate the physical output parent before staging.
Ignored public files/links, aliased outputs and Git override regressions were
observed failing before remediation. Eleven exporter tests and319 UI tests pass
locally after reconciling both histories. Supported Node22 CI follows.

Normal merge-ref UI/build validation remains enabled. A separate job checks out
the exact PR head and exports both roles from its own clean checkout, avoiding
dist files from an earlier build contaminating source admission. These new
changes require fresh manifest digests; historical hashes are not current handoff
values. Browser campaign remains BLOCKED / UNQUALIFIED.
