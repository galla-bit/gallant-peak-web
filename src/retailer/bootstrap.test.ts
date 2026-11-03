// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {normalizeRetailerCallback} from './bootstrap';
afterEach(()=>{vi.restoreAllMocks();window.history.replaceState(null,'','/');});
it.each(['/','/shop','/retailer-preview','/retailer/','/gallant-peak-web/','/retailer#/tcg-hunt','/#/retailer'])('leaves existing routes untouched: %s',path=>{
 window.history.replaceState(null,'',path);const before=window.location.href;
 const replace=vi.spyOn(window.history,'replaceState');normalizeRetailerCallback();
 expect(window.location.href).toBe(before);expect(replace).not.toHaveBeenCalled();
});
it('replaces only the fixed callback destination without forwarding query parameters',()=>{
 window.history.replaceState({fromCallback:true},'','/retailer?next=https://foreign.example/&code=opaque');
 const replace=vi.spyOn(window.history,'replaceState');normalizeRetailerCallback();
 expect(replace).toHaveBeenCalledOnce();expect(window.location.pathname).toBe('/');
 expect(window.location.hash).toBe('#/retailer');expect(window.location.search).toBe('');
 expect(window.history.state).toEqual({fromCallback:true});
 normalizeRetailerCallback();expect(replace).toHaveBeenCalledOnce();
});
