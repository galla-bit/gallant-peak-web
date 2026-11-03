import {vi} from 'vitest';
import {createRetailerClient} from '../api';
export const csrf='x'.repeat(43);
export const session={authenticated:true,csrf_token:csrf,expires_at:'2030-01-01T00:00:00Z'};
export const management={profile_write:true,news_write:true,products_write:true,events_write:true,events_publish:true,results_write:true};
export const stores={schema_version:1,stores:[{id:'store-a',name:'Synthetic A',organiser_id:'org-a',management},{id:'store-b',name:'Synthetic B',organiser_id:'org-b',management}]};
export const json=(value:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}});
export function testClient(handler?:(path:string,init?:RequestInit)=>Response|Promise<Response>){const fetcher=vi.fn((path:RequestInfo|URL,init?:RequestInit)=>Promise.resolve(handler?.(String(path),init)??(String(path)==='/auth/session'?json(session):String(path).endsWith('/me/stores')?json(stores):json({},404))));return {client:createRetailerClient(fetcher),fetcher};}
export function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(r=>resolve=r);return {promise,resolve};}
