import {describe, expect, it} from 'vitest';
import {filterProductGroups, groupTcgItems} from './presentation';
import type {TcgPublicItem} from './types';
import {parseTcgPublicSnapshot} from './contract';

function offer(overrides: Partial<TcgPublicItem> = {}): TcgPublicItem {
  return {id:'a', game:'Pokemon', product:'Booster Box', retailer:'Retailer A',
    availability:'unknown', observed_at:'2026-10-27T10:00:00Z',
    retailer_url:'https://example.com/a', ...overrides};
}

describe('product grouping', () => {
  it('groups_case_and_whitespace_equivalent_product_offers', () => {
    const first = offer();
    const second = offer({id:'b', game:'  POKEMON ', product:' booster   BOX ', retailer:'Retailer B'});
    const groups = groupTcgItems([first, second]);
    expect(groups).toHaveLength(1);
    expect(groups[0].game).toBe('Pokemon');
    expect(groups[0].product).toBe('Booster Box');
    expect(groups[0].offers).toEqual([first, second]);
    expect(groups[0].offers[1]).toBe(second);
  });

  it('keeps_meaningful_product_name_differences_separate', () => {
    const products = ['Booster Box Japanese', 'Booster Box English', 'Booster Box English 24 pack'];
    expect(groupTcgItems(products.map(product=>offer({product})))).toHaveLength(3);
    expect(groupTcgItems([offer(), offer({game:'One Piece'})])).toHaveLength(2);
  });

  it('keeps_duplicate_validated_offers_inspectable', () => {
    const first = offer();
    const newer = offer({observed_at:'2026-10-27T11:00:00Z'});
    expect(groupTcgItems([first, newer])[0].offers).toEqual([first, newer]);
  });

  it.each([
    [['out_of_stock'], 'out_of_stock'],
    [['unknown'], 'unknown'],
    [['out_of_stock', 'unknown'], 'unknown'],
    [['unknown', 'limited'], 'limited'],
    [['limited', 'in_stock', 'unknown'], 'in_stock'],
  ] as const)('summarizes %j as %s', (states, expected) => {
    expect(groupTcgItems(states.map(availability=>offer({availability})))[0].aggregateAvailability).toBe(expected);
  });

  it('uses only priced in-stock or limited offers for the lowest available price', () => {
    const group = groupTcgItems([
      offer({price_nzd:'100.00', availability:'in_stock'}),
      offer({price_nzd:'90.50', availability:'limited'}),
      offer({price_nzd:'1.00', availability:'out_of_stock'}),
      offer({price_nzd:'2.00', availability:'unknown'}),
      offer({availability:'in_stock'}),
    ])[0];
    expect(group.lowestAvailablePriceNzd).toBe(90.5);
    expect(groupTcgItems([offer(), offer({price_nzd:'1.00'})])[0].lowestAvailablePriceNzd).toBeUndefined();
    expect(groupTcgItems([offer({availability:'limited', price_nzd:'0.00'})])[0].lowestAvailablePriceNzd).toBe(0);
  });

  it('counts distinct retailers and compares observation instants rather than timestamp strings', () => {
    const group = groupTcgItems([
      offer(), offer({observed_at:'2026-10-27T10:30:00Z'}),
      offer({retailer:'Retailer B', observed_at:'2026-10-27T22:00:00+13:00'}),
    ])[0];
    expect(group.retailerCount).toBe(2);
    expect(group.latestObservedAt).toBe('2026-10-27T10:30:00Z');
  });

  it('filters by display game and exact underlying offer state', () => {
    const groups = groupTcgItems([
      offer({availability:'in_stock'}), offer({availability:'unknown'}),
      offer({game:'One Piece', product:'Display'}),
    ]);
    expect(filterProductGroups(groups, {game:'all', availability:'unknown'})).toHaveLength(2);
    expect(filterProductGroups(groups, {game:'Pokemon', availability:'unknown'})).toEqual([groups[0]]);
    expect(filterProductGroups(groups, {game:'all', availability:'limited'})).toEqual([]);
    expect(filterProductGroups(groups, {game:'all', availability:'all'})).toEqual(groups);
    expect(groups[0].offers).toHaveLength(2);
  });

  it('handles an empty snapshot', () => {
    expect(groupTcgItems([])).toEqual([]);
  });

  it('does not advertise an infinite price from an accepted oversized price string', () => {
    const nowMs = Date.parse('2026-10-27T12:00:00Z');
    const parsed = parseTcgPublicSnapshot({
      schema_version:1, delayed:true, generated_at:new Date(nowMs).toISOString(),
      items:[offer({availability:'in_stock', price_nzd:'9'.repeat(309)})],
    }, nowMs, 60000);
    expect(parsed.snapshot?.items).toHaveLength(1);
    const group = groupTcgItems(parsed.snapshot!.items)[0];
    expect(group.lowestAvailablePriceNzd).toBeUndefined();
    expect(group.aggregateAvailability).toBe('in_stock');
    expect(group.offers).toEqual(parsed.snapshot!.items);
  });
});
