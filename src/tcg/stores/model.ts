import type {PublicDomain, TcgEventsFeedResult} from '../events/feed';

// Supplied only by trusted Gallant Peak configuration, never collector/stock data.
// A future backend must enforce retailer authorisation before producing this projection.
export interface RetailerSpace {
  id:string;
  name:string;
  description:string;
  organiserId:string;
  relationship:{kind:'authorised';reference:string}|{kind:'monitored'|'demonstration'};
  products:{id:string;name:string;description:string}[];
  updates:{id:string;title:string;body:string;publishedAt:string}[];
}
export function authorisedStores(stores:readonly RetailerSpace[]):RetailerSpace[] {
  return stores.filter(store=>store.relationship.kind==='authorised'&&store.relationship.reference.trim().length>0);
}
export function retailerEvents(feed:TcgEventsFeedResult,organiserId:string):TcgEventsFeedResult {
  function scope<T extends {organiser_id:string}>(domain:PublicDomain<T>):PublicDomain<T> {
    return domain.status==='ready'?{...domain,items:domain.items.filter(item=>item.organiser_id===organiserId)}:domain;
  }
  return {events:scope(feed.events),winners:scope(feed.winners)};
}
