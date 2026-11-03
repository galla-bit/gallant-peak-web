import {management} from './__tests__/http';
import {describe,it,expect} from 'vitest';
import {decodeContent,decodeSession,decodeStores,decodeReceipt,decodePublication,validateBody,identifier} from './contracts';
import news from './fixtures/news-response.json';
const profile={schema_version:1,id:'p',retailer_id:'a',kind:'profile',revision:1,state:'DRAFT',fields:{name:'Store',description:'Local text',source_url:'https://store.example.test/about'},updated_at:'2026-11-02T00:00:00Z'};
describe('private contracts',()=>{
 it('decodes the canonical backend example and every content kind',()=>{
  expect(decodeContent(news,'news').id).toBe('news-existing');
  for(const [kind,fields,state] of [
   ['profile',profile.fields,'DRAFT'],['listing',{name:'Box',description:'Local',game:'Pokemon',product_url:'https://store.example.test/box'},'WITHDRAWN'],
   ['event',{name:'League',game:'Pokemon',starts_at:'2026-11-05T01:00:00Z',timezone:'Pacific/Auckland',event_url:'https://store.example.test/event',source_url:'https://store.example.test/event'},'CANCELLED'],
   ['result',{event_at:'2026-11-01T01:00:00Z',winner:'Player',source_url:'https://store.example.test/result'},'PUBLISHED']
  ] as const){const dto={...profile,kind,fields,state,...(kind==='event'||kind==='result'?{organiser_id:'organiser-a'}:{}),...(kind==='result'?{event_id:'event-a'}:{})};expect(decodeContent(dto,kind).kind).toBe(kind);}
 });
 it.each([{schema_version:2},{revision:1.5},{revision:Number.MAX_SAFE_INTEGER+1},{updated_at:'2026-11-02'},{state:'ACTIVE'},{account_id:'admin'},{kind:'listing'},{fields:{...profile.fields,source_url:'javascript:alert(1)'}},{fields:{...profile.fields,name:'<script>x</script>'}},{fields:{...profile.fields,name:'x'.repeat(201)}}])('rejects invalid or authority-bearing record %j',patch=>{expect(()=>decodeContent({...profile,...patch},'profile')).toThrow();});
 it('rejects unknown body fields, unsafe links and unsupported event times',()=>{
  expect(()=>validateBody('profile',{...profile.fields,state:'PUBLISHED',role:'admin'})).toThrow();
  expect(()=>validateBody('profile',{...profile.fields,state:'PUBLISHED',source_url:'https://x.test/a?secret=1'})).toThrow();
  expect(()=>identifier('../store-b')).toThrow();
 });
 it('checks closed session/store/receipt/publication shapes',()=>{
  expect(decodeSession({authenticated:true,csrf_token:'x'.repeat(43),expires_at:'2026-11-03T01:00:00Z'}).authenticated).toBe(true);
  expect(decodeStores({schema_version:1,stores:[{id:'a',name:'A',organiser_id:'org-a',management}]}).stores).toHaveLength(1);
  expect(decodeReceipt({schema_version:1,id:'a',revision:1,publication_status:'queued'}).revision).toBe(1);
  expect(decodePublication({schema_version:1,id:'a',revision:1,domains:[{domain:'events',state:'acknowledged'}]}).domains).toHaveLength(1);
  expect(()=>decodeSession({authenticated:true,csrf_token:'short',expires_at:null})).toThrow();
  expect(()=>decodeStores({schema_version:1,stores:[{id:'a',name:'A',organiser_id:'org-a',management,role:'admin'}]})).toThrow();
  expect(()=>decodeReceipt({schema_version:1,id:'a',revision:1,publication_status:'visible'})).toThrow();
 });
});
