import {useMemo, useState} from 'react';
import type {TcgFeedResult} from './feed';
import type {TcgAvailability} from './types';
import {filterProductGroups, groupTcgItems} from './presentation';
import {ProductCard} from './ProductCard';
import {RadarViews} from './RadarViews';
import {EventsView} from './events/EventsView';
import {useEventsFeed} from './events/useEventsFeed';
import type {TcgEventsFeedResult} from './events/feed';

const labels: Record<TcgAvailability,string>={in_stock:'In stock',limited:'Limited',out_of_stock:'Out of stock',unknown:'Unknown'};

export function TcgRadar({feed,eventsFeed,eventsEndpoint=import.meta.env.VITE_TCG_EVENTS_PUBLIC_FEED_URL,now}:
  {feed:TcgFeedResult;eventsFeed?:TcgEventsFeedResult;eventsEndpoint?:string;now?:number}) {
  const eventData=useEventsFeed(eventsEndpoint,eventsFeed,now);
  const [game,setGame]=useState('all');
  const [availability,setAvailability]=useState('all');
  const [displayMode,setDisplayMode]=useState<'cards'|'compact'>('cards');
  const groups=useMemo(()=>feed.status==='ready' ? groupTcgItems(feed.snapshot.items) : [],[feed]);
  const games=useMemo(()=>[...new Set(groups.map(group=>group.game))].sort(),[groups]);
  function stockProducts() {
  if(feed.status==='loading') return <div className="notice" role="status"><strong>RADAR STATUS · LOADING</strong><br/>Requesting the delayed public TCG Hunt feed. No stock is shown until validation completes.</div>;
  if(feed.status==='unconfigured') return <div className="notice" role="status"><strong>RADAR STATUS · NOT CONNECTED</strong><br/>The public TCG Hunt feed is not connected in this build. No stock is being simulated.</div>;
  if(feed.status==='unavailable') return <div className="notice" role="status"><strong>RADAR STATUS · UNAVAILABLE</strong><br/>Validated public stock data is currently unavailable. No cached demo stock is shown.</div>;
  const products=filterProductGroups(groups,{game,availability});
  return <>
    <div className="section-head"><div><p className="eyebrow">DELAYED PUBLIC STOCK INTELLIGENCE</p><h2 id="tcg-radar-title">NZ RETAIL RADAR</h2></div><p>Observed stock is deliberately delayed. Confirm availability and checkout with the retailer.</p></div>
    <div className="tcg-filters">
      <label>Game<select value={game} onChange={event=>setGame(event.target.value)}><option value="all">All games</option>{games.map(value=><option key={value}>{value}</option>)}</select></label>
      <label>Availability<select value={availability} onChange={event=>setAvailability(event.target.value)}><option value="all">All states</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    {feed.rejectedItems>0 && <p className="muted" role="status">{feed.rejectedItems} invalid record{feed.rejectedItems===1?'':'s'} withheld.</p>}
    <p className="muted">Filters select products with at least one matching offer. Compare retailers to see every observation.</p>
    <div className="tcg-display-toggle" role="group" aria-label="Product display">
      <button type="button" aria-pressed={displayMode==='cards'} onClick={()=>setDisplayMode('cards')}>Cards</button>
      <button type="button" aria-pressed={displayMode==='compact'} onClick={()=>setDisplayMode('compact')}>Compact</button>
    </div>
    <ul className={`tcg-product-grid${displayMode==='compact'?' tcg-product-grid--compact':''}`} aria-label="Products">
      {products.map(group=><li key={group.key}><ProductCard group={group}/></li>)}
    </ul>
    {products.length===0 && <p role="status">No validated results match these filters.</p>}
    </>;
  }
  return <section className="tcg-radar" aria-label="TCG Radar">
    <RadarViews products={stockProducts()} events={<EventsView feed={eventData} now={now}/>}/>
  </section>;
}
