// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import {TcgRadar} from './TcgRadar';
import {inactiveEventsFeed} from './events/feed';

afterEach(cleanup);
it('public Verified Stores has no dedicated MythicDeck space or synthetic products',()=>{
  render(<TcgRadar feed={{status:'unavailable',reason:'stale'}} eventsFeed={inactiveEventsFeed('unconfigured')}/>);
  fireEvent.click(screen.getByRole('button',{name:'Verified Stores'}));
  expect(screen.getByText(/No verified store cards have been published/i)).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Preview MythicDeck demonstration'})).toBeNull();
  expect(screen.queryByRole('button',{name:'Open MythicDeck'})).toBeNull();
  fireEvent.click(within(screen.getByRole('group',{name:'Radar views'})).getByRole('button',{name:'Products'}));
  expect(screen.queryByText('Demonstration booster box')).toBeNull();
  expect(screen.getByRole('status').textContent).toMatch(/unavailable/i);
});
it('public Events remain independent of outbound-only store cards',()=>{
  render(<TcgRadar feed={{status:'unconfigured'}} eventsFeed={inactiveEventsFeed('unconfigured')}/>);
  fireEvent.click(screen.getByRole('button',{name:'Verified Stores'}));
  expect(screen.queryByText('Demonstration card league')).toBeNull();
  fireEvent.click(within(screen.getByRole('group',{name:'Radar views'})).getByRole('button',{name:'Events'}));
  expect(screen.getByRole('region',{name:'Public events'}).textContent).toMatch(/not connected/i);
  fireEvent.click(screen.getByRole('checkbox',{name:'Show demonstration retailer events'}));
  expect(screen.getByRole('heading',{name:'Demonstration card league'})).toBeTruthy();
  expect(screen.getByText('Demo Player')).toBeTruthy();
});
