// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {NewsEditor} from './NewsEditor';
import {ResultEditor} from './ResultEditor';
import {RetailerWorkspace} from './RetailerWorkspace';
import {testClient,json,csrf,session,stores} from './__tests__/http';
afterEach(cleanup);
const props={storeId:'store-a',generation:1,csrf,signal:new AbortController().signal,onDenied:vi.fn()};
it('does not issue a previous store event ID request when switching stores',async()=>{
 const event={schema_version:1,id:'event-a',retailer_id:'store-a',kind:'event',revision:1,state:'PUBLISHED',organiser_id:'org-a',fields:{name:'Event A',game:'Pokemon',starts_at:'2026-11-01T00:00:00Z',timezone:'UTC',event_url:'https://a.test/event',source_url:'https://a.test/event'},updated_at:'2026-11-02T00:00:00Z'};
 const {client,fetcher}=testClient(p=>p==='/auth/session'?json(session):p.endsWith('/me/stores')?json(stores):p.includes('/events?')?json({schema_version:1,items:p.includes('store-a')?[event]:[],next_after_id:null}):json({},404));
 render(<RetailerWorkspace client={client}/>);await screen.findByLabelText('Retailer space');fireEvent.change(screen.getByLabelText('Retailer space'),{target:{value:'store-a'}});fireEvent.click(screen.getByRole('button',{name:'Events & Competitions'}));await screen.findByRole('button',{name:'Results for Event A'});fireEvent.click(screen.getByRole('button',{name:'Results for Event A'}));await screen.findByLabelText('Winner');fireEvent.change(screen.getByLabelText('Retailer space'),{target:{value:'store-b'}});
 expect(fetcher.mock.calls.some(([p])=>String(p).includes('/store-b/events/event-a/result'))).toBe(false);
});
