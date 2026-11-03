// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {ResultEditor} from './ResultEditor';
import {testClient,json,csrf} from './__tests__/http';
afterEach(cleanup);
const record={schema_version:1,id:'canonical-result',retailer_id:'store-a',kind:'result',revision:1,state:'PUBLISHED',organiser_id:'org-a',event_id:'canonical-event',fields:{event_at:'2026-11-01T01:00:00Z',winner:'Player',source_url:'https://a.test/result'},updated_at:'2026-11-02T00:00:00Z'};
const props={storeId:'store-a',eventId:'canonical-event',generation:1,csrf,signal:new AbortController().signal,onDenied:vi.fn()};
it('requires explicit supersession and uses canonical event/result IDs',async()=>{
 const {client,fetcher}=testClient((_p,o)=>o?.method==='PUT'?json({schema_version:1,id:record.id,revision:2,publication_status:'queued'}):json(record,200,{ETag:'"r1"'}));render(<ResultEditor {...props} client={client}/>);await screen.findByDisplayValue('Player');expect(screen.getByRole('button',{name:'Save result'})).toHaveProperty('disabled',true);fireEvent.click(screen.getByRole('checkbox',{name:'Confirm correction supersedes revision 1'}));fireEvent.change(screen.getByLabelText('Winner'),{target:{value:'Corrected'}});fireEvent.click(screen.getByRole('button',{name:'Save result'}));await screen.findByText(/Saved revision 2/);const [path,o]=fetcher.mock.calls.find(([,o])=>o?.method==='PUT')!;expect(path).toBe('/api/retailer/v1/stores/store-a/events/canonical-event/result');expect(o?.headers).toMatchObject({'If-Match':'"r1"'});expect(JSON.parse(String(o?.body))).toEqual({...record.fields,winner:'Corrected',supersedes_revision:1});
});
it('creates a missing own-event result with create-only precondition',async()=>{
 let saved=false;const {client,fetcher}=testClient((_p,o)=>{if(o?.method==='PUT'){saved=true;return json({schema_version:1,id:record.id,revision:1,publication_status:'queued'},201);}return saved?json(record,200,{ETag:'"r1"'}):json({},404);});render(<ResultEditor {...props} client={client}/>);await screen.findByLabelText('Winner');for(const [label,value] of [['Winner','Player'],['Completed at (ISO instant with offset)','2026-11-01T01:00:00Z'],['Source URL','https://a.test/result']])fireEvent.change(screen.getByLabelText(label),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'Save result'}));await screen.findByText(/Saved revision 1/);expect(fetcher.mock.calls.find(([,o])=>o?.method==='PUT')?.[1]?.headers).toMatchObject({'If-None-Match':'*'});
});
it('rejects mismatched canonical event responses and exposes no verification controls',async()=>{
 const {client}=testClient(()=>json({...record,event_id:'foreign'},200,{ETag:'"r1"'}));render(<ResultEditor {...props} client={client}/>);await screen.findByRole('alert');expect(screen.queryByLabelText(/verified/i)).toBeNull();expect(screen.queryByDisplayValue('Player')).toBeNull();
});
