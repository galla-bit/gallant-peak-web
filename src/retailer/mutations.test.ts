import {it,expect,vi} from 'vitest';
import {createMutationWorkflow} from './mutations';
import {testClient,json,csrf,deferred} from './__tests__/http';
const input={operation:'profile-create',storeId:'store-a',body:{name:'A',description:'Text',source_url:'https://a.test/about',state:'DRAFT'}} as const;
const receipt={schema_version:1,id:'p',revision:1,publication_status:'queued'};
it('snapshots input and retries an ambiguous save with identical body and key',async()=>{
 const calls:{body:unknown;key:unknown}[]=[];let count=0;const {client}=testClient((_p,o)=>{calls.push({body:o?.body,key:(o?.headers as Record<string,string>)['Idempotency-Key']});if(count++===0)throw new Error('lost response');return json(receipt);});
 const workflow=createMutationWorkflow(client,3);const editable={...input,body:{...input.body,name:String(input.body.name)}};workflow.prepare(editable,'same-key');editable.body.name='Changed';await expect(workflow.submit(csrf)).rejects.toMatchObject({category:'unavailable'});await workflow.retry(csrf);expect(calls[0]).toEqual(calls[1]);expect(JSON.parse(String(calls[1].body)).name).toBe('A');
 workflow.prepare(input,'new-key');expect(workflow.intent?.key).toBe('new-key');
});
it('blocks concurrent submission and erases disposed intents',async()=>{
 const pending=deferred<Response>();const {client,fetcher}=testClient(()=>pending.promise);const workflow=createMutationWorkflow(client,1);workflow.prepare(input,'k');const first=workflow.submit(csrf);await expect(workflow.submit(csrf)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(1);pending.resolve(json(receipt));await first;workflow.discard();expect(workflow.intent).toBeNull();await expect(workflow.retry(csrf)).rejects.toThrow();
});
