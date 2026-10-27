import {validTimestamp} from './contract';
import type {EventIdentity, TcgEvent, TcgWinnerResult} from './types';

export interface EventFilters {game:string; organiser:string; region:string}
export function filterEventRecords<T extends EventIdentity>(items:T[], filters:EventFilters): T[] {
  return items.filter(item=>(filters.game==='all'||item.game===filters.game) &&
    (filters.organiser==='all'||item.organiser_id===filters.organiser) &&
    (filters.region==='all'||item.region===filters.region));
}
export function getUpcomingEvents(events:TcgEvent[], now:number): TcgEvent[] {
  return events.filter(item=>item.eligible && validTimestamp(item.starts_at) && Date.parse(item.starts_at)>now)
    .sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at) ||
      a.organiser.localeCompare(b.organiser,'en-NZ') || a.name.localeCompare(b.name,'en-NZ') || a.id.localeCompare(b.id,'en-NZ'));
}

export function getRecentWinners(winners:TcgWinnerResult[], now:number, limit=3, filters?:EventFilters): TcgWinnerResult[] {
  const competitions=new Map<string,TcgWinnerResult[]>();
  for (const item of winners) {
    if (!item.verified || !item.eligible || !item.winner?.trim() || !validTimestamp(item.event_at)) continue;
    const key=JSON.stringify([item.organiser_id,item.event_id]);
    competitions.set(key,[...(competitions.get(key)??[]),item]);
  }
  const selected:TcgWinnerResult[]=[];
  for (const records of competitions.values()) {
    const first=records[0];
    // Repeated provenance must not create extra competition slots or resolve conflicts by array order.
    if (records.some(item=>item.winner!==first.winner || item.game!==first.game || item.event_name!==first.event_name ||
      Date.parse(item.event_at)!==Date.parse(first.event_at) || item.deck_archetype!==first.deck_archetype)) continue;
    selected.push([...records].sort((a,b)=>a.id.localeCompare(b.id,'en-NZ')||a.source_url.localeCompare(b.source_url,'en-NZ'))[0]);
  }
  const matching=filters?filterEventRecords(selected,filters):selected;
  return matching.filter(item=>Date.parse(item.event_at)<now).sort((a,b)=>Date.parse(b.event_at)-Date.parse(a.event_at) ||
    a.organiser.localeCompare(b.organiser,'en-NZ') || a.event_name.localeCompare(b.event_name,'en-NZ') || a.id.localeCompare(b.id,'en-NZ'))
    .slice(0,Number.isFinite(limit)?Math.min(3,Math.max(0,Math.floor(limit))):0);
}
