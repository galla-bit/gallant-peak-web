# Stage 2 frontend: public-only routes and contract regression

The public `/tcg-hunt/verified-stores/:storeId` route now redirects to `/tcg-hunt` with Verified Stores selected. It no longer mounts the contextual retailer editor from the public route. Existing retailer authentication and editor source files remain untouched, pending a separate decision on private editor UX.

The new synthetic end-to-end contract test feeds the existing TCG v1 public snapshot parser with the backend's declared delayed JSON shape, renders the Radar offer and verifies the external retailer product URL. This is an offline cross-component contract fixture, **not** an actual network or backend process integration test. No live retailer or store website is configured.

Production blockers remain: authenticated backend publication and serving, verified-store directory feed, real Shopify connector, cross-repository contract harness, and browser qualification.
