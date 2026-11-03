// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {NewsEditor} from './NewsEditor';
import {ResultEditor} from './ResultEditor';
import {RetailerWorkspace} from './RetailerWorkspace';
import {testClient,json,csrf,session,stores} from './__tests__/http';
afterEach(cleanup);
const props={storeId:'store-a',generation:1,csrf,signal:new AbortController().signal,onDenied:vi.fn()};
it('keeps exact retry identity after malformed successful create response',async()=>{
 const {client,fetcher}=testClient((_p,o)=>o?.method==='POST'?new Response('{', {status:201,headers:{'Content-Type':'application/json'}}):json({schema_version:1,items:[],next_after_id:null}));
 render(<NewsEditor {...props} client={client}/>);fireEvent.click(screen.getByRole('button',{name:'Create news'}));await screen.findByLabelText('Title');
 for(const [label,value] of [['Title','Title'],['Body','Body'],['Source URL','https://a.test/news']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 fireEvent.click(screen.getByRole('button',{name:'Save news'}));await screen.findByText(/response could not be validated/);
 expect(screen.getByRole('button',{name:'Save news'})).toHaveProperty('disabled',true);fireEvent.click(screen.getByRole('button',{name:'Retry exact save'}));await waitFor(()=>expect(fetcher.mock.calls.filter(([,o])=>o?.method==='POST')).toHaveLength(2));
 const writes=fetcher.mock.calls.filter(([,o])=>o?.method==='POST');expect(writes[1][1]?.headers).toEqual(writes[0][1]?.headers);
});
