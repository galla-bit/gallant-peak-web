// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {TcgRadar} from './TcgRadar';
import type {TcgFeedResult} from './feed';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const ready: TcgFeedResult = {status:'ready',rejectedItems:1,snapshot:{schema_version:1,generated_at:'2026-10-22T01:50:00Z',delayed:true,minimum_delay_seconds:900,items:[
  {id:'p',game:'Pokemon',product:'Booster Box',retailer:'Retailer A',price_nzd:'189.99',availability:'in_stock',observed_at:'2026-10-22T01:35:00Z',retailer_url:'https://example.com/p'},
  {id:'o',game:'One Piece',product:'Display',retailer:'Retailer B',availability:'unknown',observed_at:'2026-10-22T01:34:00Z',retailer_url:'https://example.com/o'},
]}};

describe('TcgRadar', () => {
  it('shows a neutral loading state while a configured public feed is being requested', () => {
    render(<TcgRadar feed={{status:'loading'}}/>);
    expect(screen.getByRole('status').textContent).toMatch(/loading/i);
    expect(screen.getByRole('status').textContent).toMatch(/at least 15 minutes/i);
    expect(screen.queryByText(/in stock/i)).toBeNull();
  });
  it('shows safe status messages when unconfigured or unavailable', () => {
    const {rerender}=render(<TcgRadar feed={{status:'unconfigured'}}/>);
    expect(screen.getByRole('status').textContent).toMatch(/not connected/i);
    expect(screen.getByRole('status').textContent).toMatch(/at least 15 minutes/i);
    rerender(<TcgRadar feed={{status:'unavailable',reason:'stale'}}/>);
    expect(screen.getByRole('status').textContent).toMatch(/unavailable/i);
    expect(screen.getByRole('status').textContent).toMatch(/at least 15 minutes/i);
  });
  it('renders delayed validated stock without implying unknown is available', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T02:00:00Z'));
    render(<TcgRadar feed={ready}/>);
    expect(screen.getByText(/^DELAYED PUBLIC STOCK INTELLIGENCE$/i)).toBeTruthy();
    expect(screen.getByText(/delayed by at least 15 minutes/i)).toBeTruthy();
    expect(screen.getByText('Booster Box')).toBeTruthy();
    expect(screen.getByText('NZ$189.99')).toBeTruthy();
    expect(screen.getByText('Unknown', {selector: '.tcg-status--unknown'})).toBeTruthy();
    expect(screen.getByText('Price not supplied')).toBeTruthy();
    expect(screen.getByText(/Detected 25 minutes ago/i)).toBeTruthy();
    expect(screen.getByRole('link',{name:/view at retailer a/i}).getAttribute('rel')).toBe('noreferrer');
    expect(screen.getByText(/1 invalid record/i)).toBeTruthy();
  });
  it('filters by game', () => {
    render(<TcgRadar feed={ready}/>);
    fireEvent.change(screen.getByLabelText(/game/i),{target:{value:'One Piece'}});
    expect(screen.queryByText('Booster Box')).toBeNull();
    expect(screen.getByText('Display')).toBeTruthy();
  });
  it('filters by availability without promoting unknown stock', () => {
    render(<TcgRadar feed={ready}/>);
    fireEvent.change(screen.getByLabelText(/availability/i),{target:{value:'in_stock'}});
    expect(screen.getByText('Booster Box')).toBeTruthy();
    expect(screen.queryByText('Display')).toBeNull();
    fireEvent.change(screen.getByLabelText(/availability/i),{target:{value:'unknown'}});
    expect(screen.queryByText('Booster Box')).toBeNull();
    expect(screen.getByText('Display')).toBeTruthy();
    expect(screen.getByText('Unknown', {selector: '.tcg-status--unknown'})).toBeTruthy();
  });
});
