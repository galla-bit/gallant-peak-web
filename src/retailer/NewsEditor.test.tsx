// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {NewsEditor} from './NewsEditor';
import {testClient,json,csrf} from './__tests__/http';
import news from './fixtures/news-response.json';
afterEach(cleanup);
const props={storeId:'store-a',generation:1,csrf,signal:new AbortController().signal,onDenied:vi.fn()};
it('loads paginated own news and fetches canonical detail before editing',async()=>{
 const {client,fetcher}=testClient(p=>p.includes('after_id=')?json({schema_version:1,items:[],next_after_id:null}):p.includes('/news/')?json(news,200,{ETag:'"r1"'}):json({schema_version:1,items:[news],next_after_id:news.id}));render(<NewsEditor {...props} client={client}/>);await screen.findByRole('button',{name:'Edit Community update'});fireEvent.click(screen.getByRole('button',{name:'Load more news'}));await screen.findByText('All loaded news shown.');expect(fetcher.mock.calls.some(([p])=>String(p).includes('after_id=news-existing'))).toBe(true);fireEvent.click(screen.getByRole('button',{name:'Edit Community update'}));await screen.findByDisplayValue('Community update');expect(fetcher.mock.calls.some(([p])=>String(p).endsWith('/news/news-existing'))).toBe(true);
});
it('creates a closed news body with no revision precondition and opens canonical ID',async()=>{
 const {client,fetcher}=testClient((p,o)=>o?.method==='POST'?json({schema_version:1,id:news.id,revision:1,publication_status:'queued'},201):p.endsWith('/'+news.id)?json(news,200,{ETag:'"r1"'}):json({schema_version:1,items:[],next_after_id:null}));render(<NewsEditor {...props} client={client}/>);fireEvent.click(screen.getByRole('button',{name:'Create news'}));await screen.findByLabelText('Title');for(const [label,value] of [['Title','Community update'],['Body','Plain local news'],['Source URL','https://store.example.test/news']])fireEvent.change(screen.getByLabelText(label),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'Save news'}));await screen.findByText(/Saved revision 1/);const call=fetcher.mock.calls.find(([,o])=>o?.method==='POST');expect(call?.[1]?.headers).not.toHaveProperty('If-Match');expect(call?.[1]?.headers).not.toHaveProperty('If-None-Match');await screen.findByDisplayValue('Community update');
});
