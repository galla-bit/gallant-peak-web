# Radar product visibility: free vs paid (draft contract)

## Product card rules
- Public: show product/game, aggregate availability and **number of distinct retailers with currently validated in-stock offers** (e.g. "2 retailers in stock"). No retailer identity, retailer-specific URL, retailer ID, per-retailer observations, or hidden comparison panel.
- Paid member: show the **same exact in-stock retailer count** and individual validated offers; each retailer name itself is the outbound HTTPS product link. No separate generic "View at" label. Deduplicate observations for the same retailer and product using the newest validated observation. Never label unknown/limited/out-of-stock as in stock.
- Paid-only identities are not an entitlement to real-time stock. Preserve observation timestamps and clearly label any delay. Checkout and availability are confirmed at retailer.
- Never infer membership from a client toggle or user-supplied request header. Require a server-validated membership/session entitlement. Expired or revoked membership falls back to the public projection.
- **Public API must not serialize paid-only fields**, even if the frontend hides them. Public feed v1 currently includes `id`, `retailer`, and `retailer_url` and is **not suitable** for the proposed public tier. Do not ship UI-only concealment.
- Define versioned public aggregate and member detail contracts, server-side authorization, and separate caches (public aggregates may be delayed; member details must not enter shared public caches). Keep revocation and product approval checks at both boundaries.
- Public counts must not expose hidden identities through stable retailer IDs, product URLs, or diagnostic metadata.
- Counts are for distinct retailers whose latest validated offer is `in_stock`. When multiple observations exist, resolve the latest per retailer before computing counts; never count historical duplicate observations as additional stores.
- Prices must be computed from the same eligible offer set and clearly indicate their freshness; if a price cannot be disclosed safely, omit it rather than leak offer metadata.

## Release gates
1. Backend produces a genuinely redacted public aggregate feed and an authenticated member feed.
2. Tests assert public responses have **no** retailer identifiers or URLs, and paid responses use retailer-name links.
3. Entitlement expiry/revocation and canonical product withdrawal suppress detail immediately on subsequent requests.
4. Cross-tier caching, direct URL access, 15-minute delay policy, and browser tests pass.
5. Independent security review and owner approval before merge/deploy.

This document specifies desired behaviour; neither paid membership nor the new backend feed is implemented by this draft.
