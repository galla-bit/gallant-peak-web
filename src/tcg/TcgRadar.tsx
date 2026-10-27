import {useMemo, useState} from 'react';
import type {TcgFeedResult} from './feed';
import type {TcgAvailability} from './types';

const labels: Record<TcgAvailability,string>={in_stock:'In stock',limited:'Limited',out_of_stock:'Out of stock',unknown:'Unknown'};
const PUBLIC_DELAY_COPY='The free public feed is delayed by at least 15 minutes.';

function detectedAge(observedAt:string){
  const minutes=Math.max(0,Math.floor((Date.now()-Date.parse(observedAt))/60000));
  return `Detected ${minutes} minute${minutes===1?'':'s'} ago`;
}

export function TcgRadar({feed}:{feed:TcgFeedResult}) {
  const [game,setGame]=useState('all');
  const [availability,setAvailability]=useState('all');
  const games=useMemo(()=>feed.status==='ready' ? [...new Set(feed.snapshot.items.map(item=>item.game))].sort() : [],[feed]);
  if(feed.status==='loading') return <div className="notice" role="status"><strong>RADAR STATUS · LOADING</strong><br/>{PUBLIC_DELAY_COPY} Requesting validated public TCG Hunt data. No stock is shown until validation completes.</div>;
  if(feed.status==='unconfigured') return <div className="notice" role="status"><strong>RADAR STATUS · NOT CONNECTED</strong><br/>{PUBLIC_DELAY_COPY} The public TCG Hunt feed is not connected in this build. No stock is being simulated.</div>;
  if(feed.status==='unavailable') return <div className="notice" role="status"><strong>RADAR STATUS · UNAVAILABLE</strong><br/>{PUBLIC_DELAY_COPY} Validated public stock data is currently unavailable. No cached demo stock is shown.</div>;
  const items=feed.snapshot.items.filter(item=>(game==='all'||item.game===game)&&(availability==='all'||item.availability===availability));
  return <section className="tcg-radar" aria-labelledby="tcg-radar-title">
    <div className="section-head"><div><p className="eyebrow">DELAYED PUBLIC STOCK INTELLIGENCE</p><h2 id="tcg-radar-title">NZ RETAIL RADAR</h2></div><p>{PUBLIC_DELAY_COPY} Confirm availability and checkout with the retailer.</p></div>
    <div className="tcg-filters">
      <label>Game<select value={game} onChange={event=>setGame(event.target.value)}><option value="all">All games</option>{games.map(value=><option key={value}>{value}</option>)}</select></label>
      <label>Availability<select value={availability} onChange={event=>setAvailability(event.target.value)}><option value="all">All states</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {feed.rejectedItems>0 && <p className="muted" role="status">{feed.rejectedItems} invalid record{feed.rejectedItems===1?'':'s'} withheld.</p>}
    <div className="tcg-results">{items.map(item=><article className="tcg-card" key={item.id}><p className="eyebrow">{item.game}</p><h3>{item.product}</h3><p>{item.retailer}</p><p className={`tcg-status tcg-status--${item.availability}`}>{labels[item.availability]}</p><p>{item.price_nzd ? `NZ$${item.price_nzd}` : 'Price not supplied'}</p><p className="muted">{detectedAge(item.observed_at)} · Observed {new Date(item.observed_at).toLocaleString('en-NZ')}</p><a href={item.retailer_url} target="_blank" rel="noreferrer">View at {item.retailer}</a></article>)}</div>
    {items.length===0 && <p role="status">No validated results match these filters.</p>}
  </section>;
}
