// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {RadarViews} from './RadarViews';

afterEach(cleanup);
describe('Radar views', () => {
  it('selects Products initially and restores supplied product content on return', () => {
    render(<RadarViews products={<p>Validated products</p>}/>);
    expect(screen.getByRole('button', {name:'Products', pressed:true})).toBeTruthy();
    expect(screen.getByText('Validated products')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', {name:'Stores'}));
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

  it('shows an explicit unconnected public retailer projection', () => {
    render(<RadarViews products={<p>Validated products</p>}/>);
    fireEvent.click(screen.getByRole('button', {name:'Stores'}));
    expect(screen.getByRole('button', {name:'Stores', pressed:true})).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/public retailer.*not connected/i);
  });

  it.each(['New & Upcoming', 'Stores'])('never supplies demo or inferred stock data in %s', (name) => {
    render(<RadarViews products={<article>Validated products</article>}/>);
    fireEvent.click(screen.getByRole('button', {name}));
    const region = screen.getByRole('region', {name});
    expect(region.textContent).not.toMatch(/MythicDeck|Mighty Ape|Farmers|\$XX\.XX|monitoring paused/i);
    expect(within(region).queryByRole('article')).toBeNull();
    expect(within(region).queryByRole('link')).toBeNull();
    expect(within(region).getByRole('status').textContent).not.toMatch(/In stock/);
  });
});
