// @vitest-environment jsdom
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {PublicationStatus} from './PublicationStatus';
import {ListingEditor} from './ListingEditor';
import {json,testClient,csrf} from './__tests__/http';
afterEach(cleanup);
const props={storeId:'store-a',generation:1,csrf,signal:new AbortController().signal,onDenied:vi.fn()};
it.each([['queued','Awaiting projection'],['acknowledged','Projection processed'],['not_required','No public projection required'],['unknown','Publication status unavailable']])('uses exact projection meaning for %s',async(state,label)=>{const {client}=testClient(()=>json({schema_version:1,id:'p',revision:2,domains:[{domain:'retailers',state}]}));render(<PublicationStatus {...props} client={client} kind='profile' id='p'/>);expect(await screen.findByText('retailers: '+label)).toBeTruthy();expect(screen.queryByText(/Published/i)).toBeNull();expect(screen.getByText('This does not confirm public visibility.')).toBeTruthy();});
it('explains store products never self-promote to global discovery surfaces',()=>{const {client}=testClient(()=>json({schema_version:1,items:[],next_after_id:null}));render(<ListingEditor {...props} client={client}/>);expect(screen.getByText('Store products belong to your Verified Store. Saving one does not place it in Radar, global Products, New & Upcoming or Releases. Gallant Peak manages broader promotion separately.')).toBeTruthy();});
