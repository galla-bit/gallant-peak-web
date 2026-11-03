/** Test-only structural assertions, deliberately not a JSON Schema interpreter. */
import {expect} from 'vitest';
import {bodyFields,object,type ContentKind} from '../contracts';
export function assertManagementContract(value:unknown){
 const doc=object(value),schemas=object(object(doc.components).schemas),paths=object(doc.paths);
 const schema=(name:string)=>object(schemas[name]);
 const properties=(name:string)=>object(schema(name).properties);
 const sorted=(value:unknown)=>{if(!Array.isArray(value))throw new Error('Expected schema keys');return [...value].sort();};
 function closed(name:string,names:string[]){expect(schema(name).additionalProperties).toBe(false);expect(Object.keys(properties(name)).sort()).toEqual([...names].sort());expect(sorted(schema(name).required)).toEqual([...names].sort());}
 const optional={profile:[],news:[],listing:[],event:['city','region','format','entry_fee','registration_status'],result:['deck_archetype','supersedes_revision']};
 const titles={profile:'Profile',news:'News',listing:'Listing',event:'Event',result:'Result'};
 for(const kind of Object.keys(titles) as ContentKind[]){
  const title=titles[kind],body=title+'Body',dto=title+'DTO',required=[...bodyFields[kind]];
  expect(schema(body).additionalProperties).toBe(false);expect(Object.keys(properties(body)).sort()).toEqual([...required,...optional[kind]].sort());expect(sorted(schema(body).required)).toEqual(required.sort());
  for(const field of bodyFields[kind]){
   const rule=object(properties(body)[field]);
   if(field==='state')expect(rule.enum).toEqual(kind==='event'?['DRAFT','PUBLISHED','CANCELLED']:['DRAFT','PUBLISHED','WITHDRAWN']);
   else if(field==='timezone')expect(rule.enum).toEqual(['UTC','Pacific/Auckland']);
   else {expect(rule.type).toBe('string');expect(rule.minLength).toBe(1);expect(rule.maxLength).toBe(field.endsWith('_url')?2048:field==='body'||field==='description'?10000:200);}
  }
  const dtoNames=['schema_version','id','retailer_id','kind','revision','state','fields','updated_at',...(kind==='event'||kind==='result'?['organiser_id']:[]),...(kind==='result'?['event_id']:[])];closed(dto,dtoNames);
  expect(object(properties(dto).schema_version).const).toBe(1);expect(object(properties(dto).kind).const).toBe(kind);expect(object(properties(dto).revision)).toEqual({type:'integer',minimum:1});
  const fields=object(properties(dto).fields);expect(fields.additionalProperties).toBe(false);expect(Object.keys(object(fields.properties)).sort()).toEqual([...required,...optional[kind]].filter(k=>k!=='state'&&k!=='supersedes_revision').sort());expect(sorted(fields.required)).toEqual(required.filter(k=>k!=='state').sort());
  if(kind==='news'||kind==='listing'||kind==='event'){closed(title+'List',['schema_version','items','next_after_id']);expect(object(object(properties(title+'List').items).items).$ref).toBe('#/components/schemas/'+dto);}
 }
 closed('SessionDTO',['authenticated','csrf_token','expires_at']);expect(object(properties('SessionDTO').authenticated).type).toBe('boolean');
 closed('AccessibleStores',['schema_version','stores']);const store=object(object(properties('AccessibleStores').stores).items);expect(store.additionalProperties).toBe(false);expect(Object.keys(object(store.properties)).sort()).toEqual(['id','name','organiser_id']);
 closed('SavedReceipt',['schema_version','id','revision','publication_status']);expect(object(properties('SavedReceipt').publication_status).enum).toEqual(['queued','not_required']);
 closed('PublicationDTO',['schema_version','id','revision','domains']);expect(object(properties('PublicationDTO').schema_version).const).toBe(1);
 function operation(path:string,method:string,response:string,body?:string){const op=object(object(paths[path])[method]);const responses=object(op.responses);const success=object(responses[method==='post'&&path.includes('/stores/')?'201':'200']);expect(object(object(object(success.content)['application/json']).schema).$ref).toBe('#/components/schemas/'+response);if(body)expect(object(object(object(object(op.requestBody).content)['application/json']).schema).$ref).toBe('#/components/schemas/'+body);}
 operation('/auth/session','get','SessionDTO');operation('/auth/logout','post','LoggedOut','EmptyBody');operation('/api/retailer/v1/me/stores','get','AccessibleStores');
 const base='/api/retailer/v1/stores/{store_id}';operation(base+'/profile','get','ProfileDTO');operation(base+'/profile','put','SavedReceipt','ProfileBody');
 for(const [plural,title,param] of [['news','News','entity_id'],['listings','Listing','entity_id'],['events','Event','event_id']]){operation(base+'/'+plural,'get',title+'List');operation(base+'/'+plural,'post','SavedReceipt',title+'Body');operation(base+'/'+plural+'/{'+param+'}','get',title+'DTO');operation(base+'/'+plural+'/{'+param+'}','put','SavedReceipt',title+'Body');}
 operation(base+'/events/{event_id}/result','get','ResultDTO');operation(base+'/events/{event_id}/result','put','SavedReceipt','ResultBody');operation(base+'/publication/{kind}/{entity_id}','get','PublicationDTO');
}
