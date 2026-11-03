import {expect,it} from 'vitest';
import {decodeStores} from './contracts';
import {createRetailerClient} from './api';
import {csrf,json} from './__tests__/http';
export const hints={profile_write:true,news_write:false,products_write:false,events_write:false,events_publish:false,results_write:false};
const row={id:'a',name:'A',organiser_id:'org-a',management:hints};
it('accepts exactly the six backend management booleans',()=>{
 expect(decodeStores({schema_version:1,stores:[row]}).stores[0]).toEqual(row);
});
it.each([undefined,{}, {...hints,role:true},{...hints,profile_write:1},{...hints,news_write:'false'},null])('fails closed on malformed management %j',management=>{
 expect(()=>decodeStores({schema_version:1,stores:[{...row,management}]})).toThrow();
});
it('starts login with anonymous-session CSRF and no bearer credentials',async()=>{
 const calls:{path:string;init?:RequestInit}[]=[];
 const client=createRetailerClient(async(p,o)=>{calls.push({path:String(p),init:o});return json({authorization_url:'https://issuer.example/authorize?state=opaque'});});
 expect(await client.login(csrf)).toBe('https://issuer.example/authorize?state=opaque');
 expect(calls).toEqual([{path:'/auth/login',init:expect.objectContaining({method:'POST',credentials:'same-origin',redirect:'error',cache:'no-store',body:'{}',headers:expect.objectContaining({'X-CSRF-Token':csrf})})}]);
 expect(calls[0].init?.headers).not.toHaveProperty('Authorization');
});
it.each(['javascript:alert(1)','http://issuer.example/auth','https://user:pass@issuer.example/auth','//issuer.example/auth'])('rejects unsafe login destination %s',async authorization_url=>{
 const client=createRetailerClient(async()=>json({authorization_url}));
 await expect(client.login(csrf)).rejects.toMatchObject({category:'contract'});
});
