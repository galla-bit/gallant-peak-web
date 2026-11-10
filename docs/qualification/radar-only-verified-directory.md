# Outbound-only Verified Stores directory (draft)

The public TCG Hunt Verified Stores tab now renders `VerifiedStoreDirectory`, a minimal store-card surface. It never opens an internal retailer profile, displays demo MythicDeck as verified, or claims a live retailer feed. Cards require an explicit authorised relationship reference and a valid HTTPS website URL supplied by trusted configuration. Monitored retailers are not authorised.

The legacy retailer-profile and contextual editor components are retained for compatibility with existing routes and draft retailer-auth/browser work; they are **not removed or security-qualified** by this PR. An explicit follow-up must retire or reroute the old public `/tcg-hunt/stores/:storeId` route after its editor dependencies are reviewed. The TCG Radar product feed and its 15-minute delay are unchanged. No retailer feed is connected.
