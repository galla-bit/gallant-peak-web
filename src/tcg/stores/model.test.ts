import {expect,it} from 'vitest';
import {authorisedStores, retailerEvents, type RetailerSpace} from './model';
import {readyFeed, snapshot, event, winner} from '../events/test-fixtures';
const base={id:'other',name:'Other Retailer',description:'Generic space',organiserId:'store-a',products:[],updates:[]};
it('requires an active authorised relationship, never collector or checkout evidence',()=>{
 const stores:RetailerSpace[]=[
 {...base,relationship:{kind:'authorised',reference:'agreement-1'}},
 {...base,id:'farmers',relationship:{kind:'monitored'}},
 {...base,id:'preview',relationship:{kind:'demonstration'}},
 {...base,id:'empty-reference',relationship:{kind:'authorised',reference:' '}}];
 expect(authorisedStores(stores).map(s=>s.id)).toEqual(['other']);
 expect(authorisedStores([{...base,relationship:{kind:'monitored'},stockConfidence:1,instantCheckout:true} as RetailerSpace])).toEqual([]);
});
it('scopes both canonical domains by organiser without changing identities or availability',()=>{
 const feed=readyFeed(snapshot({events:[event(),event({id:'b',organiser_id:'store-b'})],winners:[winner(),winner({id:'b',event_id:'b',organiser_id:'store-b'})]}));
 const scoped=retailerEvents(feed,'store-a');
 expect(scoped.events.status==='ready'&&scoped.events.items.map(e=>e.id)).toEqual(['event-a']);
 expect(scoped.winners.status==='ready'&&scoped.winners.items.map(e=>e.event_id)).toEqual(['event-a']);
 if(scoped.events.status==='ready'&&feed.events.status==='ready') expect(scoped.events.items[0]).toBe(feed.events.items[0]);
 const partial=retailerEvents({...feed,events:{status:'unavailable',reason:'stale'}},'store-a');
 expect(partial.events).toEqual({status:'unavailable',reason:'stale'});
 expect(partial.winners.status).toBe('ready');
});
