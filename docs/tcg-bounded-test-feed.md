# TCG Hunt bounded test feed

This branch contains a deliberately synthetic public-feed artifact for bounded web-consumer transport testing.

## Boundary

- Synthetic data only. It is not retailer stock intelligence.
- No TCG Hunt collector, ChangeDetection, Discord, credential, trusted/admin bridge, or production runtime connection is used.
- The artifact exists only to exercise the existing browser -> HTTPS -> v1 contract -> TCG Radar path.
- The existing one-hour freshness rule remains unchanged. The artifact is intentionally short-lived and should fail closed as stale after the test window.
- This work grants no live-data, public-egress-from-TCG-Hunt, migration, sender, credential, or PR #28 controlled-live authority.

## Test endpoint

For this branch, the synthetic JSON can be addressed over GitHub's HTTPS raw-content surface. A review/test build may set `VITE_TCG_PUBLIC_FEED_URL` to that branch-scoped raw JSON URL. Production configuration remains unchanged.

The artifact and its automated test require all records to be visibly marked `SYNTHETIC TEST` and use `example.com` retailer links so they cannot be mistaken for genuine retailer observations.
