import {it,expect,vi} from 'vitest';
import {createRetailerClient} from './api';
import news from './fixtures/news-response.json';
const response=(value:unknown,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}});
it('uses fixed same-origin private paths, credentials and no-store',async()=>{
 const fetcher=vi.fn().mockResolvedValue(response(news,200,{ETag:'"r1"'}));const api=createRetailerClient(fetcher);
 const signal=new AbortController().signal;
 expect((await api.get('store-a','news','news-existing',signal)).etag).toBe('"r1"');
 const [path,options]=fetcher.mock.calls[0]; expect(path).toBe('/api/retailer/v1/stores/store-a/news/news-existing');
 expect(options).toMatchObject({credentials:'same-origin',cache:'no-store',redirect:'error',signal});
 expect(Object.keys(options.headers).map(k=>k.toLowerCase())).not.toContain('authorization');
 expect(()=>api.get('..','news','x')).toThrow();
});
it('checks detail owner and matching strong ETag',async()=>{
 for(const [dto,etag] of [[news,'"r2"'],[{...news,retailer_id:'other'},'"r1"']] as const){const api=createRetailerClient(vi.fn().mockResolvedValue(response(dto,200,{ETag:etag})));await expect(api.get('store-a','news','news-existing')).rejects.toMatchObject({category:'contract'});}
});
it('sends only closed mutation body and required preconditions',async()=>{
 const fetcher=vi.fn().mockResolvedValue(response({schema_version:1,id:'p',revision:1,publication_status:'queued'},201));const api=createRetailerClient(fetcher);
 await api.save({input:{operation:'profile-create',storeId:'a',body:{name:'A',description:'Text',source_url:'https://a.test/about',state:'DRAFT'}},key:'intent-1',generation:3},'x'.repeat(43));
 const [path,o]=fetcher.mock.calls[0];expect(path).toBe('/api/retailer/v1/stores/a/profile');expect(o.headers).toMatchObject({'X-CSRF-Token':'x'.repeat(43),'Idempotency-Key':'intent-1','If-None-Match':'*'});expect(o.headers).not.toHaveProperty('Origin');expect(JSON.parse(o.body)).not.toHaveProperty('generation');
});
it.each([[401,'session-ended'],[403,'denied'],[404,'not-found'],[409,'conflict'],[412,'precondition'],[413,'invalid'],[415,'invalid'],[422,'invalid'],[428,'precondition'],[429,'limited'],[503,'unavailable']])('maps status %i safely',async(status,category)=>{
 const api=createRetailerClient(vi.fn().mockResolvedValue(new Response('<script>secret</script>',{status:Number(status)})));await expect(api.getStores()).rejects.toMatchObject({category});
});
it('rejects malformed JSON and wrong collection scope',async()=>{
 const api=createRetailerClient(vi.fn().mockResolvedValue(response({schema_version:1,items:[{...news,retailer_id:'foreign'}],next_after_id:null})));await expect(api.list('store-a','news',{})).rejects.toMatchObject({category:'contract'});
});
