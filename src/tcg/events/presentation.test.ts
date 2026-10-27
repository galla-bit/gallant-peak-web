import {describe, expect, it} from 'vitest';
import {filterEventRecords, getRecentWinners, getUpcomingEvents} from './presentation';
import {parseTcgEventsSnapshot} from './contract';
import {event, NOW, snapshot, winner} from './test-fixtures';
import type {TcgWinnerResult} from './types';

const events=(items:unknown[])=>parseTcgEventsSnapshot(snapshot({events:items}),NOW).snapshot!.events!;
const winners=(items:unknown[])=>parseTcgEventsSnapshot(snapshot({winners:items}),NOW).snapshot!.winners!;
describe('upcoming events', () => {
  it('orders future instants chronologically, excludes started events and breaks ties deterministically', () => {
    const values=events([
      event({id:'later',starts_at:'2026-10-30T00:00:00Z'}),
      event({id:'past',starts_at:'2026-10-27T00:00:00Z'}),event({id:'now',starts_at:new Date(NOW).toISOString()}),
      event({id:'b',name:'B',starts_at:'2026-10-29T02:00:00Z'}),event({id:'a',name:'A',starts_at:'2026-10-29T15:00:00+13:00'}),
    ]);
    expect(getUpcomingEvents(values,NOW).map(item=>item.id)).toEqual(['a','b','later']);
    expect(values).toHaveLength(5);
  });
  it('filters only explicit game/organiser/region and preserves provenance and missing facts', () => {
    const values=events([event({region:'Whanganui'}),event({id:'b',game:'One Piece',organiser_id:'b',region:'Auckland'})]);
    expect(filterEventRecords(values,{game:'Pokemon',organiser:'all',region:'all'})).toEqual([values[0]]);
    expect(filterEventRecords(values,{game:'all',organiser:'b',region:'Auckland'})).toEqual([values[1]]);
    expect(filterEventRecords(values,{game:'all',organiser:'b',region:'Whanganui'})).toEqual([]);
    expect(getUpcomingEvents(values,NOW)[0].source_url).toBe('https://example.com/sources/a');
    expect(getUpcomingEvents(values,NOW)[0].format).toBeUndefined();
  });
});

describe('latest three winner-only results', () => {
  it('skips missing winners and future/unverified competitions before selecting newest event times', () => {
    const values=winners([1,2,3,4,5].map(day=>winner({id:`w${day}`,event_id:`e${day}`,
      event_at:`2026-10-${20+day}T00:00:00Z`,observed_at:day===1?'2026-10-27T23:59:00Z':'2026-10-26T00:00:00Z'})));
    values.unshift({...values[0],id:'missing',event_id:'missing',event_at:'2026-10-27T00:00:00Z',winner:''});
    values.push({...values[0],id:'future',event_id:'future',event_at:'2026-10-29T00:00:00Z',winner:'Future'});
    values.push({...values[1],id:'unverified',event_id:'unverified',verified:false} as unknown as TcgWinnerResult);
    expect(getRecentWinners(values,NOW).map(item=>item.id)).toEqual(['w5','w4','w3']);
    expect(getRecentWinners(values,NOW,2)).toHaveLength(2);
    expect(getRecentWinners(values,NOW,10)).toHaveLength(3);
    expect(getRecentWinners(values,NOW)[0].deck_archetype).toBeUndefined();
    expect(getRecentWinners(values,NOW)[0].source_url).toBe(values[1].source_url);
  });
  it('counts completed competitions once and withholds conflicting result records', () => {
    const values=winners([winner(),winner({id:'same-event-second-source'})]);
    expect(getRecentWinners(values,NOW)).toHaveLength(1);
    expect(getRecentWinners([...values,{...values[0],winner:'Conflicting name'}],NOW)).toEqual([]);
  });
  it('filters before the latest-three limit and never infers a deck or transforms a handle', () => {
    const values=winners([1,2,3,4,5].map(day=>winner({id:`w${day}`,event_id:`e${day}`,game:day>2?'One Piece':'Pokemon',
      winner:' @Exact✨ ',event_at:`2026-10-${20+day}T00:00:00Z`})));
    const result=getRecentWinners(filterEventRecords(values,{game:'Pokemon',organiser:'all',region:'all'}),NOW);
    expect(result.map(item=>item.id)).toEqual(['w2','w1']);
    expect(result[0].winner).toBe(' @Exact✨ ');
    expect(result[0].deck_archetype).toBeUndefined();
  });
});
