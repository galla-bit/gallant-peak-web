// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,renderHook,screen,waitFor} from '@testing-library/react';
import {HashRouter,Link,Route,Routes,useParams} from 'react-router-dom';
import {afterEach,expect,it,vi} from 'vitest';
import {useUnsavedStoreChanges} from './editing';
afterEach(()=>{cleanup();vi.restoreAllMocks();window.history.replaceState(null,'','/');});
it('guards dirty route links but allows deliberate discard',()=>{
 const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);const {result}=renderHook(()=>useUnsavedStoreChanges());
 render(<a href='/#/tcg-hunt' onClick={event=>event.preventDefault()}>Leave store</a>);act(()=>result.current.markDirty('form',true));
 const cancelled=new MouseEvent('click',{bubbles:true,cancelable:true});screen.getByRole('link').dispatchEvent(cancelled);expect(cancelled.defaultPrevented).toBe(true);expect(confirm).toHaveBeenCalledOnce();expect(result.current.dirty).toBe(true);
 confirm.mockReturnValue(true);fireEvent.click(screen.getByRole('link'));expect(result.current.dirty).toBe(false);
});
it('cancels browser Back without letting HashRouter observe the rejected destination',()=>{
 window.history.replaceState({idx:1},'','/#/tcg-hunt/verified-stores/store-a');const confirm=vi.spyOn(window,'confirm').mockReturnValue(false),go=vi.spyOn(window.history,'go').mockImplementation(()=>{});
 const {result}=renderHook(()=>useUnsavedStoreChanges());act(()=>result.current.markDirty('form',true));const routed=vi.fn();window.addEventListener('popstate',routed);
 try{window.history.replaceState({idx:0},'','/#/tcg-hunt');fireEvent(window,new PopStateEvent('popstate',{state:{idx:0}}));expect(go).toHaveBeenCalledWith(1);expect(routed).not.toHaveBeenCalled();expect(confirm).toHaveBeenCalledOnce();
 window.history.replaceState({idx:1},'','/#/tcg-hunt/verified-stores/store-a');fireEvent(window,new PopStateEvent('popstate',{state:{idx:1}}));expect(routed).not.toHaveBeenCalled();expect(result.current.dirty).toBe(true);
 }finally{window.removeEventListener('popstate',routed);}
});
it('clean work does not prompt and dirty form cleanup removes the warning',()=>{const confirm=vi.spyOn(window,'confirm');const {result}=renderHook(()=>useUnsavedStoreChanges());const action=vi.fn();act(()=>result.current.leave(action));expect(action).toHaveBeenCalledOnce();act(()=>result.current.markDirty('form',true));act(()=>result.current.markDirty('form',false));const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);expect(event.defaultPrevented).toBe(false);expect(confirm).not.toHaveBeenCalled();});
it('cancelled Back after a same-route store PUSH restores both HashRouter and browser URL to the dirty store',async()=>{
 function Store(){const {id}=useParams();const guard=useUnsavedStoreChanges();return <><h1>Store {id}</h1><Link to='/store/b'>Store B</Link><button onClick={()=>guard.markDirty('draft',true)}>Edit draft</button></>;}
 window.history.replaceState(null,'','/#/store/a');const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);render(<HashRouter><Routes><Route path='/store/:id' element={<Store/>}/></Routes></HashRouter>);
 fireEvent.click(screen.getByRole('link',{name:'Store B'}));expect(await screen.findByRole('heading',{name:'Store b'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Edit draft'}));
 await act(async()=>{window.history.back();await new Promise(resolve=>setTimeout(resolve,40));});
 await waitFor(()=>expect(confirm).toHaveBeenCalledOnce());expect(window.location.hash).toBe('#/store/b');expect(screen.getByRole('heading',{name:'Store b'})).toBeTruthy();
});
