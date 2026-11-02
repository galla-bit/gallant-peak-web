import type {RetailerSpace} from './model';
import type {TcgEventsFeedResult} from '../events/feed';
// Static demonstration only. No network, retailer authorisation, inventory or checkout claims.
export const DEMO_NOW=Date.parse('2026-11-02T00:00:00Z');
export const mythicDeckPreview:RetailerSpace={
  id:'demo-mythicdeck',name:'MythicDeck',organiserId:'demo-mythicdeck',
  relationship:{kind:'demonstration'},
  description:'Explore a demonstration retailer space for the first preview/pilot. All content below is illustrative.',
  products:[{id:'demo-booster',name:'Demonstration booster box',description:'Illustrative retailer-managed listing. Price and stock availability are not supplied.'}],
  updates:[{id:'demo-update',title:'Demonstration store update',body:'An example of a retailer sharing news with its community.',publishedAt:'2026-11-02'}],
};
const provenance={source_type:'organiser' as const,source_url:'https://example.com/demonstration',observed_at:'2026-11-02T00:00:00Z'};
const identity={...provenance,game:'Pokémon',organiser_id:'demo-mythicdeck',organiser:'MythicDeck demonstration',timezone:'Pacific/Auckland',eligible:true as const};
// Same canonical IDs, types and renderer in the retailer space and Events preview.
export const demonstrationEvents:TcgEventsFeedResult={
  events:{status:'ready',generatedAt:'2026-11-02T00:00:00Z',rejectedItems:0,items:[{
    ...identity,id:'demo-league',name:'Demonstration card league',starts_at:'2026-11-09T05:00:00Z',event_url:'https://example.com/demonstration',format:'Illustrative competition — no registration',
  }]},
  winners:{status:'ready',generatedAt:'2026-11-02T00:00:00Z',rejectedItems:0,items:[{
    ...identity,id:'demo-result',event_id:'demo-completed-league',event_name:'Demonstration completed league',event_at:'2026-11-01T05:00:00Z',winner:'Demo Player',verified:true,
  }]},
};
