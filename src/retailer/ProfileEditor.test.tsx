// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {ProfileEditor} from './ProfileEditor';
import {testClient,json,csrf} from './__tests__/http';
afterEach(cleanup);
const record={schema_version:1,id:'profile-canonical',retailer_id:'store-a',kind:'profile',revision:1,state:'DRAFT',fields:{name:'Store A',description:'Text',source_url:'https://a.test/about'},updated_at:'2026-11-02T00:00:00Z'};
const props={storeId:'store-a',generation:1,csrf,signal:new AbortController().signal,onDenied:vi.fn()};
it('creates only a missing authorised profile with create precondition and rereads the canonical baseline',async()=>{
 let saved=false;const {client,fetcher}=testClient((_p,o)=>{if(o?.method==='PUT'){saved=true;return json({schema_version:1,id:record.id,revision:1,publication_status:'queued'},201);}return saved?json(record,200,{ETag:'"r1"'}):json({},404);});
 render(<ProfileEditor {...props} client={client}/>);await screen.findByLabelText('Name');fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Store A'}});fireEvent.change(screen.getByLabelText('Description'),{target:{value:'Text'}});fireEvent.change(screen.getByLabelText('Source URL'),{target:{value:'https://a.test/about'}});fireEvent.click(screen.getByRole('button',{name:'Save profile'}));await screen.findByText(/Saved revision 1/);expect(screen.getByLabelText('Name')).toHaveProperty('value','Store A');const call=fetcher.mock.calls.find(([,o])=>o?.method==='PUT');expect(call?.[1]?.headers).toMatchObject({'If-None-Match':'*'});
});
it('keeps unsaved fields on a stale update without silently retrying',async()=>{
 const {client,fetcher}=testClient((_p,o)=>o?.method==='PUT'?json({},412):json(record,200,{ETag:'"r1"'}));render(<ProfileEditor {...props} client={client}/>);await screen.findByDisplayValue('Store A');fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Unsaved change'}});fireEvent.click(screen.getByRole('button',{name:'Save profile'}));await screen.findByText(/changed since it was loaded/);expect(screen.getByLabelText('Name')).toHaveProperty('value','Unsaved change');expect(fetcher.mock.calls.filter(([,o])=>o?.method==='PUT')).toHaveLength(1);
});
it('shows an unknown baseline when receipt succeeds but reread fails',async()=>{
 let writes=0;const {client}=testClient((_p,o)=>{if(o?.method==='PUT'){writes++;return json({schema_version:1,id:record.id,revision:1,publication_status:'queued'});}return writes?json({},503):json(record,200,{ETag:'"r1"'});});render(<ProfileEditor {...props} client={client}/>);await screen.findByDisplayValue('Store A');fireEvent.click(screen.getByRole('button',{name:'Save profile'}));await screen.findByText(/Current baseline is unknown/);expect(screen.getByRole('button',{name:'Save profile'})).toHaveProperty('disabled',true);
});
it('can save after StrictMode effect replay',async()=>{
 const {StrictMode}=await import('react');const {client,fetcher}=testClient((_p,o)=>o?.method==='PUT'?json({schema_version:1,id:record.id,revision:1,publication_status:'queued'}):json(record,200,{ETag:'"r1"'}));render(<StrictMode><ProfileEditor {...props} client={client}/></StrictMode>);await screen.findByDisplayValue('Store A');fireEvent.click(screen.getByRole('button',{name:'Save profile'}));await waitFor(()=>expect(fetcher.mock.calls.some(([,o])=>o?.method==='PUT')).toBe(true));
});
