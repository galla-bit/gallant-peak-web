# PR C contextual store editing

Owner supplied the scope and UX in the PR C handoff. Frontend baseline
1dfe01a9032ddf29ccf761c0757f9a8a6312a43a; backend baseline
d450aea2186b5556fd6fe1dda10e19fa31ca20c2, both verified before editing.

Reuse the existing private client/forms inside VerifiedStoreRoute, beneath the
existing public profile. Keep public feeds independent and never synthesize a
public projection from private records. No new dashboard, backend or hosting.
The prior preview remains isolated. No new dependencies.

Capability hints decide available editor sections; backend reauthorizes reads
and writes. Profile/news/listings use their own hints. Events and results share
canonical event selection, with separate write/results permissions and restricted
event states when events_publish is false. Public/demo/foreign/all-false remain
read-only. A 403 destroys the editing scope; a 401 freezes the mounted form and
retains draft text only in memory with a sign-in link. Revalidation temporarily
disables editing without destroying drafts. No automatic write retry.

An editing context tracks unsaved forms and guards section/record selection,
exit, logout, link navigation, browser history and beforeunload. Confirmed
navigation discards in-memory work. Route/store changes dispose the scope.
Opaque cookies/CSRF, ETags/preconditions, immutable idempotent retry commands and
strict decoders remain in the existing client. Changed commands use fresh keys.

Publication copy distinguishes save receipts from projection processing, using
the owner's exact four labels and never claiming public visibility. Existing
Recent Winners, canonical domains, PR B bridge and chooser must remain intact.

Alternatives considered: enabling the preview dashboard would violate contextual
UX; rewriting the working client/forms adds unnecessary contract risk. Reuse with
small lifecycle/capability extensions is the chosen implementation approach.

Same-origin HTTPS auth/API serving, callback shell/asset routing and independent
public projection remain deployment prerequisites. No deployment/activation.
