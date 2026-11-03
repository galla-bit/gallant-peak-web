# PR B: retailer session resolver and store route

Implements the owner's supplied PR B specification. Baselines: frontend
697445089c61673fbf8e0f99f81b790175bd3a51; backend
d450aea2186b5556fd6fe1dda10e19fa31ca20c2 (both backend checks green).

Reuse the strict private client/session and public RetailerProfile. Add login,
closed management decoding, an entry resolver and a route-addressable store
shell. Keep HashRouter. The existing default-off editor preview remains isolated;
the new route never imports or mounts its forms. No new dependency.

Alternatives: replacing HashRouter/hosting exceeds this milestone; a new dashboard
duplicates the public store space and conflicts with the approved UX. Reusing
the public renderer and adding a small resolver fits the current architecture.

Public store projection is currently unconnected. Private membership must not
manufacture public Verified status. A currently accessible private store can
resolve to its named route shell with an explicit public-content-unavailable
message; a trusted public projection, when supplied, uses the existing profile.
Foreign/missing stores reveal no private names. Demo profiles never show owner
controls even if their ID appears in a private response.

Session bootstrap is in memory, no-store and same-origin. Recheck on focus and
visibility return and expire presentation locally at the server session deadline.
Clear hints during revalidation and errors; ignore obsolete responses. Never
interpret hints as authority. Login bootstraps CSRF, POSTs {}, validates the
backend authorization URL as HTTPS, and navigates only on an explicit click.
Logout uses current CSRF. No content writes are added.

Production requires same-origin HTTPS routing for /auth/*, /api/retailer/v1/*,
and the fixed origin-root /retailer callback destination. GitHub Pages alone
cannot satisfy this. A future application/reverse proxy must serve the shell
there and preserve API security headers without applying API-only CSP to HTML.
Hash routing and asset base need deployment qualification; no deployment claim.
