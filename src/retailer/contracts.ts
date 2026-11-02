/** Private management contracts. These types never establish public eligibility. */
export type ContentKind='profile'|'news'|'listing'|'event'|'result';
export type CollectionKind='news'|'listing'|'event';
export type ContentState='DRAFT'|'PUBLISHED'|'WITHDRAWN';
export interface ProfileBody {name:string;description:string;source_url:string;state:ContentState}
export interface NewsBody {title:string;body:string;source_url:string;state:ContentState}
export interface ListingBody {name:string;description:string;game:string;product_url:string;state:ContentState}
export interface EventBody {name:string;game:string;starts_at:string;timezone:'UTC'|'Pacific/Auckland';event_url:string;source_url:string;state:'DRAFT'|'PUBLISHED'|'CANCELLED';city?:string|null;region?:string|null;format?:string|null;entry_fee?:string|null;registration_status?:string|null}
export interface ResultBody {event_at:string;winner:string;source_url:string;deck_archetype?:string|null;supersedes_revision?:number|null}
export interface BodyByKind {profile:ProfileBody;news:NewsBody;listing:ListingBody;event:EventBody;result:ResultBody}
export interface ContentDTO<K extends ContentKind=ContentKind> {schema_version:1;id:string;retailer_id:string;kind:K;revision:number;state:string;fields:Omit<BodyByKind[K],'state'|'supersedes_revision'>;updated_at:string;organiser_id?:string;event_id?:string}
export interface Versioned<K extends ContentKind=ContentKind> {record:ContentDTO<K>;etag:string}
export interface ContentList<K extends ContentKind=ContentKind> {schema_version:1;items:ContentDTO<K>[];next_after_id:string|null}
export interface SessionDTO {authenticated:boolean;csrf_token:string;expires_at:string|null}
export interface AccessibleStores {schema_version:1;stores:{id:string;name:string;organiser_id:string}[]}
export interface SavedReceipt {schema_version:1;id:string;revision:number;publication_status:'queued'|'not_required'}
export interface PublicationDTO {schema_version:1;id:string;revision:number;domains:{domain:'retailers'|'events'|'winners'|'releases';state:'queued'|'acknowledged'|'not_required'|'unknown'}[]}
export type MutationInput=
 |{operation:'profile-create';storeId:string;body:ProfileBody}
 |{operation:'collection-create';storeId:string;kind:CollectionKind;body:NewsBody|ListingBody|EventBody}
 |{operation:'item-update';storeId:string;kind:Exclude<ContentKind,'result'>;id:string;etag:string;body:ProfileBody|NewsBody|ListingBody|EventBody}
 |{operation:'result-create';storeId:string;eventId:string;body:ResultBody}
 |{operation:'result-correct';storeId:string;eventId:string;etag:string;body:ResultBody};
export interface MutationIntent {readonly input:MutationInput;readonly key:string;readonly generation:number}
export class ContractError extends Error {constructor(){super('Invalid private API contract');}}
export function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new ContractError();return value as Record<string,unknown>;}
export function keys(value:Record<string,unknown>,required:string[],optional:string[]=[]){if(required.some(k=>!Object.hasOwn(value,k))||Object.keys(value).some(k=>![...required,...optional].includes(k)))throw new ContractError();}
export function identifier(value:unknown):string{if(typeof value!=='string'||! /^[A-Za-z0-9._:-]{1,128}$/.test(value)||value==='.'||value==='..')throw new ContractError();return value;}
export function revision(value:unknown):number{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1)throw new ContractError();return value;}
export function plain(value:unknown,limit=200):string{if(typeof value!=='string'||!value.trim()||Array.from(value).length>limit||/[<>\x00-\x08\x0b-\x1f]/.test(value))throw new ContractError();return value;}
export function publicUrl(value:unknown):string{const text=plain(value,2048);let url:URL;try{url=new URL(text);}catch{throw new ContractError();}if(/\s/.test(text)||url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port&&url.port!=='443'||!url.hostname.includes('.')||/[.:]$/.test(url.hostname)||/\.(local|localhost|internal)$/.test(url.hostname)||/^[\d.]+$/.test(url.hostname)||url.hostname.includes(':'))throw new ContractError();return text;}
export function instant(value:unknown):string{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw new ContractError();const offset=value.match(/[+-](\d{2}):(\d{2})$/);if(offset&&(Number(offset[1])>14||Number(offset[2])>59||Number(offset[1])===14&&Number(offset[2])!==0))throw new ContractError();const day=value.slice(0,10),dt=new Date(day+'T00:00:00Z');if(dt.toISOString().slice(0,10)!==day)throw new ContractError();return value;}
export const bodyFields={profile:['name','description','source_url','state'],news:['title','body','source_url','state'],listing:['name','description','game','product_url','state'],event:['name','game','starts_at','timezone','event_url','source_url','state'],result:['event_at','winner','source_url']} as const;
const optionalFields={profile:[],news:[],listing:[],event:['city','region','format','entry_fee','registration_status'],result:['deck_archetype','supersedes_revision']} as const;
export function validateBody<K extends ContentKind>(kind:K,value:unknown):BodyByKind[K]{
 const body=object(value);keys(body,[...bodyFields[kind]],[...optionalFields[kind]]);
 for(const [key,val] of Object.entries(body)){
  if(val===null&&(optionalFields[kind] as readonly string[]).includes(key))continue;
  if(key==='state'){if(!(kind==='event'?['DRAFT','PUBLISHED','CANCELLED']:['DRAFT','PUBLISHED','WITHDRAWN']).includes(String(val))||typeof val!=='string')throw new ContractError();}
  else if(key==='timezone'){if(val!=='UTC'&&val!=='Pacific/Auckland')throw new ContractError();}
  else if(key==='supersedes_revision')revision(val);
  else if(key.endsWith('_url'))publicUrl(val);
  else if(key==='starts_at'||key==='event_at')instant(val);
  else plain(val,key==='description'||key==='body'?10000:200);
 }
 return {...body} as unknown as BodyByKind[K];
}
function version(value:Record<string,unknown>){if(value.schema_version!==1)throw new ContractError();}
export function decodeContent<K extends ContentKind>(value:unknown,kind:K):ContentDTO<K>{
 const dto=object(value);keys(dto,['schema_version','id','retailer_id','kind','revision','state','fields','updated_at',...(kind==='event'||kind==='result'?['organiser_id']:[]),...(kind==='result'?['event_id']:[])]);version(dto);
 identifier(dto.id);identifier(dto.retailer_id);revision(dto.revision);instant(dto.updated_at);if(dto.kind!==kind)throw new ContractError();
 if(kind==='event'||kind==='result')identifier(dto.organiser_id);if(kind==='result')identifier(dto.event_id);
 const fields=object(dto.fields);if(Object.hasOwn(fields,'state')||Object.hasOwn(fields,'supersedes_revision'))throw new ContractError();
 if(kind==='result'){if(dto.state!=='PUBLISHED')throw new ContractError();validateBody(kind,fields);}else validateBody(kind,{...fields,state:dto.state});
 return dto as unknown as ContentDTO<K>;
}
export function decodeSession(value:unknown):SessionDTO{const dto=object(value);keys(dto,['authenticated','csrf_token','expires_at']);if(typeof dto.authenticated!=='boolean'||typeof dto.csrf_token!=='string'||!/^[A-Za-z0-9_-]{43,128}$/.test(dto.csrf_token))throw new ContractError();if(dto.expires_at!==null)instant(dto.expires_at);return dto as unknown as SessionDTO;}
export function decodeStores(value:unknown):AccessibleStores{const dto=object(value);keys(dto,['schema_version','stores']);version(dto);if(!Array.isArray(dto.stores))throw new ContractError();const seen=new Set<string>();for(const raw of dto.stores){const row=object(raw);keys(row,['id','name','organiser_id']);const id=identifier(row.id);if(seen.has(id))throw new ContractError();seen.add(id);plain(row.name);identifier(row.organiser_id);}return dto as unknown as AccessibleStores;}
export function decodeReceipt(value:unknown):SavedReceipt{const dto=object(value);keys(dto,['schema_version','id','revision','publication_status']);version(dto);identifier(dto.id);revision(dto.revision);if(dto.publication_status!=='queued'&&dto.publication_status!=='not_required')throw new ContractError();return dto as unknown as SavedReceipt;}
export function decodePublication(value:unknown):PublicationDTO{const dto=object(value);keys(dto,['schema_version','id','revision','domains']);version(dto);identifier(dto.id);revision(dto.revision);if(!Array.isArray(dto.domains))throw new ContractError();const seen=new Set();for(const raw of dto.domains){const row=object(raw);keys(row,['domain','state']);if(!['retailers','events','winners','releases'].includes(String(row.domain))||!['queued','acknowledged','not_required','unknown'].includes(String(row.state))||seen.has(row.domain))throw new ContractError();seen.add(row.domain);}return dto as unknown as PublicationDTO;}
export function decodeList<K extends CollectionKind>(value:unknown,kind:K,storeId:string):ContentList<K>{const dto=object(value);keys(dto,['schema_version','items','next_after_id']);version(dto);if(!Array.isArray(dto.items)||dto.items.length>100)throw new ContractError();const seen=new Set();for(const item of dto.items){const record=decodeContent(item,kind);if(record.retailer_id!==storeId||seen.has(record.id))throw new ContractError();seen.add(record.id);}if(dto.next_after_id!==null)identifier(dto.next_after_id);return dto as unknown as ContentList<K>;}
