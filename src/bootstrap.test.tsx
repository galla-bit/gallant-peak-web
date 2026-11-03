// @vitest-environment jsdom
import {act,screen} from '@testing-library/react';
import ReactDOM,{type Root} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {json,session} from './retailer/__tests__/http';

it('boots the real /retailer callback pathname into Retailer access without a hash',async()=>{
 const container=document.createElement('div');container.id='root';document.body.appendChild(container);
 window.history.replaceState({callback:true},'','/retailer');
 expect(window.location.pathname).toBe('/retailer');expect(window.location.hash).toBe('');
 const origin=window.location.origin;
 vi.stubGlobal('fetch',vi.fn(async()=>json({...session,authenticated:false})));
 const original=ReactDOM.createRoot;let root:Root|undefined;
 vi.spyOn(ReactDOM,'createRoot').mockImplementation((...args)=>{root=original(...args);return root;});
 try{
  await act(async()=>{await import('./main');});
  expect(await screen.findByRole('heading',{name:'Retailer access'})).toBeTruthy();
  expect(screen.queryByRole('heading',{name:/RISE.*WITHOUT.*PERMISSION/})).toBeNull();
  expect(await screen.findByRole('button',{name:'Retailer login'})).toBeTruthy();
  expect(window.location.pathname).toBe('/');expect(window.location.hash).toBe('#/retailer');
  expect(window.location.origin).toBe(origin);expect(window.history.state).toMatchObject({callback:true});
 }finally{
  await act(async()=>root?.unmount());container.remove();
  vi.restoreAllMocks();vi.unstubAllGlobals();window.history.replaceState(null,'','/');
 }
});
