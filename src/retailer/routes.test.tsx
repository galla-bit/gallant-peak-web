// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {HashRouter} from 'react-router-dom';
import App from '../App';
import {json,session} from './__tests__/http';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();window.history.replaceState(null,'','/');});
it('exposes the retailer resolver without enabling preview write forms',async()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});vi.stubGlobal('fetch',vi.fn(async()=>json({...session,authenticated:false})));window.history.replaceState(null,'','/#/retailer');render(<HashRouter><App/></HashRouter>);expect(await screen.findByRole('button',{name:'Retailer login'})).toBeTruthy();expect(screen.queryByText('Retailer workspace')).toBeNull();expect(document.title).toBe('Retailer access | Gallant Peak');});
it('public directory does not advertise a MythicDeck profile route',async()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});vi.stubGlobal('fetch',vi.fn(async()=>json({...session,authenticated:false})));window.history.replaceState(null,'','/#/tcg-hunt');render(<HashRouter><App/></HashRouter>);fireEvent.click(screen.getByRole('button',{name:'Verified Stores'}));expect(screen.getByText(/No verified store cards have been published/)).toBeTruthy();expect(screen.queryByRole('button',{name:'Preview MythicDeck demonstration'})).toBeNull();});
it('unavailable store shell returns to Verified Stores rather than Products',async()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});vi.stubGlobal('fetch',vi.fn(async()=>json({...session,authenticated:false})));window.history.replaceState(null,'','/#/tcg-hunt/verified-stores/unknown');render(<HashRouter><App/></HashRouter>);fireEvent.click(await screen.findByRole('link',{name:'Back to Verified Stores'}));expect(await screen.findByRole('region',{name:'Verified Stores'})).toBeTruthy();});
