import {it,expect} from 'vitest';
import contract from './fixtures/retailer-api-v1.openapi.json';
import {assertManagementContract} from './__tests__/contract-check';
it('checks every used body, detail/list response and auth/publication shape',()=>{expect(()=>assertManagementContract(contract)).not.toThrow();});
it.each(['required','body-field','response-field','method-ref'])('fails closed on upstream %s contract drift',change=>{
 const drift=structuredClone(contract);
 if(change==='required')drift.components.schemas.ProfileBody.required.push('unexpected');
 if(change==='body-field')delete (drift.components.schemas.NewsBody.properties as Record<string,unknown>).body;
 if(change==='response-field')delete (drift.components.schemas.EventDTO.properties as Record<string,unknown>).organiser_id;
 if(change==='method-ref')drift.paths['/api/retailer/v1/stores/{store_id}/profile'].put.requestBody.content['application/json'].schema.$ref='#/components/schemas/NewsBody';
 expect(()=>assertManagementContract(drift)).toThrow();
});
