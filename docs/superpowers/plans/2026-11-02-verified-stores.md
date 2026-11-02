# Verified Stores implementation plan

Goal: implement Nathan’s approved architecture in the existing Stores insertion point.
Architecture: relationship-only directory admission; generic retailer spaces; explicitly separate MythicDeck demonstration. Reuse EventsView and canonical organiser-linked event records. No stock-feed changes or Shopify connection.

1. Tests first: rename navigation and exercise directory/preview navigation, authorisation exclusion, retailer-local products/news, and independent canonical events/results.
2. Add retailer types, admission selector, organiser-scoped event projection and a static demonstration fixture. No actual authorised retailers are configured.
3. Add directory/profile with Overview, Products, News & Updates, Events & Competitions. Keep demonstration opt-in and labelled throughout. Integrate the existing Stores slot and an explicit Events demonstration toggle; never substitute demo for a failed public feed.
4. Run focused tests after observing expected failures, then complete frontend suite and production build. Review diff for publication leakage and status confusion. Stop for Nathan’s review; no merge/deploy or legacy cleanup.

Implementation calls: static trusted frontend configuration is a presentation boundary, not a retailer onboarding authority. Future backend must authenticate and authorise relationships. Products stay local with Gallant Peak publication policy stated. Demonstration time is fixed and visibly identified, separate from public feed freshness.
