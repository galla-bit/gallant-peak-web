import type {TcgEvent, TcgEventsSnapshot, TcgWinnerResult} from './types';

export const EVENTS_MAX_AGE_MS = 60*60*1000;
const common = ['id','game','organiser_id','organiser','timezone','eligible','city','region','source_type','source_url','observed_at'];
const eventFields = [...common,'name','starts_at','event_url','format','entry_fee','registration_status'];
const winnerFields = [...common,'event_id','event_name','event_at','winner','verified','deck_archetype'];
type PublicRecord = Record<string, unknown>;
function record(value: unknown): value is PublicRecord {
  return typeof value==='object' && value!==null && !Array.isArray(value);
}
function text(value: unknown): value is string {
  return typeof value==='string' && value.trim().length>0;
}
export function safePublicUrl(value: unknown): value is string {
  if (!text(value)) return false;
  try {
    const url=new URL(value);
    return url.protocol==='https:' && !url.username && !url.password && !url.search && !url.hash &&
      url.hostname.includes('.') && !url.hostname.endsWith('.') && !/^[\d.]+$/.test(url.hostname) && !url.hostname.includes(':') &&
      !/(?:\.local|\.localhost|\.internal)$/.test(url.hostname);
  } catch { return false; }
}
export function validTimestamp(value: unknown): value is string {
  if (!text(value)) return false;
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [,year,month,day,hour,minute,second,offset]=match;
  const days=new Date(Date.UTC(Number(year),Number(month),0)).getUTCDate();
  const offsetValid=offset==='Z' || (Number(offset.slice(1,3))<=14 && Number(offset.slice(4))<60 &&
    (Number(offset.slice(1,3))!==14 || Number(offset.slice(4))===0));
  return Number(month)>=1 && Number(month)<=12 && Number(day)>=1 && Number(day)<=days &&
    Number(hour)<24 && Number(minute)<60 && Number(second)<60 && offsetValid;
}
function validZone(value: unknown): boolean {
  if (!text(value)) return false;
  try { new Intl.DateTimeFormat('en-NZ',{timeZone:value}); return true; } catch { return false; }
}
function parseRecord(value: unknown, kind:'event'|'winner', now:number): TcgEvent | TcgWinnerResult | null {
  if (!record(value)) return null;
  const fields=kind==='event'?eventFields:winnerFields;
  if (Object.keys(value).some(key=>!fields.includes(key))) return null;
  const required=kind==='event'?['name','starts_at','event_url']:['event_id','event_name','event_at','winner'];
  if ([...['id','game','organiser_id','organiser'],...required].some(key=>!text(value[key]))) return null;
  if (value.eligible!==true || (kind==='winner' && value.verified!==true)) return null;
  if (value.source_type!=='official' && value.source_type!=='organiser') return null;
  if (!safePublicUrl(value.source_url) || (kind==='event' && !safePublicUrl(value.event_url))) return null;
  if (!validTimestamp(value.observed_at) || Date.parse(value.observed_at)>now || !validZone(value.timezone)) return null;
  if (!validTimestamp(value[kind==='event'?'starts_at':'event_at'])) return null;
  const optional=kind==='event'?['city','region','format','entry_fee','registration_status']:['city','region','deck_archetype'];
  if (optional.some(key=>value[key]!==undefined && !text(value[key]))) return null;
  return Object.fromEntries(fields.filter(key=>value[key]!==undefined).map(key=>[key,value[key]])) as unknown as TcgEvent | TcgWinnerResult;
}

export function parseTcgEventsSnapshot(input: unknown, now:number): {
  snapshot:TcgEventsSnapshot|null; rejectedEvents:number; rejectedWinners:number; reason?:string;
} {
  const fail=(reason:string)=>({snapshot:null,rejectedEvents:0,rejectedWinners:0,reason});
  if (!record(input) || input.schema_version!==1) return fail('unsupported-schema');
  if (!validTimestamp(input.generated_at) || !Number.isFinite(now)) return fail('invalid-generated-at');
  const age=now-Date.parse(input.generated_at);
  if (age<0) return fail('future-generated-at');
  if (age>EVENTS_MAX_AGE_MS) return fail('stale');
  function domain(values:unknown, kind:'event'|'winner') {
    if (!Array.isArray(values)) return {items:null,rejected:0};
    const items=values.map(value=>parseRecord(value,kind,now)).filter(value=>value!==null);
    return {items,rejected:values.length-items.length};
  }
  const events=domain(input.events,'event');
  const winners=domain(input.winners,'winner');
  return {snapshot:{schema_version:1,generated_at:input.generated_at,events:events.items as TcgEvent[]|null,
    winners:winners.items as TcgWinnerResult[]|null},rejectedEvents:events.rejected,rejectedWinners:winners.rejected};
}
