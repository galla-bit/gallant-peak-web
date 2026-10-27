// Test-only public projection examples; never imported by production modules.
export const NOW = Date.parse('2026-10-28T00:00:00Z');
export function event(overrides: Record<string, unknown> = {}) {
  return {id:'event-a', game:'Pokemon', name:'Published competition', organiser_id:'store-a',
    organiser:'Test Organiser A', starts_at:'2026-10-29T02:00:00Z', timezone:'Pacific/Auckland',
    event_url:'https://example.com/events/a', source_type:'organiser', source_url:'https://example.com/sources/a',
    observed_at:'2026-10-27T23:55:00Z', eligible:true, ...overrides};
}
export function winner(overrides: Record<string, unknown> = {}) {
  return {id:'winner-a', event_id:'event-a', game:'Pokemon', event_name:'Completed competition',
    organiser_id:'store-a', organiser:'Test Organiser A', event_at:'2026-10-27T02:00:00Z',
    timezone:'Pacific/Auckland', winner:'Published Handle', verified:true, eligible:true,
    source_type:'official', source_url:'https://example.com/results/a', observed_at:'2026-10-27T23:55:00Z', ...overrides};
}
export function snapshot(overrides: Record<string, unknown> = {}) {
  return {schema_version:1, generated_at:new Date(NOW).toISOString(), events:[event()], winners:[winner()], ...overrides};
}
