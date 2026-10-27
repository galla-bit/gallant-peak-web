// @vitest-environment jsdom
import {cleanup, render, screen, within} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {EventsView} from './EventsView';
import {inactiveEventsFeed} from './feed';
import {event, NOW, readyFeed, snapshot, winner} from './test-fixtures';

afterEach(cleanup);
describe('Events and Recent Winners', () => {
  it('shows explicit event details, provenance and external registration without inventing optional facts', () => {
    render(<EventsView now={NOW} feed={readyFeed(snapshot({events:[event({city:'Whanganui',region:'Manawatū-Whanganui',
      format:'Standard',entry_fee:'NZ$10',registration_status:'Open'})]}))}/>);
    const region=screen.getByRole('region',{name:'Upcoming Events'});
    for (const text of ['Pokemon','Published competition','Test Organiser A','Whanganui','Manawatū-Whanganui','Standard','NZ$10','Open']) {
      expect(within(region).getByText(text)).toBeTruthy();
    }
    const link=within(region).getByRole('link',{name:/View \/ Register at Test Organiser A/i});
    expect(link.getAttribute('href')).toBe('https://example.com/events/a');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noreferrer');
    expect(within(region).getByRole('link',{name:'Organiser source'}).getAttribute('href')).toBe('https://example.com/sources/a');
    expect(region.querySelector('time')?.dateTime).toBe('2026-10-29T02:00:00Z');
    expect(region.textContent).toMatch(/Observed|Updated/);
  });
  it('omits unpublished optional facts rather than guessing', () => {
    render(<EventsView now={NOW} feed={readyFeed()}/>);
    const upcoming=screen.getByRole('region',{name:'Upcoming Events'});
    expect(upcoming.textContent).not.toMatch(/Free|Standard|Open registration/);
    expect(screen.queryByText(/Deck:/)).toBeNull();
  });
  it('shows only the three newest completed competitions and exact published winner/deck facts', () => {
    const results=[1,2,3,4].map(day=>winner({id:`w${day}`,event_id:`e${day}`,event_name:`Competition ${day}`,
      winner:`@Winner ${day}`,event_at:`2026-10-${20+day}T00:00:00Z`,...(day===4?{deck_archetype:'Published deck'}:{})}));
    render(<EventsView now={NOW} feed={readyFeed(snapshot({winners:results}))}/>);
    const region=screen.getByRole('region',{name:'Recent Winners'});
    expect(within(region).getAllByRole('heading',{level:4}).map(heading=>heading.textContent)).toEqual(['Competition 4','Competition 3','Competition 2']);
    expect(within(region).queryByText('@Winner 1')).toBeNull();
    expect(within(region).getByText('@Winner 4')).toBeTruthy();
    expect(within(region).getByText('Deck: Published deck')).toBeTruthy();
    expect(region.textContent).not.toMatch(/Top 4|Top 8|runner.up|standings/i);
    expect(within(region).getAllByRole('link',{name:/Official source/})).toHaveLength(3);
  });
  it.each(['loading','unconfigured'] as const)('keeps both %s domains honest without fixtures', status => {
    render(<EventsView now={NOW} feed={inactiveEventsFeed(status)}/>);
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByRole('region',{name:'Upcoming Events'}).textContent).toMatch(status==='loading'?/loading/i:/not connected/i);
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
  it('does not turn unavailable/stale domains into claims that no events or winners exist', () => {
    render(<EventsView now={NOW+3600001} feed={readyFeed()}/>);
    expect(screen.getByRole('region',{name:'Upcoming Events'}).textContent).toMatch(/information unavailable/i);
    expect(screen.getByRole('region',{name:'Recent Winners'}).textContent).toMatch(/results unavailable/i);
    expect(screen.queryByRole('article')).toBeNull();
  });
  it('retains valid events when results fail and shows truthful empty results', () => {
    const {rerender}=render(<EventsView now={NOW} feed={readyFeed(snapshot({winners:null}))}/>);
    expect(screen.getByRole('heading',{name:'Published competition'})).toBeTruthy();
    expect(screen.getByRole('region',{name:'Recent Winners'}).textContent).toMatch(/unavailable/i);
    rerender(<EventsView now={NOW} feed={readyFeed(snapshot({events:[],winners:[]}))}/>);
    expect(screen.getByText('No upcoming events match these filters.')).toBeTruthy();
    expect(screen.getByText('No published recent winner is available.')).toBeTruthy();
  });
});
