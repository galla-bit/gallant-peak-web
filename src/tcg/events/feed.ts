import {parseTcgEventsSnapshot, safePublicUrl} from './contract';
import type {TcgEvent, TcgWinnerResult} from './types';

export type PublicDomain<T> =
  | {status:'loading'|'unconfigured'}
  | {status:'unavailable'; reason:string}
  | {status:'ready'; items:T[]; generatedAt:string; rejectedItems:number};
export interface TcgEventsFeedResult {
  events:PublicDomain<TcgEvent>;
  winners:PublicDomain<TcgWinnerResult>;
}
export function inactiveEventsFeed(status:'loading'|'unconfigured'): TcgEventsFeedResult {
  return {events:{status},winners:{status}};
}
function unavailable(reason:string): TcgEventsFeedResult {
  return {events:{status:'unavailable',reason},winners:{status:'unavailable',reason}};
}
export async function loadTcgEventsFeed(options:{endpoint?:string; now:number; fetcher?:typeof fetch}): Promise<TcgEventsFeedResult> {
  if (!options.endpoint) return inactiveEventsFeed('unconfigured');
  if (!safePublicUrl(options.endpoint)) return unavailable('invalid-endpoint');
  try {
    const response=await (options.fetcher??fetch)(options.endpoint,{headers:{accept:'application/json'},credentials:'omit',redirect:'error'});
    if (!response.ok) return unavailable('request-failed');
    const parsed=parseTcgEventsSnapshot(await response.json(),options.now);
    if (!parsed.snapshot) return unavailable(parsed.reason??'invalid-snapshot');
    const {events,winners,generated_at}=parsed.snapshot;
    return {
      events:events===null?{status:'unavailable',reason:'invalid-events'}:
        {status:'ready',items:events,generatedAt:generated_at,rejectedItems:parsed.rejectedEvents},
      winners:winners===null?{status:'unavailable',reason:'invalid-results'}:
        {status:'ready',items:winners,generatedAt:generated_at,rejectedItems:parsed.rejectedWinners},
    };
  } catch { return unavailable('request-failed'); }
}
