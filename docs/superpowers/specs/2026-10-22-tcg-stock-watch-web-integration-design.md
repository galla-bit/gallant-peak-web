# TCG Hunt Shared Platform → Gallant Peak Web Integration Design

Date: 2026-10-22
Status: Approved architecture; implementation remains gated by TCG Hunt current-state controls
Repositories: `galla-bit/gallant-peak-tcg-hunt`, `galla-bit/gallant-peak-web`

## Product decision

TCG Hunt is the shared stock-intelligence platform/service, not functionality owned by either the Gallant Peak website or the mobile app.

Do not move or duplicate collector/monitor logic into `gallant-peak-web`. Do not create a separate app-owned stock database or monitor. TCG Hunt remains the single authority for collection, evidence validation, normalization, stock state, freshness and publication eligibility.

Consumer model:

```text
NZ retailer monitors                  Future approved supplier feeds
        |                                          |
        +--------------------+---------------------+
                             v
                    TCG Hunt ingestion
                             |
                             v
                evidence / normalization
                             |
                             v
                    stock intelligence
                             |
                 +-----------+-----------+
                 |           |           |
                 v           v           v
          Gallant Peak      App       Discord
          web / TCG Hunt  companion    alerts
          public discovery  experience
```

The Gallant Peak website is the primary low-friction public discovery surface. The mobile app is the later personalized companion for saved hunts, favourites, regional preferences and push alerts. Discord remains an alert/community consumer. All consume TCG Hunt-owned conclusions rather than independently determining stock.

## Purpose

Expose genuine, deliberately public TCG Hunt stock intelligence through the Gallant Peak website without moving collector logic, credentials, raw observations, Discord configuration, trusted/admin state or stock authority into the static GitHub Pages application.

The initial public transport may be a delayed versioned JSON snapshot because the website is static. The public contract is nevertheless a first-class TCG Hunt output and should be designed as the precursor to a versioned API that can serve web and mobile clients.

## Success criteria

1. Existing stock-watch and Discord paths continue independently.
2. Gallant Peak Web can render genuine delayed NZ retail availability from TCG Hunt.
3. The mobile app can later consume the same public/client contract without owning a second monitor or stock database.
4. Demo/fabricated stock cannot be mistaken for observed availability.
5. No collector credentials, internal watch configuration, raw retailer responses, admin state or private diagnostics are exposed to clients.
6. Invalid, stale, unavailable or schema-incompatible data fails closed in clients.
7. Future approved supplier/retailer inventory feeds enter the same TCG Hunt normalization pipeline rather than creating website/app-specific inventory systems.
8. The public contract can evolve from static snapshot to HTTP API through explicit versioning rather than UI redesign.

## Current authority and gates

The current `gallant-peak-tcg-hunt` `docs/CURRENT-STATE.md` remains authoritative. At the time of this decision the project is in UNKNOWN SAFETY QUALIFICATION / WRITTEN DESIGN REVIEW, operational confidence is NOT_READY, independently verified controlled-live successes are 0/5 and live migration is blocked.

This design does not authorize live integration, installed/runtime reads, new public egress, public deployment, migration, credentials/provider changes, paid services, destructive changes or bypass of any TCG Hunt stop gate.

The web integration must wait for the TCG Hunt program to authorize the relevant productization/public-egress stage. Until then, web-side work may use non-sensitive contract fixtures only.

## Ownership

### TCG Hunt platform owns
- retailer/supplier source ingestion;
- source identity and retailer mapping;
- evidence qualification;
- normalization;
- observation timestamps;
- stock/availability interpretation;
- persistence of authoritative stock state;
- publication eligibility;
- public delay/staleness policy;
- client/public contract generation;
- removal of private/internal fields;
- later versioned API behavior.

### Gallant Peak Web owns
- fetching the explicitly public artifact/API;
- validating the public schema again at the browser boundary;
- rendering public search/browse, filters, states, timestamps, prices and retailer links;
- accessible loading, empty, stale and failure states;
- never upgrading unknown or invalid data into an in-stock claim.

### Mobile app owns
- client UX for personalized features such as saved hunts, favourites, preferences and push-alert presentation;
- client-side validation appropriate to the shared contract;
- no independent stock determination or retailer collection.

### Discord owns
- alert/community presentation only;
- no separate stock authority.

## Phase-one transport

Use a versioned public JSON snapshot rather than introducing a permanent application server solely for the current static website.

The snapshot is generated by TCG Hunt from already-normalized observations after publication-policy checks and only after current TCG Hunt gates authorize public egress. It is published to an explicitly public HTTPS location.

The website must not fetch repository internals, raw collector output, Discord payloads, logs, staging artifacts or trusted bridge endpoints.

The transport location is deployment configuration, not a secret. A future HTTP API may replace the JSON artifact while preserving the same contract semantics or using a deliberately versioned successor.

## Public/client data contract v1

Conceptually:

```json
{
  "schema_version": 1,
  "generated_at": "2026-10-22T00:00:00Z",
  "delayed": true,
  "items": [
    {
      "id": "opaque-public-id",
      "game": "Pokemon",
      "product": "Example product",
      "retailer": "Example retailer",
      "price_nzd": "189.99",
      "availability": "in_stock",
      "observed_at": "2026-10-21T23:45:00Z",
      "retailer_url": "https://retailer.example/product"
    }
  ]
}
```

Allowed availability values for v1:
- `in_stock`
- `limited`
- `out_of_stock`
- `unknown`

Missing/unrecognized availability is `unknown`, never `in_stock`.

`price_nzd` is a decimal string. Missing price is displayed as unavailable rather than inferred.

`id` is opaque and must not expose internal database keys, credentials, watch IDs, source hashes or security identifiers.

## Explicitly prohibited public fields

The contract must not contain:
- credentials, tokens, cookies or authorization material;
- Discord webhook/channel configuration;
- internal watch IDs or allowlists;
- raw HTML or full source responses;
- internal source hashes/digests used by trusted controls;
- scheduler/admin state;
- private retailer notes;
- unpublished supplier commercial terms;
- customer data;
- internal audit/security logs;
- trusted bridge manifests or approval state.

The public schema is allowlist-built. Never serialize an internal object and attempt to remove known-sensitive keys afterward.

## Delay and freshness

Public web data remains deliberately delayed unless a later reviewed policy changes that behavior. `generated_at` describes artifact generation and each item carries `observed_at`.

Clients may calculate presentation freshness but may not reinterpret stock. If the artifact exceeds the configured maximum age, the web UI fails closed and does not present availability as current.

## Web UX

`/#/tcg-hunt` evolves from the current static panel into the primary public TCG Hunt discovery experience:
- legitimate NZ retail stock discovery explanation;
- development/public-delay disclosure;
- radar status;
- product results when a valid snapshot is available;
- filters for game and availability where useful;
- retailer, product, NZD price, availability and observation time;
- external retailer link;
- accessible loading, no-results, stale and unavailable states;
- later search/discovery improvements that remain consumers of TCG Hunt data.

The page must not imply Gallant Peak is the seller for third-party inventory. Retailer links remain clearly attributable to the retailer. No business is described as a supplier/retailer partner until confirmed.

## Failure behavior

Fail closed. The website shows no current-stock claim when fetch/parse fails, schema is unsupported, top-level integrity is invalid, generated time is invalid/stale, availability is unknown/unrecognized, or destination URL is unsafe.

One bad item may be rejected without discarding an otherwise valid artifact if top-level integrity remains valid. Validation internals are not exposed to customers.

## Security boundary

No browser-accessible route may reuse a trusted/admin bridge endpoint merely because it exists. Public publication is a distinct egress class with its own explicit schema and tests.

Existing TCG Hunt bridge inventory/exclusion controls remain unchanged unless separately reviewed. This integration must not convert an excluded/trusted bridge path into an implicit public producer.

Only HTTPS retailer links are actionable. Retailer HTML is never rendered directly through `dangerouslySetInnerHTML` or equivalent.

## Repository responsibilities

### `gallant-peak-tcg-hunt`
When its current gates authorize productization/public egress, a separate TCG Hunt design/plan should add the shared client contract, allowlist serializer/publisher, delay/freshness policy, leakage tests, contract fixtures and publishing/API documentation. That work must be based on the then-current accepted TCG Hunt main and authority state.

### `gallant-peak-web`
A web implementation plan may prepare the consumer against a non-sensitive fixture before live egress is authorized. It should add typed contract models, runtime validation, a fetch adapter with configurable endpoint, radar/result components, loading/error/stale/empty states, filters, accessibility tests and deployment configuration documentation.

### Mobile app
Do not duplicate monitor logic. Later app work consumes the shared contract/API and concentrates on personalized client capabilities.

## Test strategy

TCG Hunt producer tests, when authorized, prove allowlisted output only, deterministic serialization, delay enforcement, no secret/internal leakage, malformed-source fail-closed behavior and schema conformance.

Web tests prove valid fixture rendering; unknown never becomes in-stock; stale/unsupported/malformed data becomes unavailable; unsafe retailer URLs are not links; invalid records are rejected; fetch failure never falls back to fake stock; accessibility remains intact; production build passes.

A contract fixture or mechanical contract check must prevent producer/consumer drift.

## Deployment sequence

1. Complete the current TCG Hunt safety/operational qualification program and obtain the explicit gate permitting productization/public egress.
2. Design/implement/test the TCG Hunt shared client/public producer without publishing it.
3. Validate Gallant Peak Web against a non-sensitive contract fixture.
4. Perform sensitive-data leakage review.
5. Publish the approved public artifact/API to the selected HTTPS location.
6. Configure the Gallant Peak Web review deployment to consume it.
7. Deliberately verify stale/failure behavior.
8. Only then describe the radar as connected on the public website.
9. Reuse the same contract/API for the mobile app rather than implementing a second stock system.

## Non-goals for v1

- marketplace checkout;
- customer accounts/watchlists in the initial web release;
- supplier order routing;
- direct client access to collectors;
- real-time guarantees;
- exposing internal monitoring frequency;
- changing Discord alert behavior;
- automatically onboarding supplier APIs;
- changing Shopify product/fulfilment behavior;
- moving the monitor into the website or mobile app.

## Future evolution

Approved retailer/supplier feeds (API, Shopify, CSV/XML or manual partner tooling) enter the same TCG Hunt ingestion/normalization boundary.

The static snapshot can evolve into a versioned TCG Hunt HTTP API supporting richer search, watchlists, geographic discovery and multiple clients. The public/client contract remains intentionally derived and less privileged than the internal monitoring model.

## Decision

Use TCG Hunt as the single stock-intelligence platform. Gallant Peak Web is the primary public discovery client, the mobile app is the personalized companion client, and Discord is an alert/community client. None owns separate monitoring logic or stock authority.
