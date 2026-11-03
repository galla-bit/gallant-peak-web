// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {EventEditor} from './EventEditor';
import {testClient,json,csrf} from './__tests__/http';
afterEach(cleanup);
export const eventRecord={schema_version:1,id:'event-canonical',retailer_id:'store-a',kind:'event',revision:1,state:'DRAFT',organiser_id:'org-a',fields:{name:'Community league',game:'Pokemon',starts_at:'2026-11-05T01:00:00Z',timezone:'Pacific/Auckland',event_url:'https://a.test/event',source_url:'https://a.test/event'},updated_at:'2026-11-02T00:00:00Z'};
const props={storeId:'store-a',generation:1,csrf,signal:new AbortController().signal,onDenied:vi.fn(),onSelectResult:vi.fn()};
it('edits only canonical event fields and treats publish denial as server authority',async()=>{
 const denied=vi.fn();const {client,fetcher}=testClient((p,o)=>o?.method==='PUT'?json({},403):p.endsWith('/event-canonical')?json(eventRecord,200,{ETag:'"r1"'}):json({schema_version:1,items:[eventRecord],next_after_id:null}));render(<EventEditor {...props} onDenied={denied} client={client}/>);fireEvent.click(await screen.findByRole('button',{name:'Edit Community league'}));await screen.findByDisplayValue('Community league');fireEvent.change(screen.getByLabelText('State'),{target:{value:'PUBLISHED'}});fireEvent.click(screen.getByRole('button',{name:'Save event'}));await screen.findByRole('alert');expect(denied).toHaveBeenCalledWith('denied');const body=JSON.parse(String(fetcher.mock.calls.find(([,o])=>o?.method==='PUT')?.[1]?.body));expect(body).not.toHaveProperty('organiser_id');expect(body).not.toHaveProperty('eligible');expect(body).not.toHaveProperty('id');
});
it('rejects naive event time and allows opening canonical results independently of stock',async()=>{
 const select=vi.fn();const {client,fetcher}=testClient(p=>p.endsWith('/event-canonical')?json(eventRecord,200,{ETag:'"r1"'}):json({schema_version:1,items:[eventRecord],next_after_id:null}));render(<EventEditor {...props} onSelectResult={select} client={client}/>);fireEvent.click(await screen.findByRole('button',{name:'Results for Community league'}));expect(select).toHaveBeenCalledWith('event-canonical');fireEvent.click(screen.getByRole('button',{name:'Edit Community league'}));await screen.findByDisplayValue('Community league');fireEvent.change(screen.getByLabelText('Starts at (ISO instant with offset)'),{target:{value:'2026-11-05T12:00'}});fireEvent.click(screen.getByRole('button',{name:'Save event'}));await screen.findByRole('alert');expect(fetcher.mock.calls.some(([,o])=>o?.method==='PUT')).toBe(false);
});
