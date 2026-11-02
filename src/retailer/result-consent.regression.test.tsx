// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {NewsEditor} from './NewsEditor';
import {ResultEditor} from './ResultEditor';
import {RetailerWorkspace} from './RetailerWorkspace';
import {testClient,json,csrf,session,stores} from './__tests__/http';
afterEach(cleanup);
const props={storeId:'store-a',generation:1,csrf,signal:new AbortController().signal,onDenied:vi.fn()};
it('requires a new explicit correction confirmation after adopting another revision',async()=>{
 let revision=1;
 const record=()=>({schema_version:1,id:'result-a',retailer_id:'store-a',kind:'result',revision,state:'PUBLISHED',organiser_id:'org-a',event_id:'event-a',fields:{event_at:'2026-11-01T01:00:00Z',winner:'Player',source_url:'https://a.test/result'},updated_at:'2026-11-02T00:00:00Z'});
 const {client}=testClient((p,o)=>{if(o?.method==='PUT'){revision=2;return json({},412);}return p.includes('/publication/')?json({},503):json(record(),200,{ETag:'"r'+revision+'"'});});
 render(<ResultEditor {...props} eventId="event-a" client={client}/>);await screen.findByDisplayValue('Player');fireEvent.click(screen.getByRole('checkbox',{name:'Confirm correction supersedes revision 1'}));fireEvent.click(screen.getByRole('button',{name:'Save result'}));await screen.findByText(/changed since it was loaded/);fireEvent.click(screen.getByRole('button',{name:'Reload current content to compare'}));await screen.findByRole('button',{name:'Use current server content'});fireEvent.click(screen.getByRole('button',{name:'Use current server content'}));
 expect(screen.getByRole('checkbox',{name:'Confirm correction supersedes revision 2'})).toHaveProperty('checked',false);
});
