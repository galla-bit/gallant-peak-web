import {useId} from 'react';
import {EVENTS_MAX_AGE_MS} from './contract';
import type {PublicDomain, TcgEventsFeedResult} from './feed';
import {getRecentWinners, getUpcomingEvents} from './presentation';
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

export function EventsView({feed,now=Date.now()}:{feed:TcgEventsFeedResult;now?:number}) {
  const id=useId();
  const events=fresh(feed.events,now);
  const winners=fresh(feed.winners,now);
  const upcoming=events.status==='ready'?getUpcomingEvents(events.items,now):[];
  const recent=winners.status==='ready'?getRecentWinners(winners.items,now):[];
  return <div className="tcg-events">
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
