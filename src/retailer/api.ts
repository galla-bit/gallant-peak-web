import {ContractError,decodeContent,decodeList,decodePublication,decodeReceipt,decodeSession,decodeStores,identifier,keys,object,validateBody,type ContentKind,type CollectionKind,type MutationIntent,type Versioned} from './contracts';
export class RetailerApiError extends Error {constructor(public category:'session-ended'|'denied'|'not-found'|'conflict'|'precondition'|'invalid'|'limited'|'unavailable'|'contract',public retryAt?:number){super(category);}}
const plurals={news:'news',listing:'listings',event:'events'} as const;
export function createRetailerClient(fetcher:typeof fetch=fetch){
 async function request(path:string,init:RequestInit={}){try{
  const response=await fetcher(path,{...init,credentials:'same-origin',cache:'no-store',redirect:'error',headers:{Accept:'application/json',...init.headers}});
  if(!response.ok){const categories:Record<number,RetailerApiError['category']>={401:'session-ended',403:'denied',404:'not-found',409:'conflict',412:'precondition',413:'invalid',415:'invalid',422:'invalid',428:'precondition',429:'limited',503:'unavailable'};const retry=response.headers.get('Retry-After');const retryAt=retry?(/^\d+$/.test(retry)?Date.now()+Number(retry)*1000:Date.parse(retry)):undefined;throw new RetailerApiError(categories[response.status]??'unavailable',retryAt&&Number.isFinite(retryAt)?retryAt:undefined);}
  if(!response.headers.get('content-type')?.toLowerCase().includes('application/json'))throw new ContractError();
  return {response,value:await response.json() as unknown};
 }catch(error){if(error instanceof RetailerApiError)throw error;if(error instanceof DOMException&&error.name==='AbortError')throw error;throw new RetailerApiError(error instanceof ContractError||error instanceof SyntaxError?'contract':'unavailable');}}
 const storePath=(store:string)=>'/api/retailer/v1/stores/'+encodeURIComponent(identifier(store));
 const collectionPath=(store:string,kind:CollectionKind)=>{if(!Object.hasOwn(plurals,kind))throw new RetailerApiError('contract');return storePath(store)+'/'+plurals[kind];};
 async function detail<K extends ContentKind>(path:string,kind:K,store:string,id?:string,signal?:AbortSignal):Promise<Versioned<K>>{const {response,value}=await request(path,{signal});try{const record=decodeContent(value,kind);const etag=response.headers.get('ETag');if(record.retailer_id!==store||id&&record.id!==id||etag!=='"r'+record.revision+'"')throw new ContractError();return {record,etag};}catch{throw new RetailerApiError('contract');}}
 async function decoded<T>(path:string,decode:(v:unknown)=>T,signal?:AbortSignal){const {value}=await request(path,{signal});try{return decode(value);}catch{throw new RetailerApiError('contract');}}
 return {
  async login(csrf:string,signal?:AbortSignal){const {value}=await request('/auth/login',{method:'POST',signal,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:'{}'});try{const dto=object(value);keys(dto,['authorization_url']);if(typeof dto.authorization_url!=='string')throw new ContractError();const url=new URL(dto.authorization_url);if(url.protocol!=='https:'||url.username||url.password||url.hash)throw new ContractError();return dto.authorization_url;}catch{throw new RetailerApiError('contract');}},
  getSession:(signal?:AbortSignal)=>decoded('/auth/session',decodeSession,signal),
  getStores:(signal?:AbortSignal)=>decoded('/api/retailer/v1/me/stores',decodeStores,signal),
  async logout(csrf:string,signal?:AbortSignal){const {value}=await request('/auth/logout',{method:'POST',signal,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:'{}'});try{const dto=object(value);keys(dto,['authenticated']);if(dto.authenticated!==false)throw new ContractError();}catch{throw new RetailerApiError('contract');}},
  getProfile:(store:string,signal?:AbortSignal)=>detail(storePath(store)+'/profile','profile',store,undefined,signal),
  list:<K extends CollectionKind>(store:string,kind:K,query:{afterId?:string;limit?:number},signal?:AbortSignal)=>{const params=new URLSearchParams();if(query.afterId)params.set('after_id',identifier(query.afterId));if(query.limit!==undefined){if(!Number.isInteger(query.limit)||query.limit<1||query.limit>100)throw new RetailerApiError('contract');params.set('limit',String(query.limit));}return decoded(collectionPath(store,kind)+(params.size?'?'+params:''),v=>decodeList(v,kind,store),signal);},
  get:<K extends CollectionKind>(store:string,kind:K,id:string,signal?:AbortSignal)=>detail(collectionPath(store,kind)+'/'+encodeURIComponent(identifier(id)),kind,store,id,signal),
  async getResult(store:string,eventId:string,signal?:AbortSignal){const result=await detail(collectionPath(store,'event')+'/'+encodeURIComponent(identifier(eventId))+'/result','result',store,undefined,signal);if(result.record.event_id!==eventId)throw new RetailerApiError('contract');return result;},
  publication:(store:string,kind:ContentKind,id:string,signal?:AbortSignal)=>{if(!['profile','news','listing','event','result'].includes(kind))throw new RetailerApiError('contract');return decoded(storePath(store)+'/publication/'+kind+'/'+encodeURIComponent(identifier(id)),v=>{const dto=decodePublication(v);if(dto.id!==id)throw new ContractError();return dto;},signal);},
  async save(intent:MutationIntent,csrf:string,signal?:AbortSignal){const input=intent.input;identifier(intent.key);const headers:Record<string,string>={'Content-Type':'application/json','X-CSRF-Token':csrf,'Idempotency-Key':intent.key};let path:string,kind:ContentKind,method='PUT';
   switch(input.operation){case 'profile-create':kind='profile';path=storePath(input.storeId)+'/profile';headers['If-None-Match']='*';break;
    case 'collection-create':kind=input.kind;path=collectionPath(input.storeId,input.kind);method='POST';break;
    case 'item-update':kind=input.kind;path=input.kind==='profile'?storePath(input.storeId)+'/profile':collectionPath(input.storeId,input.kind)+'/'+encodeURIComponent(identifier(input.id));headers['If-Match']=input.etag;break;
    case 'result-create':case 'result-correct':kind='result';path=collectionPath(input.storeId,'event')+'/'+encodeURIComponent(identifier(input.eventId))+'/result';if(input.operation==='result-create')headers['If-None-Match']='*';else headers['If-Match']=input.etag;break;
    default:throw new RetailerApiError('contract');}
   if(headers['If-Match']&&!/^"r[1-9][0-9]*"$/.test(headers['If-Match']))throw new RetailerApiError('contract');
   let body;try{body=validateBody(kind,input.body);}catch{throw new RetailerApiError('invalid');}
   const {value}=await request(path,{method,headers,body:JSON.stringify(body),signal});try{return decodeReceipt(value);}catch{throw new RetailerApiError('contract');}
  }
 };
}
export type RetailerClient=ReturnType<typeof createRetailerClient>;
