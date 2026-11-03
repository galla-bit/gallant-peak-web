// @vitest-environment jsdom
import {act,cleanup,renderHook,waitFor} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {useRetailerSession} from './session';
import {testClient,json,session,stores,deferred} from './__tests__/http';
afterEach(cleanup);
it('loads only server stores, invalidates generations and rejects unknown selection',async()=>{
 const {client}=testClient();const {result}=renderHook(()=>useRetailerSession(client));await waitFor(()=>expect(result.current.status).toBe('ready'));
 expect(result.current.stores).toHaveLength(2);const generation=result.current.generation;
 act(()=>result.current.selectStore('store-a'));expect(result.current.selectedStoreId).toBe('store-a');expect(result.current.generation).toBeGreaterThan(generation);
 act(()=>result.current.selectStore('forged'));expect(result.current.selectedStoreId).toBe('store-a');
 const signal=result.current.signalForGeneration();act(()=>result.current.selectStore('store-b'));expect(signal.aborted).toBe(true);
});
it('ignores delayed store bootstrap after logout even without fetch abort',async()=>{
 const pending=deferred<Response>();const {client}=testClient(p=>p==='/auth/session'?json(session):p.endsWith('/me/stores')?pending.promise:json({authenticated:false}));
 const {result}=renderHook(()=>useRetailerSession(client));await act(async()=>{await Promise.resolve();});await act(async()=>{await result.current.logout();});
 pending.resolve(json(stores));await act(async()=>{await Promise.resolve();});expect(result.current.status).toBe('logout-unconfirmed');expect(result.current.stores).toHaveLength(0);
});
it('clears local state on failed logout but does not claim server logout',async()=>{
 const {client}=testClient(p=>p==='/auth/session'?json(session):p.endsWith('/me/stores')?json(stores):json({},503));const {result}=renderHook(()=>useRetailerSession(client));await waitFor(()=>expect(result.current.status).toBe('ready'));await act(async()=>{await result.current.logout();});expect(result.current.status).toBe('logout-unconfirmed');expect(result.current.csrf).toBeUndefined();expect(result.current.stores).toHaveLength(0);
});
it('clears a lost session and revalidates denied scope without restoring selection',async()=>{
 const {client}=testClient();const {result}=renderHook(()=>useRetailerSession(client));await waitFor(()=>expect(result.current.status).toBe('ready'));act(()=>result.current.selectStore('store-a'));act(()=>result.current.onDenied('denied'));await waitFor(()=>expect(result.current.status).toBe('ready'));expect(result.current.selectedStoreId).toBeNull();act(()=>result.current.onDenied('session-ended'));expect(result.current.status).toBe('session-ended');expect(result.current.stores).toHaveLength(0);
});
it('confirms logout only after successful server response',async()=>{
 const {client}=testClient(p=>p==='/auth/session'?json(session):p.endsWith('/me/stores')?json(stores):json({authenticated:false}));const {result}=renderHook(()=>useRetailerSession(client));await waitFor(()=>expect(result.current.status).toBe('ready'));await act(async()=>{await result.current.logout();});expect(result.current.status).toBe('anonymous');expect(result.current.csrf).toBeUndefined();
});
