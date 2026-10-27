# TCG Radar Product-First Design

## Intent

Turn Gallant Peak's TCG Radar from a flat retailer-listing surface into a product-first NZ TCG discovery and comparison experience while preserving the existing trust boundary: TCG Hunt remains the stock-intelligence authority, the website consumes only deliberately public delayed data, and retailer checkout remains external.

The approved customer flow is:

**Discover product → choose product → compare NZ retailers → inspect stock freshness and retailer status → View at Retailer → retailer checkout.**

## Goals

- Make products, rather than individual retailer observations, the primary browsing unit.
- Group retailer offers under a product comparison surface.
- Keep freshness and uncertainty visible; never turn collector failure into an out-of-stock claim.
- Support Pokémon, One Piece, Dragon Ball, Yu-Gi-Oh, and future games without a Pokémon-only structure.
- Provide three primary views: **Products**, **New & Upcoming**, and **Stores**.
- Support GallantDiscoveries release intelligence as a distinct future/public input rather than pretending stock observations contain release intelligence.
- Represent retailer relationship separately from stock truth: ordinary monitored retailer, Verified Retailer, and Peak Partner.
- Allow a clearly labelled MythicDeck proposed-pilot/demo presentation without implying live collection, permission, or commercial status.
- Preserve current fail-closed behavior when the public feed is missing, invalid, stale, or unavailable.

## Non-goals

- Building or changing TCG Hunt collectors.
- Changing Mighty Ape, Farmers, ChangeDetection.io, Discord, or alert schedules.
- Enabling MythicDeck scraping, feed/API access, trade pricing, checkout, or automated collection.
- Publishing unapproved retailer branding or copyrighted product/character artwork.
- Deploying the redesign to `main` as part of the design work.
- Ranking Verified Retailers or Peak Partners above other retailers solely because of relationship status.

## Anti-goals

- No runtime fallback to fixtures or demo stock when the public feed is unavailable.
- No claim that an unavailable collector means a product is sold out.
- No hidden freshness assumptions.
- No mixing private monitoring evidence, credentials, trade pricing, or internal verification data into the public client contract.
- No duplicate product cards solely because several retailers carry the same product.

## Current constraints

The current public contract is schema version 1. Each `TcgPublicItem` contains `id`, `game`, `product`, `retailer`, optional `price_nzd`, `availability`, `observed_at`, and `retailer_url`. The parser accepts only HTTPS retailer URLs, known availability values, valid timestamps, and a bounded price string. Snapshot loading requires HTTPS, `delayed: true`, a supported schema, and a fresh `generated_at` value.

The current `TcgRadar` renders one card per item and exposes only Game and Availability filters. Loading, unconfigured, and unavailable states already fail closed and must remain so.

The v1 contract does not currently provide a canonical product ID, language, product type, release state, retailer relationship, retailer-health state, imagery, or event history. Production UI must not infer those facts from names when correctness matters.

## Approaches considered

### 1. Replace the public contract immediately with a richer schema

This gives the cleanest long-term model but couples the visual redesign to backend/public-egress work that is not yet approved. It also creates unnecessary risk while the real public TCG Hunt endpoint is still unconfigured.

### 2. Group schema-v1 items directly by product-name strings

This can create a quick product-first view with no contract change, but name-based grouping can incorrectly merge or split products when language, edition, size, or naming differs. It is acceptable only where grouping is explicitly conservative and ambiguity remains separate.

### 3. Chosen: staged presentation model with conservative v1 grouping, then versioned contract evolution

Build a focused client-side presentation layer that can turn current validated v1 items into product groups without changing validation or feed loading. Group only on a deterministic conservative key based on fields the public contract actually supplies, and preserve ambiguous offers separately rather than guessing. Keep richer concepts such as language, release lifecycle, retailer relationship, health, imagery, and history behind explicit typed presentation/demo inputs until a later approved public-contract version supplies them.

This approach delivers the approved Radar experience without weakening the existing trust boundary or forcing backend work into the first UI change.

## Product model and grouping

The product-first presentation layer owns grouping and sorting; the feed parser remains responsible only for validating public source records.

For schema v1, grouping must be conservative. The initial grouping key uses normalized `game` plus normalized `product`. Normalization is for whitespace/case comparison only; it must not strip edition, language, set, size, or other meaningful product text. If later source data provides a canonical product ID, that ID replaces name-based grouping.

Each group exposes:

- game
- product display name
- retailer offers
- lowest numeric price among currently eligible offers when a price exists
- retailer count
- aggregate availability derived from retailer offers
- most recent observation timestamp for display only

Aggregate availability is a summary, not a replacement for retailer-level truth. Retailer rows always retain their own state and timestamp.

## Availability and freshness semantics

Current public availability values remain `in_stock`, `limited`, `out_of_stock`, and `unknown`.

The UI may derive a product summary from those values, but it must not fabricate retailer health. A collector being paused, stale, or unavailable is a separate concept and must eventually arrive from an explicit public field or public health projection.

Until such a field exists, production schema-v1 data must not display invented labels such as “monitoring paused.” Those labels may appear only in clearly marked mock/demo presentation data.

Freshness remains visible at retailer-offer level using `observed_at`. Snapshot-level staleness continues to be enforced by `loadTcgFeed`; UI code does not override that fail-closed decision.

## Products view

The default view uses visual product cards. Each card shows what can be supported truthfully by its data source: game, product, overall availability, retailer count, lowest available NZ price where present, and freshness summary.

Expanding/selecting a product reveals retailer rows containing retailer name, price, availability, observation time, and **View at Retailer**. Retailer checkout remains in a new external tab.

Filters begin with fields already supported by validated data: game and availability. The layout reserves clear extension points for price, preorder/release state, language, retailer, and freshness once those become explicit public fields.

A compact/list view can reuse the same product-group model and must not create a second truth path.

## New & Upcoming view

This view represents GallantDiscoveries release intelligence, not inferred stock data. Its lifecycle is:

**Official announcement → Coming soon → NZ listings discovered → Preorders open → Released → In stock → Restock/price changes.**

Until an approved public GallantDiscoveries projection exists, production runtime shows an honest unconnected/coming-soon state. Review fixtures may demonstrate the intended lifecycle, but they never become runtime fallback data.

## Stores view

Stores provides retailer-oriented discovery and health/status context. Real production fields must come from an approved public retailer projection rather than inference from missing stock rows.

The target store presentation supports retailer name, public monitoring health, last reliable observation, product count, category/game coverage, and relationship status.

Relationship is independent of monitoring health and stock ranking:

- `monitored`: ordinary monitored retailer.
- `verified_retailer`: participation/details directly confirmed with Gallant Peak; does not imply payment, endorsement, or commercial partnership.
- `peak_partner`: later mutually agreed commercial/strategic relationship.

Relationship badges do not change ordinary ranking by themselves.

## MythicDeck proposed pilot

MythicDeck may appear in review/demo fixtures only and must be labelled clearly as **PROPOSED MYTHICDECK PILOT — DEMO DATA** or equivalent.

The demo uses neutral imagery/placeholders and `$XX.XX`-style pricing rather than invented live prices. It may demonstrate Japanese Pokémon/One Piece inventory concepts, availability, freshness presentation, and a **View at MythicDeck** action, but must not claim live monitoring or approved integration.

No MythicDeck trade pricing, private data, credentials, or automated collection enters the web repository.

## Retailer isolation

The Radar treats each retailer as independently observable. A Farmers failure must not suppress valid Mighty Ape or future retailer results. Conversely, the existence of a healthy retailer must not make an unhealthy retailer appear healthy.

For current schema v1, feed-level failure still means no validated public snapshot can be shown. Retailer-level health isolation becomes fully expressible only when the public egress exposes retailer-health information separately from offers.

## Event history

Restocks, new listings, price drops, and sold-out events are target features. They require explicit event/history data from an approved public source. The first production UI change should provide component/data-model seams for this future work but must not reconstruct history from a single current snapshot.

## Visual system

Use Gallant Peak's existing site identity and improve information hierarchy rather than creating a separate product. The Radar should use strong product cards, clear status/freshness indicators, visual category filtering, clean retailer comparison, and restrained NZ mountain/landscape influence.

Third-party character art, retailer logos, and product photography are not assumed permitted. Neutral placeholders or approved assets are used instead.

## Error and empty states

Existing fail-closed states remain first-class:

- loading: no stock shown until validation completes;
- unconfigured: no simulated stock;
- unavailable/stale/invalid: no cached demo fallback;
- rejected records: report withheld-record count without rendering invalid records;
- no filter matches: clear empty result state.

Product grouping must tolerate duplicate observations, missing prices, unknown availability, and ambiguous product names without throwing or inventing data.

## Testing strategy

Use TDD for implementation. Tests cover the pure grouping/presentation model separately from React rendering. UI tests cover product grouping, expansion, filters, lowest-price behavior, missing prices, unknown states, rejected-record messaging, and all existing feed failure states.

Contract/parser tests remain authoritative for schema-v1 validation. The first UI implementation does not loosen parser validation or add optional contract fields merely to make the mock-up richer.

Demo fixtures are explicitly named as review/demo fixtures and tests prove they are not used as runtime fallback.

## Delivery and deployment boundary

Implementation occurs on a feature branch/PR. `main` remains unchanged until explicit review/approval. The public site must continue to show honest unconfigured/unavailable behavior if no real feed is configured.

The initial implementation should therefore be independently useful even before a real public endpoint exists: the production components and tests are ready, while review/demo fixtures provide screenshots or local review without leaking into runtime.

## What remains to the builder

After this design is approved, write a task-by-task implementation plan against the exact repository structure. Prefer small focused modules over expanding `TcgRadar.tsx` into a monolith. Keep feed validation separate from presentation grouping. Reuse the existing CSS/design system where practical and add focused styles for product cards, retailer comparison, navigation, and responsive behavior.

Do not begin backend/public-egress/schema-v2 work as part of this implementation unless separately approved.