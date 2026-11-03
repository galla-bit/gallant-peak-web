// @vitest-environment jsdom
import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {VerifiedStoreRoute} from '../tcg/stores/VerifiedStoreRoute';
import {testClient} from './__tests__/http';
afterEach(()=>{cleanup();vi.unstubAllEnvs();});
it.each([undefined,'false','TRUE'])('default artifact cannot open contextual editors even with a current capable session (%s)',async flag=>{
 vi.stubEnv('VITE_RETAILER_EDITOR_PREVIEW',flag);const {client,fetcher}=testClient();
 render(<MemoryRouter><VerifiedStoreRoute client={client} storeId='store-a'/></MemoryRouter>);
 await screen.findByRole('link',{name:'Retailer login'});
 expect(fetcher).not.toHaveBeenCalled();
 expect(screen.queryByRole('button',{name:'Edit Store'})).toBeNull();
 expect(screen.queryByRole('region',{name:'Contextual store editor'})).toBeNull();
});
it('exact explicit preview keeps the real contextual editor available',async()=>{
 vi.stubEnv('VITE_RETAILER_EDITOR_PREVIEW','true');const {client}=testClient();
 render(<MemoryRouter><VerifiedStoreRoute client={client} storeId='store-a'/></MemoryRouter>);
 fireEvent.click(await screen.findByRole('button',{name:'Edit Store'}));
 expect(await screen.findByRole('region',{name:'Contextual store editor'})).toBeTruthy();
});
