// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor,act} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {RetailerWorkspace} from './RetailerWorkspace';
import {TcgRadar} from '../tcg/TcgRadar';
import {inactiveEventsFeed} from '../tcg/events/feed';
import {testClient,json,session,stores,deferred} from './__tests__/http';
afterEach(cleanup);
const profile=(store:string,name:string)=>({schema_version:1,id:'profile-'+store,retailer_id:store,kind:'profile',revision:1,state:'DRAFT',fields:{name,description:'Private text',source_url:'https://a.test/about'},updated_at:'2026-11-02T00:00:00Z'});
it('clears denied store content and requires fresh server access after reactivation',async()=>{
 let access=true;const {client}=testClient((p,o)=>p==='/auth/session'?json(session):p.endsWith('/me/stores')?json({...stores,stores:access?stores.stores:[]}):o?.method==='PUT'?(access=false,json({},403)):p.includes('/publication/')?json({schema_version:1,id:'profile-store-a',revision:1,domains:[{domain:'retailers',state:'unknown'}]}):json(profile('store-a','Private A'),200,{ETag:'"r1"'}));
 render(<><RetailerWorkspace client={client}/><TcgRadar feed={{status:'unavailable',reason:'stale'}} eventsFeed={inactiveEventsFeed('unconfigured')}/></>);await screen.findByLabelText('Retailer space');fireEvent.change(screen.getByLabelText('Retailer space'),{target:{value:'store-a'}});await screen.findByDisplayValue('Private A');fireEvent.click(screen.getByRole('button',{name:'Save profile'}));await screen.findByText(/No authorised retailer spaces/);expect(screen.queryByDisplayValue('Private A')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Refresh retailer access'}));await screen.findByText(/No authorised retailer spaces/);access=true;fireEvent.click(screen.getByRole('button',{name:'Refresh retailer access'}));await screen.findByLabelText('Retailer space');expect(screen.queryByDisplayValue('Private A')).toBeNull();expect(screen.getByText(/Validated public stock data is currently unavailable/)).toBeTruthy();
});
it('does not restore private content after logout when a response ignores abort',async()=>{
 const pending=deferred<Response>();const {client}=testClient(p=>p==='/auth/session'?json(session):p.endsWith('/me/stores')?json(stores):p==='/auth/logout'?json({authenticated:false}):pending.promise);render(<RetailerWorkspace client={client}/>);await screen.findByLabelText('Retailer space');fireEvent.change(screen.getByLabelText('Retailer space'),{target:{value:'store-a'}});fireEvent.click(screen.getByRole('button',{name:'Log out'}));await screen.findByText(/Sign-in is not connected/);await act(async()=>pending.resolve(json(profile('store-a','Secret A'),200,{ETag:'"r1"'})));expect(screen.queryByDisplayValue('Secret A')).toBeNull();
});
it('keeps late retailer A profile out of retailer B',async()=>{
 const pending=deferred<Response>();const {client}=testClient(p=>p==='/auth/session'?json(session):p.endsWith('/me/stores')?json(stores):p.includes('store-a/profile')?pending.promise:p.includes('/publication/')?json({},503):json(profile('store-b','Private B'),200,{ETag:'"r1"'}));render(<RetailerWorkspace client={client}/>);await screen.findByLabelText('Retailer space');fireEvent.change(screen.getByLabelText('Retailer space'),{target:{value:'store-a'}});fireEvent.change(screen.getByLabelText('Retailer space'),{target:{value:'store-b'}});await screen.findByDisplayValue('Private B');await act(async()=>pending.resolve(json(profile('store-a','Secret A'),200,{ETag:'"r1"'})));expect(screen.queryByDisplayValue('Secret A')).toBeNull();
});
