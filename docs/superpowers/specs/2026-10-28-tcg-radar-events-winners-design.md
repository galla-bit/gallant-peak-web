# TCG Radar Events and Recent Winners Design

## Intent

Extend the product-first TCG Radar from PR #13 with an Events surface that helps New Zealand players discover upcoming organised-play competitions at specified retailers and see the most recently published winner for completed competitions.

The customer flow becomes:

**Discover product/release → find where to play → inspect event details → register/view at organiser → return later to see the published winner.**

Primary Radar navigation becomes **Products | New & Upcoming | Events | Stores**.

## Goals

- Add a distinct Events tab alongside New & Upcoming.
- Show upcoming competitions only for specified retailers/organisers that actually run supported TCG events.
- Support Pokémon, One Piece, Dragon Ball, Yu-Gi-Oh, and future games without a game-specific event model.
- Use a hybrid source strategy: official game/organised-play sources where available plus the retailer/organiser's own published event information.
- Retain source provenance and freshness so Gallant Peak does not become the authority for facts it republishes.
- Show only the most recently published winner/result information requested by the user, not Top 4/Top 8 standings.
- Keep stock, releases, events, results, and retailer relationships as separate truth domains so failure in one does not corrupt another.
- Keep registration and checkout external to Gallant Peak.

## Non-goals

- Running tournaments, registrations, payments, brackets, standings, or player accounts on Gallant Peak.
- Publishing Top 4/Top 8 standings.
- Guessing winners, deck archetypes, formats, fees, capacities, registration status, or event times.
- Scraping private retailer systems, credentials, trade data, or unpublished organiser information.
- Treating a retailer as an event host merely because Gallant Peak monitors its stock.
- Changing TCG Hunt collectors or schema-v1 stock semantics.
- Merging or deploying PR #13 or this extension without a separate approval gate.

## Anti-goals

- No stock-monitor failure may hide or falsify valid event data.
- No event-source failure may change stock availability.
- No stale event may silently remain presented as upcoming after its start time.
- No result is displayed without a source that actually identifies the winner.
- No deck/archetype is inferred from player identity, event type, card images, or unrelated posts.
- No runtime demo fixtures masquerade as live events or results.

## Existing foundation

PR #13 implements the approved product-first Radar on `design/tcg-radar-product-first`. It groups validated schema-v1 retailer offers into product cards, provides retailer comparison, Cards/Compact presentation, and honest unconnected New & Upcoming and Stores views. Its public stock contract remains unchanged and fail-closed.

This Events work should build on that PR's head rather than rewriting the completed product-first implementation.

## Approaches considered

### Retailer/organiser sources only

This is simple and captures local store activity well, but source structure and publication quality vary and some officially listed events may be missed.

### Official game event systems only

These are strong sources for sanctioned play where available, but can omit smaller store activity or locally published details and results.

### Chosen: hybrid official + retailer/organiser sources

Use official organised-play sources when available and supplement them with the hosting retailer/organiser's own public event and result publications. Preserve provenance per record. Conflicting facts are not silently combined; the ingestion/publication layer must resolve or withhold conflicts according to explicit source rules.

This gives broad NZ coverage while keeping the displayed facts attributable.

## Event model

The future public Events projection should expose explicit fields rather than asking the React UI to parse prose. A validated event record should be able to represent:

- stable event ID
- game
- event name
- organiser/retailer ID and display name
- venue/city/region when published
- start date/time and timezone
- format when published
- entry fee when published
- registration state when published
- external event/registration URL
- source type (`official` or `organiser`)
- source URL
- source published/observed timestamp when available
- Gallant Peak projection timestamp

Unknown optional facts remain absent and render as `Not published` or are omitted; they are never guessed.

An event is upcoming only when its validated start time is in the future. Events without a trustworthy start time must not enter the upcoming list.

## Specified retailer eligibility

Event coverage uses an explicit retailer/organiser allowlist or approved public retailer registry. Stock monitoring alone does not opt a retailer into Events.

A retailer may be eligible when Gallant Peak has identified a public event source for that retailer and the source demonstrates that the retailer runs the relevant game. Each game is independently supported; a store running Pokémon does not automatically become a One Piece or Yu-Gi-Oh event source.

The Stores view can later link to that retailer's upcoming events and recent winner without changing its stock-health semantics.

## Events presentation

The Events tab contains two sections.

### Upcoming Events

Upcoming event cards/rows show only validated published facts:

- game
- event name
- retailer/organiser
- city/region when known
- date and local time
- format when known
- entry fee when known
- registration status when known
- source/freshness context
- **View / Register at Organiser** external action

Initial filters should support game, retailer/organiser, region when available, and date/time window. Filtering operates only on explicit fields.

Sort upcoming events chronologically by start time. Events with the same start time use deterministic secondary ordering such as organiser then event name.

### Recent Winners

Recent Winners is intentionally winner-only. For each eligible completed event with a verified published result, display:

- winner's published name or handle exactly as the source presents it
- game
- event name
- retailer/organiser
- event date
- winning deck/archetype only when explicitly published
- source/freshness context
- external source/result link when available

Do not display Top 4, Top 8, runner-up, standings, or inferred deck information.

If a completed event has no publicly identified winner, it does not produce a winner card. The UI may state that no published recent winner is available; it must not imply the event had no winner.

## Privacy and identity

Winner identity is limited to information the organiser or official source intentionally publishes publicly. Preserve the published representation rather than enriching it with personal information from other sources. Do not cross-reference handles to legal names, social accounts, contact details, age, or other identity data.

If a source later removes a result or the public projection marks it withdrawn, Gallant Peak should stop displaying it on the next successful publication.

## Provenance, conflicts, and freshness

Every event/result record must retain an attributable source URL and source type in the public projection or server-side provenance used to build it.

Where official and organiser sources disagree on a material fact such as date/time or cancellation, the projection must not silently choose based on UI convenience. Source-resolution rules belong in the future ingestion/publication layer. Until resolved, withhold the conflicting fact/event or mark it unavailable rather than displaying a guessed value.

Upcoming status is computed from validated event time, not from stale source labels. Cancellation/postponement requires explicit source evidence.

The UI should show a human-readable freshness/source cue without exposing internal monitoring infrastructure.

## Data architecture and isolation

Keep domains independent:

- **TCG Hunt public stock projection → Products**
- **GallantDiscoveries/public release projection → New & Upcoming**
- **Approved event sources → validated Events public projection → Upcoming Events**
- **Approved published result sources → validated Results public projection → Recent Winners**
- **Public retailer registry/projection → Stores and retailer relationship metadata**

A failure or unconfigured state in Events/Results must fail closed only for that surface. Products remains usable when its own validated feed is healthy. Likewise, stock failure does not erase a healthy event projection.

## First implementation boundary

The first website implementation should add the Events tab and typed Events/Recent Winners presentation seams while remaining honest about source availability.

Until a real approved Events/Results public endpoint exists, production runtime shows an explicit unconnected state rather than fake competitions or winners. Tests/review fixtures may demonstrate the intended presentation but must be clearly named and must never become runtime fallback.

This keeps the website ready for data-source work without prematurely authorising scraping, backend ingestion, or public event egress.

## Visual direction

Events should remain part of the same Gallant Peak/TCG Radar system established by PR #13. Reuse the existing navigation, typography, status language, cards, responsive layout, and restrained NZ identity.

Upcoming events should prioritise date/time and game scanning. Recent Winners should be visually secondary to upcoming play and should not become a leaderboard. Winner cards can use a simple trophy/result marker without third-party character artwork.

## Error and empty states

Events and Results each need independent states:

- loading
- unconfigured
- unavailable/invalid/stale
- no upcoming events matching filters
- no recently published winner

An Events failure must not be rendered as `no events exist`; it is `event information unavailable` or equivalent. A Results failure must not imply nobody won.

## Testing strategy

Implementation uses TDD.

Pure model tests should cover chronological sorting, future/past classification, explicit optional fields, deterministic ties, game/retailer/region filters, winner-only mapping, missing deck archetype, missing winner exclusion, source provenance, and conflict/invalid-record fail-closed behavior where that responsibility exists in the client contract.

React tests should cover the fourth Events tab, independent Events/Results states, upcoming cards, external organiser links, Recent Winners winner-only presentation, absence of Top 4/Top 8 content, filtering, and preservation of Products/New & Upcoming/Stores behavior from PR #13.

Regression tests must prove no runtime fixture fallback and no coupling between stock feed failure and event/result presentation state.

## Delivery boundary

- Build from PR #13's reviewed head on a follow-up branch/PR.
- Do not rewrite schema-v1 stock validation to accommodate Events.
- Do not merge/deploy PR #13 or the Events extension without explicit approval.
- Do not begin live event ingestion/scraping/public-egress work without a separate source/data approval.
- Website code may be made ready for Events/Recent Winners before the live data pipeline exists, using honest unconnected production states.

## What remains to the builder

After this design is approved, create a detailed TDD implementation plan against the exact PR #13 repository structure. Keep event/result types and presentation logic separate from stock grouping. Prefer small modules/components over expanding the main Radar component into a monolith. Reuse existing view navigation and styling patterns.

The implementation plan should explicitly test winner-only behavior, source links, independent domain failure, and the prohibition on runtime demo fallback. Backend ingestion, automated retailer searches, official event-system adapters, and GallantDiscoveries/public projection changes remain separate future work requiring their own approval.