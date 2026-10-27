// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {TcgRadar} from './TcgRadar';
import type {TcgFeedResult} from './feed';
import {event, NOW, readyFeed, snapshot, winner} from './events/test-fixtures';

afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.useRealTimers();});

const ready: TcgFeedResult = {status:'ready',rejectedItems:1,snapshot:{schema_version:1,generated_at:'2026-10-22T01:50:00Z',delayed:true,minimum_delay_seconds:900,items:[
  {id:'p',game:'Pokemon',product:'Booster Box',retailer:'Retailer A',price_nzd:'189.99',availability:'in_stock',observed_at:'2026-10-22T01:35:00Z',retailer_url:'https://example.com/p'},
  {id:'p2',game:'Pokemon',product:'Booster Box',retailer:'Retailer C',price_nzd:'179.99',availability:'limited',observed_at:'2026-10-22T01:33:00Z',retailer_url:'https://example.com/p2'},
  {id:'o',game:'One Piece',product:'Display',retailer:'Retailer B',availability:'unknown',observed_at:'2026-10-22T01:34:00Z',retailer_url:'https://example.com/o'},
]}};

describe('TcgRadar', () => {
  it('keeps healthy Products usable while Events is unavailable', () => {
    render(<TcgRadar feed={ready} now={NOW} eventsFeed={readyFeed(snapshot({events:null,winners:null}))}/>);
    expect(screen.getByRole('heading',{name:'Booster Box'})).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Events'}));
    expect(screen.getByRole('region',{name:'Upcoming Events'}).textContent).toMatch(/unavailable/i);
    fireEvent.click(screen.getByRole('button',{name:'Products'}));
    expect(screen.getByRole('heading',{name:'Booster Box'})).toBeTruthy();
  });
  it('keeps Events usable when stock is unavailable and limits results to three competitions', () => {
    const winners=[1,2,3,4,5].map(day=>winner({id:`w${day}`,event_id:`e${day}`,winner:`Handle ${day}`,
      event_at:`2026-10-${20+day}T00:00:00Z`}));
    render(<TcgRadar feed={{status:'unavailable',reason:'stale'}} now={NOW} eventsFeed={readyFeed(snapshot({winners}))}/>);
    fireEvent.click(screen.getByRole('button',{name:'Events'}));
    expect(screen.getByRole('heading',{name:'Published competition'})).toBeTruthy();
    const results=screen.getByRole('region',{name:'Recent Winners'});
    expect(within(results).getAllByRole('article')).toHaveLength(3);
    expect(results.textContent).not.toMatch(/Handle 1|Handle 2/);
    expect(results.textContent).toMatch(/Handle 5/);
  });
  it('keeps Events filters and rejected-record counts separate from stock', () => {
    render(<TcgRadar feed={ready} now={NOW} eventsFeed={readyFeed(snapshot({events:[event(),event({eligible:false}),event({eligible:false})],
      winners:[winner({winner:''})]}))}/>);
    fireEvent.click(screen.getByRole('button',{name:'Events'}));
    expect(screen.getByText('2 invalid event records withheld.')).toBeTruthy();
    expect(screen.getByText('1 invalid result records withheld.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Event organiser'),{target:{value:'store-a'}});
    fireEvent.change(screen.getByLabelText('Upcoming window'),{target:{value:'7'}});
    expect(screen.getByRole('heading',{name:'Published competition'})).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Products'}));
    expect(screen.getByText(/1 invalid record withheld/)).toBeTruthy();
    expect(screen.queryByText(/invalid event records/)).toBeNull();
  });
  it('loads only an independently configured public events endpoint', async () => {
    const fetcher=vi.fn(async(_input:RequestInfo|URL,_init?:RequestInit)=>({ok:true,json:async()=>snapshot()}));
    vi.stubGlobal('fetch',fetcher);
    render(<TcgRadar feed={{status:'unconfigured'}} now={NOW} eventsEndpoint="https://example.com/public-events"/>);
    fireEvent.click(screen.getByRole('button',{name:'Events'}));
    await waitFor(()=>expect(screen.getByRole('heading',{name:'Published competition'})).toBeTruthy());
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe('https://example.com/public-events');
  });
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
    expect(screen.getByText('From NZ$179.99')).toBeTruthy();
    expect(screen.getByText('Unknown', {selector: '.tcg-status--unknown'})).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:/compare retailers for Display/i}));
    expect(screen.getByText('Price not supplied')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:/compare retailers for Booster Box/i}));
    expect(screen.getAllByText(/Detected 25 minutes ago/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link',{name:/view at retailer a/i}).getAttribute('rel')).toBe('noreferrer');
    expect(screen.getByText(/1 invalid record/i)).toBeTruthy();
  });
  it('groups two retailer offers under one product heading', () => {
    render(<TcgRadar feed={ready}/>);
    expect(screen.getAllByRole('heading',{name:'Booster Box'})).toHaveLength(1);
    expect(screen.getByText('2 retailers')).toBeTruthy();
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
  it('keeps a product when a non-summary offer matches the exact state', () => {
    render(<TcgRadar feed={ready}/>);
    fireEvent.change(screen.getByLabelText(/availability/i),{target:{value:'limited'}});
    expect(screen.getByRole('heading',{name:'Booster Box'})).toBeTruthy();
    expect(screen.getByText('In stock',{selector:'.tcg-status--in_stock'})).toBeTruthy();
    expect(screen.queryByRole('heading',{name:'Display'})).toBeNull();
  });
  it('reports zero matching products', () => {
    render(<TcgRadar feed={ready}/>);
    fireEvent.change(screen.getByLabelText(/availability/i),{target:{value:'out_of_stock'}});
    expect(screen.getByText('No validated results match these filters.')).toBeTruthy();
    expect(screen.queryByRole('article')).toBeNull();
  });
  it.each(['loading','unconfigured','unavailable'] as const)('withholds previously rendered stock when feed becomes %s', (status) => {
    const {rerender}=render(<TcgRadar feed={ready}/>);
    rerender(<TcgRadar feed={status==='unavailable'?{status,reason:'stale'}:{status}}/>);
    expect(screen.queryByText('Booster Box')).toBeNull();
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('status').textContent).toMatch(status==='loading'?/loading/i:status==='unconfigured'?/not connected/i:/unavailable/i);
    expect(screen.getByRole('status').textContent).toMatch(/at least 15 minutes/i);
    expect(screen.queryByText(/MythicDeck|\$XX\.XX/)).toBeNull();
  });
  it('switches Cards and Compact presentation without changing product or offer truth', () => {
    render(<TcgRadar feed={ready}/>);
    const cards=screen.getByRole('button',{name:'Cards',pressed:true});
    const results=screen.getByRole('list',{name:'Products'});
    expect(results.classList.contains('tcg-product-grid--compact')).toBe(false);
    fireEvent.click(screen.getByRole('button',{name:/compare retailers for Booster Box/i}));
    const offerLinks=screen.getAllByRole('link').map(link=>link.getAttribute('href'));
    const headings=screen.getAllByRole('heading',{level:3}).map(heading=>heading.textContent);
    fireEvent.click(screen.getByRole('button',{name:'Compact'}));
    expect(screen.getByRole('button',{name:'Compact',pressed:true})).toBeTruthy();
    expect(results.classList.contains('tcg-product-grid--compact')).toBe(true);
    expect(screen.getAllByRole('heading',{level:3}).map(heading=>heading.textContent)).toEqual(headings);
    expect(screen.getAllByRole('link').map(link=>link.getAttribute('href'))).toEqual(offerLinks);
    expect(within(results).getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('button',{name:/hide retailers for Booster Box/i}).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(cards);
    expect(cards.getAttribute('aria-pressed')).toBe('true');
    expect(results.classList.contains('tcg-product-grid--compact')).toBe(false);
    expect(screen.getAllByRole('link').map(link=>link.getAttribute('href'))).toEqual(offerLinks);
  });
});
