// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {ListingEditor} from './ListingEditor';
import {testClient,json,csrf} from './__tests__/http';
afterEach(cleanup);
it('keeps local products separate and rejects HTML or unsafe links before mutation',async()=>{
 const {client,fetcher}=testClient(()=>json({schema_version:1,items:[],next_after_id:null}));render(<ListingEditor client={client} storeId="store-a" generation={1} csrf={csrf} signal={new AbortController().signal} onDenied={vi.fn()}/>);expect(screen.getByText(/Gallant Peak controls global publication/)).toBeTruthy();expect(screen.queryByRole('button',{name:/promote/i})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Create product'}));await screen.findByLabelText('Name');for(const [label,value] of [['Name','<img>'],['Description','Text'],['Game','Pokemon'],['Product URL','javascript:alert(1)']])fireEvent.change(screen.getByLabelText(label),{target:{value}});fireEvent.click(screen.getByRole('button',{name:'Save product'}));await screen.findByRole('alert');expect(fetcher.mock.calls.some(([,o])=>o?.method==='POST')).toBe(false);
});
