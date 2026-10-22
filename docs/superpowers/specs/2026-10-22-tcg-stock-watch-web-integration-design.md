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
              validated canonical state
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
       private near-live path       public path
                 |                       |
                 v                       v
        Discord/private TCG       sanitize + coalesce
           Hunt consumers          latest state only
                                         |
                                         v
                              15-minute stability gate
                                         |
                                         v
                               public v1 feed/API
                                         |
                              +----------+----------+
                              |                     |
                              v                     v
                       Gallant Peak web       future mobile app
```

The Gallant Peak website is the primary low-friction public discovery surface. The mobile app is the later personalized companion for saved hunts, favourites, regional preferences and push alerts. Discord remains an alert/community consumer. All consume TCG Hunt-owned conclusions rather than independently determining stock.

## Purpose

Expose genuine, deliberately public TCG Hunt stock intelligence through the Gallant Peak website without moving collector logic, credentials, raw observations, Discord configuration, trusted/admin state or stock authority into the static GitHub Pages application.

The free public feed is deliberately delayed. Private verified TCG Hunt/Discord delivery may remain immediate or near-live after validation, while public consumers receive only a sanitized state that has remained the latest state for at least 15 continuous minutes.

The initial public transport may be a versioned JSON snapshot because the website is static. The public contract is nevertheless a first-class TCG Hunt output and should be designed as the precursor to a versioned API that can serve web and mobile clients.

## Success criteria

1. Existing stock-watch and private Discord paths continue independently and may remain near-live after validation.
2. Gallant Peak Web can render genuine delayed NZ retail availability from TCG Hunt.
3. Every publicly visible stock, price or availability state has survived a minimum 15-minute stability window.
4. A newer verified state replaces any pending unpublished state and restarts that product/retailer state's 15-minute timer.
5. While a replacement is pending, the previous published public state remains visible and the existence of the pending state is not leaked.
6. The public item preserves the original observation timestamp of the state that qualified for publication.
7. The mobile app can later consume the same public/client contract without owning a second monitor or stock database.
8. Demo/fabricated stock cannot be mistaken for observed availability.
9. No collector credentials, internal watch configuration, raw retailer responses, admin state or private diagnostics are exposed to clients.
10. Invalid, stale, unavailable or schema-incompatible data fails closed in clients.
11. Future approved supplier/retailer inventory feeds enter the same TCG Hunt normalization pipeline rather than creating website/app-specific inventory systems.
12. The public contract can evolve from static snapshot to HTTP API through explicit versioning rather than UI redesign.

## Current authority and gates

The current `gallant-peak-tcg-hunt` `docs/CURRENT-STATE.md` remains authoritative. At the time of the original decision the project was in UNKNOWN SAFETY QUALIFICATION / WRITTEN DESIGN REVIEW, operational confidence was NOT_READY, independently verified controlled-live successes were 0/5 and live migration was blocked.

This design records the approved product architecture but does not by itself override any then-current TCG Hunt safety, migration or controlled-live stop gate. Before implementation or public egress, use the current accepted TCG Hunt main and authority state rather than relying on the historical status quoted above.

The website must never become a route around TCG Hunt controls. Web-side work may use non-sensitive contract fixtures until the producer/public-egress stage is authorized.

## Ownership

### TCG Hunt platform owns
- retailer/supplier source ingestion;
- source identity and retailer mapping;
- evidence qualification;
- normalization;
- observation timestamps;
- stock/availability interpretation;
- persistence of authoritative private stock state;
- private near-live event delivery eligibility;
- public sanitization and allowlist serialization;
- public state coalescing/debouncing;
- the minimum 15-minute public stability gate;
- publication eligibility;
- public staleness policy;
- client/public contract generation;
- removal of private/internal fields;
- later versioned API behavior.

### Gallant Peak Web owns
- fetching only the explicitly public delayed artifact/API;
- validating the public schema again at the browser boundary;
- rendering public search/browse, filters, states, timestamps, prices and retailer links;
- clearly disclosing that public stock information is delayed by at least 15 minutes;
- accessible loading, empty, stale and failure states;
- never upgrading unknown or invalid data into an in-stock claim.

### Mobile app owns
- client UX for personalized features such as saved hunts, favourites, preferences and push-alert presentation;
- client-side validation appropriate to the shared contract;
- no independent stock determination or retailer collection.

### Discord owns
- near-live alert/community presentation after private validation;
- no separate stock authority.

## Phase-one transport

Use a versioned public JSON snapshot rather than introducing a permanent application server solely for the current static website.

The snapshot is generated by TCG Hunt from already-normalized observations only after sanitization and the public publication-policy checks succeed. It is published to an explicitly public HTTPS location.

The website must not fetch repository internals, raw collector output, near-live event streams, pending public states, Discord payloads, logs, staging artifacts or trusted bridge endpoints.

The transport location is deployment configuration, not a secret. A future HTTP API may replace the JSON artifact while preserving the same contract semantics or using a deliberately versioned successor.

## Public/client data contract v1

Conceptually:

```json
{
  "schema_version": 1,
  "generated_at": "2026-10-22T00:00:00Z",
  "delayed": true,
  "minimum_delay_seconds": 900,
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

`observed_at` is the original validated observation timestamp for the state that qualified for public publication. It must not be rewritten to the later publication time.

`minimum_delay_seconds` is 900 for this policy version and makes the public delay machine-readable as well as visible in the UI. It does not expose private polling frequency or pending-state timing.

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
- trusted bridge manifests or approval state;
- pending-state values, pending-state timestamps or timer/reset metadata;
- private monitor polling intervals or near-live delivery metadata.

The public schema is allowlist-built. Never serialize an internal object and attempt to remove known-sensitive keys afterward.

## Public delay state machine

The delay applies symmetrically to every verified public-relevant state change, including in-stock, limited, out-of-stock, restock, price and availability changes.

For each stable public identity (at minimum the product/retailer combination):

1. TCG Hunt validates a new canonical state at observation time `T`.
2. The private path may deliver that verified event immediately/near-live according to its own policy.
3. The public publisher sanitizes the candidate and stores it as the sole pending public state for that identity.
4. The candidate becomes eligible no earlier than `T + 15 minutes` and only if it is still the latest verified state for that identity.
5. Any newer verified public-relevant state received before eligibility replaces the pending candidate and starts a new 15-minute stability window from the newer state's observation time.
6. Intermediate superseded states are never published later in sequence.
7. While a new state is pending, the previously published state remains publicly visible. Public consumers receive no signal that a replacement is pending.
8. Once the latest state survives the complete 15-minute window, it atomically replaces the prior published state.
9. The published record retains that qualifying state's original `observed_at` value.

Example:

```text
19:00 in_stock observed        -> pending, eligible 19:15
19:07 out_of_stock observed    -> replaces pending, eligible 19:22
19:12 in_stock observed        -> replaces pending, eligible 19:27
19:27 no newer state exists    -> publish in_stock observed_at=19:12
```

The public feed does not publish the 19:00 or 19:07 intermediate states. Until 19:27 it continues showing the last previously published state, if one exists.

The 15-minute rule is a minimum stability delay, not merely a scheduled batch interval. Publisher scheduling jitter may make a state appear later than 15 minutes but never earlier.

## Freshness

`generated_at` describes artifact generation and each item carries `observed_at`.

The deliberate 15-minute publication delay and the client's maximum acceptable artifact age are separate controls. A delayed but recently generated artifact can be healthy; an artifact that has stopped updating beyond the configured maximum age must fail closed.

Clients may calculate presentation freshness but may not reinterpret stock. If the artifact exceeds the configured maximum age, the web UI fails closed and does not present availability as current.

## Web UX

`/#/tcg-hunt` is the primary public TCG Hunt discovery experience:
- legitimate NZ retail stock discovery explanation;
- explicit wording that the free public stock feed is delayed by at least 15 minutes;
- radar status;
- product results when a valid snapshot is available;
- filters for game and availability where useful;
- retailer, product, NZD price, availability and original observation time;
- human-readable age such as `Detected 18 minutes ago` derived from `observed_at`;
- external retailer link;
- accessible loading, no-results, stale and unavailable states;
- later search/discovery improvements that remain consumers of TCG Hunt data.

The page must not imply Gallant Peak is the seller for third-party inventory. Retailer links remain clearly attributable to the retailer. No business is described as a supplier/retailer partner until confirmed.

The UI must not claim `live`, `real-time` or equivalent for the free public feed.

## Failure behavior

Fail closed. The website shows no current-stock claim when fetch/parse fails, schema is unsupported, top-level integrity is invalid, generated time is invalid/stale, availability is unknown/unrecognized, destination URL is unsafe, or the producer violates the minimum-delay contract.

One bad item may be rejected without discarding an otherwise valid artifact if top-level integrity remains valid. Validation internals are not exposed to customers.

A producer restart must not flush pending states early. The public publisher's timing/state persistence must preserve the minimum delay across restart/recovery, or conservatively restart the full 15-minute window when safe timing cannot be proven.

Clock anomalies must fail conservatively: no state may publish when the producer cannot prove the full minimum delay has elapsed.

## Security boundary

The delay and sanitization boundary lives on the TCG Hunt side. The public website never receives the private/near-live stream, pending candidates or internal timing metadata.

No browser-accessible route may reuse a trusted/admin bridge endpoint merely because it exists. Public publication is a distinct egress class with its own explicit schema and tests.

Existing TCG Hunt bridge inventory/exclusion controls remain unchanged unless separately reviewed. This integration must not convert an excluded/trusted bridge path into an implicit public producer.

Only HTTPS retailer links are actionable. Retailer HTML is never rendered directly through `dangerouslySetInnerHTML` or equivalent.

## Repository responsibilities

### `gallant-peak-tcg-hunt`
When its current gates authorize productization/public egress, a separate TCG Hunt implementation plan should add the shared client contract, allowlist serializer, per-identity pending/public state machine, durable or conservative delay timing, publisher, leakage tests, contract fixtures and publishing/API documentation. That work must be based on the then-current accepted TCG Hunt main and authority state.

### `gallant-peak-web`
The existing web consumer remains downstream-only. Its implementation should validate the versioned public contract, reject malformed/unsafe/stale data, display the delay disclosure and original observation time, and never connect to private TCG Hunt infrastructure.

### Mobile app
Do not duplicate monitor logic. Later app work consumes the shared contract/API and concentrates on personalized client capabilities.

## Test strategy

TCG Hunt producer tests, when authorized, must prove:
- allowlisted output only and no secret/internal leakage;
- deterministic serialization and schema conformance;
- no state publishes before 900 seconds have elapsed from its qualifying observation;
- in-stock, out-of-stock, restock, price and availability changes all use the same delay rule;
- a newer state replaces the pending candidate and restarts the full delay;
- superseded intermediate states never leak later;
- the previously published state remains unchanged while a replacement is pending;
- `observed_at` remains the original qualifying observation time;
- restart/recovery cannot shorten the delay;
- malformed input and clock uncertainty fail closed.

Web tests must prove:
- valid fixture rendering;
- the UI clearly discloses at least a 15-minute delay;
- original observation time/age is displayed correctly;
- unknown never becomes in-stock;
- stale/unsupported/malformed data becomes unavailable;
- unsafe retailer URLs are not links;
- invalid records are rejected;
- fetch failure never falls back to fake stock;
- accessibility remains intact;
- production build passes.

A contract fixture or mechanical contract check must prevent producer/consumer drift.

## Deployment sequence

1. Re-read the current TCG Hunt authority/state and satisfy the explicit gate permitting productization/public egress.
2. Implement and test the private-to-public boundary in TCG Hunt without publishing it externally.
3. Exercise the 15-minute state machine with deterministic/fake-clock tests, including rapid state changes and restart/recovery.
4. Validate the public allowlist and perform sensitive-data leakage review.
5. Validate Gallant Peak Web against the exact delayed contract fixture.
6. Publish the approved delayed artifact/API to the selected HTTPS location.
7. Configure the Gallant Peak Web review deployment to consume it.
8. Deliberately verify delay, stale and failure behavior end-to-end.
9. Only then describe the radar as connected on the public website.
10. Reuse the same public/client contract for the mobile app rather than implementing a second stock system.

## Non-goals for v1

- marketplace checkout;
- customer accounts/watchlists in the initial web release;
- supplier order routing;
- direct client access to collectors;
- real-time public guarantees;
- exposing internal monitoring frequency;
- delaying the approved private Discord alert path;
- exposing pending public state;
- automatically onboarding supplier APIs;
- changing Shopify product/fulfilment behavior;
- moving the monitor into the website or mobile app.

## Future evolution

Approved retailer/supplier feeds (API, Shopify, CSV/XML or manual partner tooling) enter the same TCG Hunt ingestion/normalization boundary.

The static snapshot can evolve into a versioned TCG Hunt HTTP API supporting richer search, watchlists, geographic discovery and multiple clients. The public/client contract remains intentionally derived and less privileged than the internal monitoring model.

Any future change that shortens/removes the public delay, exposes pending state, or gives a public client access to the private stream is a new security/product design decision and must not happen as an incidental implementation change.

## Decision

Use TCG Hunt as the single stock-intelligence platform. Private verified TCG Hunt/Discord consumers may remain near-live. Gallant Peak Web and other free public consumers receive only allowlisted stock state that has remained the latest state for a minimum of 15 continuous minutes. Newer states reset the public timer, superseded states are never published, the previous public state remains visible while a replacement is pending, and the qualifying state's original observation timestamp is preserved.
