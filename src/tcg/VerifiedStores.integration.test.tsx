// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import {TcgRadar} from './TcgRadar';
import {inactiveEventsFeed} from './events/feed';

afterEach(cleanup);
it('opens only an explicit demonstration and keeps local products out of public Products',()=>{
  render(<TcgRadar feed={{status:'unavailable',reason:'stale'}} eventsFeed={inactiveEventsFeed('unconfigured')}/>);
  fireEvent.click(screen.getByRole('button',{name:'Verified Stores'}));
  expect(screen.getByText(/No authorised retailer spaces/i)).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Open MythicDeck'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Preview MythicDeck demonstration'}));
  expect(screen.getByText(/No production retailer authorisation/i)).toBeTruthy();
  fireEvent.click(within(screen.getByRole('group',{name:'MythicDeck sections'})).getByRole('button',{name:'Products'}));
  expect(screen.getByRole('heading',{name:'Demonstration booster box'})).toBeTruthy();
  expect(screen.getByText(/Gallant Peak controls broader publication/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'News & Updates'}));
  expect(screen.getByRole('heading',{name:'Demonstration store update'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Back to Verified Stores'}));
  fireEvent.click(within(screen.getByRole('group',{name:'Radar views'})).getByRole('button',{name:'Products'}));
  expect(screen.queryByText('Demonstration booster box')).toBeNull();
  expect(screen.getByRole('status').textContent).toMatch(/unavailable/i);
});
it('reuses canonical demonstration events in both spaces without replacing unavailable public events',()=>{
  render(<TcgRadar feed={{status:'unconfigured'}} eventsFeed={inactiveEventsFeed('unconfigured')}/>);
  fireEvent.click(screen.getByRole('button',{name:'Verified Stores'}));
  fireEvent.click(screen.getByRole('button',{name:'Preview MythicDeck demonstration'}));
  fireEvent.click(screen.getByRole('button',{name:'Events & Competitions'}));
  expect(screen.getByRole('heading',{name:'Demonstration card league'})).toBeTruthy();
  expect(screen.getByText('Demo Player')).toBeTruthy();
  expect(screen.queryByRole('link')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Events'}));
  expect(screen.queryByText('Demonstration card league')).toBeNull();
  expect(screen.getByRole('region',{name:'Upcoming Events'}).textContent).toMatch(/not connected/);
  fireEvent.click(screen.getByRole('checkbox',{name:'Show demonstration retailer events'}));
  expect(screen.getByRole('heading',{name:'Demonstration card league'})).toBeTruthy();
  expect(screen.getByText('Demo Player')).toBeTruthy();
  expect(screen.getByRole('region',{name:'Public events'}).textContent).toMatch(/not connected/);
});
