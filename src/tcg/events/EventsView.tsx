import {useEffect, useId, useState} from 'react';
import {EVENTS_MAX_AGE_MS} from './contract';
import type {PublicDomain, TcgEventsFeedResult} from './feed';
import {filterEventRecords, getRecentWinners, getUpcomingEvents} from './presentation';
import type {PublicProvenance} from './types';

function fresh<T>(domain:PublicDomain<T>, now:number): PublicDomain<T> {
  if (domain.status==='ready' && (now-Date.parse(domain.generatedAt)>EVENTS_MAX_AGE_MS || Date.parse(domain.generatedAt)>now)) {
    return {status:'unavailable',reason:'stale'};
  }
  return domain;
}
function timestamp(value:string, timezone='Pacific/Auckland') {
  return <time dateTime={value}>{new Date(value).toLocaleString('en-NZ',{timeZone:timezone})} ({timezone})</time>;
}
function Provenance({item,generatedAt}:{item:PublicProvenance;generatedAt:string}) {
  return <div className="tcg-provenance">
    <a href={item.source_url} target="_blank" rel="noreferrer">{item.source_type==='official'?'Official':'Organiser'} source</a>
    <p>Observed {timestamp(item.observed_at)}</p><p>Projection updated {timestamp(generatedAt)}</p>
  </div>;
}
function DomainNotice({status,results=false}:{status:string;results?:boolean}) {
  const subject=results?'Published results':'Event information';
  return <p role="status" className="notice">{status==='loading'?`${subject} loading. No data shown until validation completes.`:
    status==='unconfigured'?`${subject} not connected. No ${results?'winners':'events'} are simulated.`:
      `${subject} unavailable. This does not mean ${results?'nobody won':'no events exist'}.`}</p>;
}

export function EventsView({feed,now:providedNow}:{feed:TcgEventsFeedResult;now?:number}) {
  const [clock,setClock]=useState(()=>Date.now());
  const [windowDays,setWindowDays]=useState('all');
  const now=providedNow??Math.max(clock,Date.now());
  useEffect(()=>{
    if (providedNow!==undefined) return;
    const boundaries:number[]=[];
    for (const domain of [feed.events,feed.winners]) {
      if (domain.status!=='ready') continue;
      const expiry=Date.parse(domain.generatedAt)+EVENTS_MAX_AGE_MS+1;
      if (expiry<=now) continue;
      boundaries.push(expiry);
      for (const item of domain.items) {
        const boundary='starts_at' in item?Date.parse(item.starts_at):Date.parse(item.event_at)+1;
        if (boundary>now) boundaries.push(boundary);
        if ('starts_at' in item && windowDays!=='all') {
          const entersWindow=Date.parse(item.starts_at)-Number(windowDays)*86400000;
          if (entersWindow>now) boundaries.push(entersWindow);
        }
      }
    }
    if (!boundaries.length) return;
    const next=boundaries.reduce((a,b)=>Math.min(a,b));
    const timer=setTimeout(()=>setClock(Date.now()),Math.min(2147483647,Math.max(1,next-Date.now())));
    return ()=>clearTimeout(timer);
  },[feed,now,providedNow,windowDays]);
  const id=useId();
  const [game,setGame]=useState('all');
  const [organiser,setOrganiser]=useState('all');
  const [region,setRegion]=useState('all');
  const events=fresh(feed.events,now);
  const winners=fresh(feed.winners,now);
  const records=[...(events.status==='ready'?events.items:[]),...(winners.status==='ready'?winners.items:[])];
  const games=[...new Set(records.map(item=>item.game))].sort();
  const organisers=[...new Map(records.map(item=>[item.organiser_id,item.organiser])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'en-NZ'));
  const regions=[...new Set(records.flatMap(item=>item.region?[item.region]:[]))].sort();
  const filters={game,organiser,region};
  const upcoming=events.status==='ready'?getUpcomingEvents(filterEventRecords(events.items,filters),now)
    .filter(item=>windowDays==='all'||Date.parse(item.starts_at)<=now+Number(windowDays)*86400000):[];
  const recent=winners.status==='ready'?getRecentWinners(winners.items,now,undefined,filters):[];
  return <div className="tcg-events">
    {(events.status==='ready'||winners.status==='ready')&&<>
      <div className="tcg-event-filters">
        <label>Event game<select value={game} onChange={event=>setGame(event.target.value)}><option value="all">All games</option>{games.map(value=><option key={value}>{value}</option>)}</select></label>
        <label>Event organiser<select value={organiser} onChange={event=>setOrganiser(event.target.value)}><option value="all">All organisers</option>{organisers.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        {regions.length>0&&<label>Event region<select value={region} onChange={event=>setRegion(event.target.value)}><option value="all">All regions</option>{regions.map(value=><option key={value}>{value}</option>)}</select></label>}
        <label>Upcoming window<select value={windowDays} onChange={event=>setWindowDays(event.target.value)}><option value="all">All future dates</option><option value="7">Next 7 days</option><option value="30">Next 30 days</option></select></label>
      </div>
      <p className="muted">Game, organiser and region filter both lists. The upcoming window applies only to future events.</p>
    </>}
    <section className="tcg-event-section" aria-labelledby={`${id}-upcoming`}>
      <h3 id={`${id}-upcoming`}>Upcoming Events</h3>
      {events.status!=='ready'?<DomainNotice status={events.status}/>:<>
        {events.rejectedItems>0&&<p role="status">{events.rejectedItems} invalid event records withheld.</p>}
        {upcoming.length===0?<p role="status">No upcoming events match these filters.</p>:
          <ul className="tcg-event-list" aria-label="Upcoming event listings">{upcoming.map((item,index)=><li key={`${item.id}-${index}`}>
            <article className="tcg-event-card">
              <p className="eyebrow">{item.game}</p><h4>{item.name}</h4>
              <p className="tcg-event-date">{timestamp(item.starts_at,item.timezone)}</p>
              <p><strong>{item.organiser}</strong></p>
              {(item.city||item.region)&&<p>{item.city&&<span>{item.city}</span>}{item.city&&item.region?' · ':''}{item.region&&<span>{item.region}</span>}</p>}
              {item.format&&<p>{item.format}</p>}{item.entry_fee&&<p>{item.entry_fee}</p>}
              {item.registration_status&&<p>{item.registration_status}</p>}
              <a href={item.event_url} target="_blank" rel="noreferrer">View / Register at {item.organiser}</a>
              <Provenance item={item} generatedAt={events.generatedAt}/>
            </article>
          </li>)}</ul>}
      </>}
    </section>
    <section className="tcg-event-section tcg-winners" aria-labelledby={`${id}-winners`}>
      <h3 id={`${id}-winners`}>Recent Winners</h3>
      <p className="muted">Latest three qualifying completed competitions with a verified published winner.</p>
      {winners.status!=='ready'?<DomainNotice status={winners.status} results/>:<>
        {winners.rejectedItems>0&&<p role="status">{winners.rejectedItems} invalid result records withheld.</p>}
        {recent.length===0?<p role="status">No published recent winner is available.</p>:
          <ul className="tcg-winner-list" aria-label="Recent published winners">{recent.map(item=><li key={`${item.organiser_id}-${item.event_id}`}>
            <article className="tcg-winner-card">
              <p className="eyebrow">{item.game}</p><h4>{item.event_name}</h4>
              <p><strong>{item.winner}</strong></p><p>{item.organiser}</p>
              <p>Event {timestamp(item.event_at,item.timezone)}</p>
              {item.deck_archetype&&<p>Deck: {item.deck_archetype}</p>}
              <Provenance item={item} generatedAt={winners.generatedAt}/>
            </article>
          </li>)}</ul>}
      </>}
    </section>
  </div>;
}
