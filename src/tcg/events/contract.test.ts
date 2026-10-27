import {describe, expect, it} from 'vitest';
import {parseTcgEventsSnapshot} from './contract';
import {event, NOW, snapshot, winner} from './test-fixtures';

describe('events/results public contract', () => {
  it('preserves explicit public event facts and exact winner identity without enriching optional fields', () => {
    const input = snapshot({events:[event({region:'Manawatū-Whanganui',format:'Standard',entry_fee:'NZ$10',registration_status:'Open'})],
      winners:[winner({winner:'  @Published ✨  '})]});
    const parsed = parseTcgEventsSnapshot(input, NOW);
    expect(parsed.snapshot?.events?.[0]).toEqual((input.events as unknown[])[0]);
    expect(parsed.snapshot?.winners?.[0].winner).toBe('  @Published ✨  ');
    expect(parsed.snapshot?.winners?.[0].deck_archetype).toBeUndefined();
    expect(parsed.rejectedEvents).toBe(0);
    expect(parsed.rejectedWinners).toBe(0);
  });
  it.each(['http://example.com/a','https://user:pass@example.com/a','https://example.com/a?token=secret',
    'https://example.com/a#secret','https://localhost/a','https://127.0.0.1/a','https://[::1]/a',
    'https://localhost./a','https://service.local./a','https://service.internal./a'])('rejects unsafe public source and registration links %s', url => {
    const parsed=parseTcgEventsSnapshot(snapshot({events:[event({source_url:url}),event({event_url:url})],winners:[winner({source_url:url})]}),NOW);
    expect(parsed.snapshot?.events).toEqual([]);
    expect(parsed.snapshot?.winners).toEqual([]);
    expect(parsed.rejectedEvents).toBe(2);
    expect(parsed.rejectedWinners).toBe(1);
  });
  it.each([{winner:''},{winner:['A','B']},{verified:false},{eligible:false},{withdrawn:true},{conflicted:true},
    {standings:['A','B']},{top4:['A']},{top8:['A']},{runner_up:'B'},{legal_name:'Unpublished'},
    {event_at:'not-a-date'},{event_at:'2026-02-30T00:00:00Z'}])('withholds malformed, unverified or unsupported result %j', changes => {
    const parsed=parseTcgEventsSnapshot(snapshot({winners:[winner(changes),winner()]}),NOW);
    expect(parsed.snapshot?.winners).toHaveLength(1);
    expect(parsed.rejectedWinners).toBe(1);
  });
  it.each([{starts_at:'2026-10-29'},{starts_at:'2026-02-30T00:00:00Z'},{timezone:'guess'},
    {source_type:'community'},{eligible:false},{conflicted:true},{observed_at:'2099-01-01T00:00:00Z'}])('withholds malformed event %j', changes => {
    const parsed=parseTcgEventsSnapshot(snapshot({events:[event(changes),event()]}),NOW);
    expect(parsed.snapshot?.events).toHaveLength(1);
    expect(parsed.rejectedEvents).toBe(1);
  });
  it.each([null,{},snapshot({schema_version:2}),snapshot({generated_at:'bad'}),
    snapshot({generated_at:'2026-10-27T20:00:00Z'}),snapshot({generated_at:'2026-10-29T00:00:00Z'})])('fails closed on invalid envelope/version/freshness', input => {
    expect(parseTcgEventsSnapshot(input,NOW).snapshot).toBeNull();
  });
  it('withholds a malformed domain independently and accepts explicit published deck only', () => {
    const parsed=parseTcgEventsSnapshot(snapshot({events:null,winners:[winner({deck_archetype:'Published deck'})]}),NOW);
    expect(parsed.snapshot?.events).toBeNull();
    expect(parsed.snapshot?.winners?.[0].deck_archetype).toBe('Published deck');
    const other=parseTcgEventsSnapshot(snapshot({winners:null}),NOW);
    expect(other.snapshot?.events).toHaveLength(1);
    expect(other.snapshot?.winners).toBeNull();
  });
});
