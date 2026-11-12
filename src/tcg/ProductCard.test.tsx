// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {ProductCard} from './ProductCard';
import {groupTcgItems} from './presentation';
import type {TcgPublicItem} from './types';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const offers: TcgPublicItem[] = [
  {id:'a', game:'Pokemon', product:'Booster Box', retailer:'Retailer A', price_nzd:'189.99',
    availability:'in_stock', observed_at:'2026-10-27T10:00:00Z', retailer_url:'https://example.com/a'},
  {id:'a', game:'Pokemon', product:'Booster Box', retailer:'Retailer A',
    availability:'unknown', observed_at:'2026-10-27T09:00:00Z', retailer_url:'https://example.com/a'},
  {id:'b', game:'Pokemon', product:'Booster Box', retailer:'Retailer B', price_nzd:'99.99',
    availability:'out_of_stock', observed_at:'2026-10-27T08:00:00Z', retailer_url:'https://example.com/b'},
];

describe('ProductCard', () => {
  it('shows a collapsed product summary with truthful availability, price and freshness', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T10:25:00Z'));
    const {container} = render(<ProductCard group={groupTcgItems(offers)[0]}/>);
    expect(screen.getByRole('article')).toBeTruthy();
    expect(screen.getByRole('heading', {name:'Booster Box'})).toBeTruthy();
    expect(screen.getByText('Pokemon')).toBeTruthy();
    expect(screen.getByText('In stock')).toBeTruthy();
    expect(screen.getByText('2 retailers')).toBeTruthy();
    expect(screen.getByText('From NZ$189.99')).toBeTruthy();
    expect(screen.getByText(/Detected 25 minutes ago/i)).toBeTruthy();
    expect(container.querySelector('time')?.dateTime).toBe(offers[0].observed_at);
    expect(screen.getByRole('button', {name:/compare retailers/i}).getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('omits the From price when no available offer has a price', () => {
    render(<ProductCard group={groupTcgItems([offers[1], offers[2]])[0]}/>);
    expect(screen.queryByText(/From NZ\$/)).toBeNull();
    expect(screen.getByText('Unknown')).toBeTruthy();
  });

  it('expands every validated offer including duplicate retailer observations, then collapses', () => {
    render(<ProductCard group={groupTcgItems(offers)[0]}/>);
    const control = screen.getByRole('button', {name:/compare retailers/i});
    fireEvent.click(control);
    expect(control.getAttribute('aria-expanded')).toBe('true');
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    const states = ['In stock', 'Out of stock', 'Unknown'];
    const orderedOffers = [offers[0], offers[2], offers[1]];
    rows.forEach((row, index) => {
      const item = orderedOffers[index];
      expect(within(row).getByText(item.retailer)).toBeTruthy();
      expect(within(row).getByText(states[index])).toBeTruthy();
      expect(within(row).getByText(item.price_nzd ? `NZ$${item.price_nzd}` : 'Price not supplied')).toBeTruthy();
      expect(row.querySelector('time')?.dateTime).toBe(item.observed_at);
      const link = within(row).getByRole('link', {name:`View at ${item.retailer}`});
      expect(link.getAttribute('href')).toBe(item.retailer_url);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noreferrer');
      expect(link.getAttribute('rel')).toContain('noopener');
    });
    expect(screen.getAllByRole('link', {name:'View at Retailer A'})).toHaveLength(2);
    fireEvent.click(control);
    expect(control.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('Retailer comparison price safety', () => {
  it('prioritises available priced offers, then available unpriced, then unavailable offers', () => {
    const sample: TcgPublicItem[]=[
      {...offers[0],id:'unavailable',retailer:'Unavailable',price_nzd:'1.00',availability:'out_of_stock'},
      {...offers[0],id:'unknown',retailer:'Unknown',price_nzd:'2.00',availability:'unknown'},
      {...offers[0],id:'unpriced',retailer:'Unpriced',price_nzd:undefined,availability:'limited'},
      {...offers[0],id:'available',retailer:'Available',price_nzd:'25.00',availability:'in_stock'},
    ];
    render(<ProductCard group={groupTcgItems(sample)[0]}/>);
    expect(screen.getByText('From NZ$25.00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:/compare retailers/i}));
    const rows=within(screen.getByRole('list',{name:/Retailer offers/i})).getAllByRole('listitem');
    expect(rows.map(row=>within(row).getByRole('link').textContent)).toEqual([
      'View at Available','View at Unpriced','View at Unavailable','View at Unknown',
    ]);
    expect(screen.getByText(/Historical retailer observations/)).toBeTruthy();
  });
});
