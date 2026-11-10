// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {parseTcgPublicSnapshot} from './contract';
import {TcgRadar} from './TcgRadar';
afterEach(cleanup);
const now=Date.parse('2026-11-10T03:00:00.000Z');
const snapshot={
  schema_version:1,generated_at:'2026-11-10T03:00:00.000Z',delayed:true,minimum_delay_seconds:900,
  items:[{id:'synthetic:sku-1',game:'Pokémon',product:'Synthetic booster',retailer:'Synthetic Retailer',
    price_nzd:'12.00',availability:'in_stock',observed_at:'2026-11-10T02:40:00.000Z',
    retailer_url:'https://example.com/products/synthetic'}],
};
it('accepts the synthetic durable publisher contract and routes a product to its retailer',()=>{
  const parsed=parseTcgPublicSnapshot(snapshot,now,3600000);
  expect(parsed.rejectedItems).toBe(0);
  expect(parsed.snapshot).not.toBeNull();
  render(<TcgRadar feed={{status:'ready',snapshot:parsed.snapshot!,rejectedItems:0}}/>);
  expect(screen.getByText('Synthetic booster')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Compare retailers for Synthetic booster'}));
  const link=screen.getByRole('link',{name:'View at Synthetic Retailer'});
  expect(link.getAttribute('href')).toBe('https://example.com/products/synthetic');
});
it('rejects a synthetic offer newer than the required public delay',()=>{
  const tooRecent={...snapshot,items:[{...snapshot.items[0],observed_at:'2026-11-10T02:59:00.000Z'}]};
  expect(parseTcgPublicSnapshot(tooRecent,now,3600000).reason).toBe('minimum-delay-violation');
});
