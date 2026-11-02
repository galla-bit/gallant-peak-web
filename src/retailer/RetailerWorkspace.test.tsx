// @vitest-environment jsdom
import {cleanup,render,screen,waitFor,fireEvent} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import App from '../App';
import {RetailerWorkspace} from './RetailerWorkspace';
import {testClient,json,session} from './__tests__/http';
afterEach(()=>{cleanup();vi.unstubAllEnvs();vi.unstubAllGlobals();});
it.each([undefined,'false','TRUE'])('keeps private route closed by default %s',async(flag)=>{vi.stubEnv('VITE_RETAILER_EDITOR_PREVIEW',flag);const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);render(<MemoryRouter initialEntries={['/retailer']}><App/></MemoryRouter>);expect(screen.getByRole('heading',{name:'PAGE NOT FOUND'})).toBeTruthy();expect(fetcher).not.toHaveBeenCalled();});
it('shows sign-in disconnected and has no fake account chooser',async()=>{const {client}=testClient(()=>json({...session,authenticated:false}));render(<RetailerWorkspace client={client}/>);await screen.findByText(/Sign-in is not connected/);expect(screen.queryByRole('button',{name:/sign in/i})).toBeNull();});
it('shows no-store state and accessible retailer sections',async()=>{
 const {client}=testClient();render(<RetailerWorkspace client={client}/>);await screen.findByLabelText('Retailer space');fireEvent.change(screen.getByLabelText('Retailer space'),{target:{value:'store-a'}});await screen.findByRole('heading',{name:'Synthetic A'});expect(screen.getByRole('button',{name:'Events & Competitions'})).toBeTruthy();
});
it('distinguishes authentication from a granted store',async()=>{const {client}=testClient(p=>p==='/auth/session'?json(session):json({schema_version:1,stores:[]}));render(<RetailerWorkspace client={client}/>);await screen.findByText(/No authorised retailer spaces/);});
it('exposes the workspace only for the exact enabled flag',async()=>{vi.stubEnv('VITE_RETAILER_EDITOR_PREVIEW','true');render(<MemoryRouter initialEntries={['/retailer']}><App/></MemoryRouter>);expect(screen.getByRole('heading',{name:'Retailer workspace'})).toBeTruthy();await waitFor(()=>expect(document.title).toBe('Retailer Workspace Preview | Gallant Peak'));expect(screen.queryByRole('heading',{name:'PAGE NOT FOUND'})).toBeNull();});
