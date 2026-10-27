import {describe, expect, it, vi} from 'vitest';
import {loadTcgEventsFeed} from './feed';
import {loadTcgFeed} from '../feed';
import {event, NOW, snapshot, winner} from './test-fixtures';

const fetcherFor=(input:unknown)=>vi.fn(async()=>({ok:true,json:async()=>input})) as unknown as typeof fetch;
describe('independent events feed', () => {
  it('is unconfigured without an endpoint and never fetches or substitutes fixtures', async () => {
    const fetcher=vi.fn();
    const result=await loadTcgEventsFeed({now:NOW,fetcher});
    expect(result).toEqual({events:{status:'unconfigured'},winners:{status:'unconfigured'}});
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(['http://example.com/data','https://example.com/data?token=secret','bad',
    'https://localhost./data','https://service.local./data','https://service.internal./data'])('rejects unsafe endpoint %s before contact', async endpoint => {
    const fetcher=vi.fn();
    const result=await loadTcgEventsFeed({endpoint,now:NOW,fetcher});
    expect(result.events.status).toBe('unavailable');
    expect(result.winners.status).toBe('unavailable');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([{},snapshot({generated_at:'2026-10-27T00:00:00Z'})])('withholds invalid/stale responses', async input => {
    const result=await loadTcgEventsFeed({endpoint:'https://example.com/data',now:NOW,fetcher:fetcherFor(input)});
    expect(result.events.status).toBe('unavailable');
    expect(result.winners.status).toBe('unavailable');
  });
  it('fails closed and reports no secret-bearing network errors', async () => {
    const fetcher=vi.fn(async()=>{throw new Error('secret destination');});
    const result=await loadTcgEventsFeed({endpoint:'https://example.com/data',now:NOW,fetcher});
    expect(result.events).toEqual({status:'unavailable',reason:'request-failed'});
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it('retains independent rejected counts and domain availability', async () => {
    const input=snapshot({events:[event(),event({eligible:false})],winners:[winner(),winner({winner:''}),winner({verified:false})]});
    const result=await loadTcgEventsFeed({endpoint:'https://example.com/data',now:NOW,fetcher:fetcherFor(input)});
    expect(result.events).toMatchObject({status:'ready',items:[event()],rejectedItems:1,generatedAt:input.generated_at});
    expect(result.winners).toMatchObject({status:'ready',items:[winner()],rejectedItems:2});
    const partial=await loadTcgEventsFeed({endpoint:'https://example.com/data',now:NOW,fetcher:fetcherFor(snapshot({winners:null}))});
    expect(partial.events.status).toBe('ready');
    expect(partial.winners.status).toBe('unavailable');
  });
  it('does not mutate or reinterpret a separately loaded stock snapshot', async () => {
    const stock=await loadTcgFeed({nowMs:NOW,maxAgeMs:3600000,endpoint:'https://example.com/stock',fetcher:fetcherFor({
      schema_version:1,delayed:true,generated_at:new Date(NOW).toISOString(),items:[{
        id:'stock',game:'Pokemon',product:'Box',retailer:'Store',availability:'unknown',
        observed_at:new Date(NOW).toISOString(),retailer_url:'https://example.com/item',
      }],
    })});
    const before=JSON.stringify(stock);
    await loadTcgEventsFeed({endpoint:'https://example.com/events',now:NOW,fetcher:fetcherFor(null)});
    expect(JSON.stringify(stock)).toBe(before);
    expect(stock.status==='ready' && stock.snapshot.items[0].availability).toBe('unknown');
  });
});
