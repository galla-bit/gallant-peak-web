// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {RadarViews} from './RadarViews';

afterEach(cleanup);
describe('Radar views', () => {
  it('places selectable Events between New & Upcoming and Verified Stores while Products remains initial', () => {
    render(<RadarViews products={<p>Validated products</p>} events={<p>Independent events</p>}/>);
    expect(screen.getAllByRole('button').map(button=>button.textContent)).toEqual(['Products','New & Upcoming','Events','Verified Stores']);
    const events=screen.getByRole('button',{name:'Events'});
    events.focus();
    expect(document.activeElement).toBe(events);
    fireEvent.click(events);
    expect(events.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('region',{name:'Events'}).textContent).toBe('Independent events');
  });
  it('selects Products initially and restores supplied product content on return', () => {
    render(<RadarViews products={<p>Validated products</p>}/>);
    expect(screen.getByRole('button', {name:'Products', pressed:true})).toBeTruthy();
    expect(screen.getByText('Validated products')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name:'Verified Stores'}));
    expect(screen.queryByText('Validated products')).toBeNull();
    fireEvent.click(screen.getByRole('button', {name:'Products'}));
    expect(screen.getByText('Validated products')).toBeTruthy();
  });

  it('shows the future GallantDiscoveries lifecycle without implying a connected release feed', () => {
    render(<RadarViews products={<p>Validated products</p>}/>);
    fireEvent.click(screen.getByRole('button', {name:'New & Upcoming'}));
    expect(screen.getByRole('button', {name:'New & Upcoming', pressed:true})).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/release intelligence.*not connected/i);
    expect(screen.getByText(/Official announcement → Coming soon → NZ listings discovered → Preorders open → Released → In stock → Restock\/price changes/)).toBeTruthy();
  });

  it('shows an empty authorised directory with a separate demonstration preview', () => {
    render(<RadarViews products={<p>Validated products</p>}/>);
    fireEvent.click(screen.getByRole('button', {name:'Verified Stores'}));
    expect(screen.getByRole('button', {name:'Verified Stores', pressed:true})).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/No authorised retailer spaces/i);
  });

  it.each(['New & Upcoming'])('never supplies demo or inferred stock data in %s', (name) => {
    render(<RadarViews products={<article>Validated products</article>}/>);
    fireEvent.click(screen.getByRole('button', {name}));
    const region = screen.getByRole('region', {name});
    expect(region.textContent).not.toMatch(/MythicDeck|Mighty Ape|Farmers|\$XX\.XX|monitoring paused/i);
    expect(within(region).queryByRole('article')).toBeNull();
    expect(within(region).queryByRole('link')).toBeNull();
    expect(within(region).getByRole('status').textContent).not.toMatch(/In stock/);
  });
});
