// @vitest-environment jsdom
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {PublicationStatus} from './PublicationStatus';
import {testClient,json,deferred} from './__tests__/http';
afterEach(cleanup);
it.each(['queued','acknowledged','not_required','unknown'])('reports %s without claiming public visibility',async(state)=>{
 const {client,fetcher}=testClient(()=>json({schema_version:1,id:'event-a',revision:2,domains:[{domain:'events',state},{domain:'winners',state:'queued'}]}));render(<PublicationStatus client={client} storeId="store-a" kind="event" id="event-a" generation={1} signal={new AbortController().signal} onDenied={vi.fn()}/>);await screen.findByText('Publication processing · revision 2');expect(screen.getByText(/does not confirm public visibility/)).toBeTruthy();expect(fetcher.mock.calls.every(([,o])=>!o?.method)).toBe(true);
});
it('ignores a late publication response after unmount',async()=>{const pending=deferred<Response>();const {client}=testClient(()=>pending.promise);const {unmount}=render(<PublicationStatus client={client} storeId="store-a" kind="news" id="n" generation={1} signal={new AbortController().signal} onDenied={vi.fn()}/>);unmount();pending.resolve(json({schema_version:1,id:'n',revision:1,domains:[]}));expect(screen.queryByText(/Publication processing/)).toBeNull();});
