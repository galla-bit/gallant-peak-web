/** Server-authoritative membership session. No localStorage tier or client override. */
export type CustomerTier='visitor'|'free'|'premium';
export type CustomerSession={tier:CustomerTier;authenticated:boolean};
export const VISITOR_SESSION:CustomerSession={tier:'visitor',authenticated:false};

export async function loadCustomerSession(endpoint:string,fetcher:typeof fetch=fetch):Promise<CustomerSession>{
  if(!endpoint || !endpoint.startsWith('/') || endpoint.startsWith('//')) return VISITOR_SESSION;
  try{
    const response=await fetcher(endpoint,{credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
    if(!response.ok) return VISITOR_SESSION;
    const payload:unknown=await response.json();
    if(!payload || typeof payload!=='object') return VISITOR_SESSION;
    const record=payload as Record<string,unknown>;
    if(record.authenticated!==true || (record.tier!=='free' && record.tier!=='premium')) return VISITOR_SESSION;
    return {authenticated:true,tier:record.tier};
  }catch{return VISITOR_SESSION;}
}
