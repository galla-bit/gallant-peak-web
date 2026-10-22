import {describe, expect, it} from 'vitest';
import {parseTcgPublicSnapshot} from './contract';

const now = Date.parse('2026-10-22T02:00:00Z');
const validItem = {
  id: 'public-1', game: 'Pokemon', product: 'Example Booster Box', retailer: 'Example Cards',
  price_nzd: '189.99', availability: 'in_stock', observed_at: '2026-10-22T01:35:00Z',
  retailer_url: 'https://retailer.example/product',
};
const validSnapshot = {schema_version: 1, generated_at: '2026-10-22T01:50:00Z', delayed: true, minimum_delay_seconds: 900, items: [validItem]};

describe('TCG public v1 contract', () => {
  it('accepts the exact v1 schema and all supported availability values', () => {
    const value = {...validSnapshot, items: ['in_stock','limited','out_of_stock','unknown'].map((availability, i) => ({...validItem,id:`public-${i}`,availability}))};
    const result = parseTcgPublicSnapshot(value, now, 60 * 60 * 1000);
    expect(result.snapshot?.items.map(item => item.availability)).toEqual(['in_stock','limited','out_of_stock','unknown']);
  });

  it('accepts an absent price without inventing one', () => {
    const {price_nzd: _price, ...withoutPrice} = validItem;
    const result = parseTcgPublicSnapshot({...validSnapshot, items:[withoutPrice]}, now, 60 * 60 * 1000);
    expect(result.snapshot?.items[0].price_nzd).toBeUndefined();
  });

  it('keeps valid records while rejecting invalid item records', () => {
    const result = parseTcgPublicSnapshot({...validSnapshot, items:[validItem,{...validItem,id:'bad',retailer_url:'http://unsafe.example'}]}, now, 60 * 60 * 1000);
    expect(result.snapshot?.items).toHaveLength(1);
    expect(result.rejectedItems).toBe(1);
  });

  it.each([
    [{...validSnapshot, schema_version:2}, 'unsupported-schema'],
    [{...validSnapshot, generated_at:'not-a-date'}, 'invalid-generated-at'],
    [{...validSnapshot, generated_at:'2026-10-22T03:00:00Z'}, 'future-generated-at'],
    [{...validSnapshot, generated_at:'2026-10-21T20:00:00Z'}, 'stale'],
  ])('fails closed for invalid top-level data', (value, reason) => {
    const result = parseTcgPublicSnapshot(value, now, 60 * 60 * 1000);
    expect(result.snapshot).toBeNull();
    expect(result.reason).toBe(reason);
  });

  it.each([
    [(() => { const {minimum_delay_seconds: _delay, ...withoutDelay} = validSnapshot; return withoutDelay; })()],
    [{...validSnapshot, minimum_delay_seconds: 600}],
  ])('fails closed when the minimum public delay contract is missing or changed', (value) => {
    const result = parseTcgPublicSnapshot(value, now, 60 * 60 * 1000);
    expect(result.snapshot).toBeNull();
    expect(result.reason).toBe('invalid-minimum-delay');
  });

  it('rejects an item observed less than 15 minutes before artifact generation', () => {
    const tooRecent = {...validItem, id:'too-recent', observed_at:'2026-10-22T01:40:01Z'};
    const result = parseTcgPublicSnapshot({...validSnapshot, items:[validItem, tooRecent]}, now, 60 * 60 * 1000);
    expect(result.snapshot?.items).toHaveLength(1);
    expect(result.rejectedItems).toBe(1);
  });

  it('rejects an item with an unknown availability value', () => {
    const result = parseTcgPublicSnapshot({...validSnapshot, items:[validItem,{...validItem,id:'bad',availability:'maybe'}]}, now, 60 * 60 * 1000);
    expect(result.snapshot?.items).toHaveLength(1);
    expect(result.rejectedItems).toBe(1);
  });

  it('rejects malformed IDs, timestamps and non-HTTPS retailer URLs at item level', () => {
    const items = [validItem,{...validItem,id:''},{...validItem,id:'bad-time',observed_at:'yesterday'},{...validItem,id:'bad-url',retailer_url:'javascript:alert(1)'}];
    const result = parseTcgPublicSnapshot({...validSnapshot, items}, now, 60 * 60 * 1000);
    expect(result.snapshot?.items).toHaveLength(1);
    expect(result.rejectedItems).toBe(3);
  });
});
