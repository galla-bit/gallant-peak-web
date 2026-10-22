// @vitest-environment jsdom
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it} from 'vitest';
import {TcgRadar} from './TcgRadar';
import type {TcgFeedResult} from './feed';

afterEach(cleanup);

const ready: TcgFeedResult = {status:'ready',rejectedItems:1,snapshot:{schema_version:1,generated_at:'2026-10-22T01:50:00Z',delayed:true,items:[
  {id:'p',game:'Pokemon',product:'Booster Box',retailer:'Retailer A',price_nzd:'189.99',availability:'in_stock',observed_at:'2026-10-22T01:45:00Z',retailer_url:'https://example.com/p'},
  {id:'o',game:'One Piece',product:'Display',retailer:'Retailer B',availability:'unknown',observed_at:'2026-10-22T01:44:00Z',retailer_url:'https://example.com/o'},
]}};

describe('TcgRadar', () => {
  it('shows safe status messages when unconfigured or unavailable', () => {
    const {rerender}=render(<TcgRadar feed={{status:'unconfigured'}}/>);
    expect(screen.getByText(/not connected/i)).toBeInTheDocument();
    rerender(<TcgRadar feed={{status:'unavailable',reason:'stale'}}/>);
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
  it('renders delayed validated stock without implying unknown is available', () => {
    render(<TcgRadar feed={ready}/>);
    expect(screen.getByText(/delayed/i)).toBeInTheDocument();
    expect(screen.getByText('Booster Box')).toBeInTheDocument();
    expect(screen.getByText('NZ$189.99')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByRole('link',{name:/view at retailer a/i})).toHaveAttribute('rel','noreferrer');
    expect(screen.getByText(/1 invalid record/i)).toBeInTheDocument();
  });
  it('filters by game', () => {
    render(<TcgRadar feed={ready}/>);
    fireEvent.change(screen.getByLabelText(/game/i),{target:{value:'One Piece'}});
    expect(screen.queryByText('Booster Box')).not.toBeInTheDocument();
    expect(screen.getByText('Display')).toBeInTheDocument();
  });
});
