import {describe, expect, it, vi} from 'vitest';
import {loadTcgFeed} from './feed';

const nowMs = Date.parse('2026-10-22T02:00:00Z');
const payload = {schema_version:1,generated_at:'2026-10-22T01:50:00Z',delayed:true,items:[{id:'x',game:'Pokemon',product:'Box',retailer:'Retailer',availability:'in_stock',observed_at:'2026-10-22T01:45:00Z',retailer_url:'https://example.com/x'}]};

describe('loadTcgFeed', () => {
  it('does not fetch when the public endpoint is unconfigured', async () => {
    const fetcher = vi.fn();
    expect(await loadTcgFeed({nowMs,maxAgeMs:3600000,fetcher})).toEqual({status:'unconfigured'});
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns only a validated ready snapshot', async () => {
    const fetcher = vi.fn().mockResolvedValue({ok:true,json:async()=>payload});
    const result = await loadTcgFeed({endpoint:'https://public.example/feed.json',nowMs,maxAgeMs:3600000,fetcher:fetcher as unknown as typeof fetch});
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.snapshot.items[0].availability).toBe('in_stock');
  });

  it.each([
    ['HTTP failure', vi.fn().mockResolvedValue({ok:false,status:503})],
    ['network failure', vi.fn().mockRejectedValue(new Error('offline'))],
    ['invalid JSON', vi.fn().mockResolvedValue({ok:true,json:async()=>{throw new Error('bad json')}})],
  ])('fails closed for %s', async (_name, fetcher) => {
    const result = await loadTcgFeed({endpoint:'https://public.example/feed.json',nowMs,maxAgeMs:3600000,fetcher:fetcher as unknown as typeof fetch});
    expect(result.status).toBe('unavailable');
  });

  it('fails closed for stale or unsupported payloads and never substitutes fixture stock', async () => {
    for (const bad of [{...payload,generated_at:'2026-10-20T01:50:00Z'},{...payload,schema_version:2}]) {
      const result = await loadTcgFeed({endpoint:'https://public.example/feed.json',nowMs,maxAgeMs:3600000,fetcher:(async()=>({ok:true,json:async()=>bad})) as unknown as typeof fetch});
      expect(result.status).toBe('unavailable');
    }
  });
});
