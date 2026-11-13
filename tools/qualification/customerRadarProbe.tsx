/** Test-only v2 consumer. Never imported by App or a production route. */
import {loadCustomerSession} from '../../src/membership/customerSession';

type Offer={name:string;url:string;observed_at:string;availability:'in_stock'};
type Item={game:string;product:string;in_stock_retailer_count:number;retailers?:Offer[]};
export type ProbeResult={status:'denied'|'unavailable'}|{status:'ready';tier:'free'|'premium';items:Item[]};
function object(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function keys(value:Record<string,unknown>,allowed:string[]){return Object.keys(value).sort().join('|')===[...allowed].sort().join('|');}
function text(value:unknown):value is string{return typeof value==='string'&&value.trim().length>0;}
function offer(value:unknown):value is Offer{
  if(!object(value)||!keys(value,['name','url','observed_at','availability'])||!text(value.name)||!text(value.url)
    ||!text(value.observed_at)||!Number.isFinite(Date.parse(value.observed_at))||value.availability!=='in_stock')return false;
  try{const url=new URL(value.url);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
function items(payload:unknown,premium:boolean):Item[]|null{
  if(!object(payload)||!keys(payload,['schema_version','items'])||payload.schema_version!==2||!Array.isArray(payload.items))return null;
  for(const item of payload.items){
    if(!object(item)||!keys(item,premium?['game','product','in_stock_retailer_count','retailers']:['game','product','in_stock_retailer_count'])
      ||!text(item.game)||!text(item.product)||!Number.isSafeInteger(item.in_stock_retailer_count)||Number(item.in_stock_retailer_count)<0)return null;
    if(premium&&(!Array.isArray(item.retailers)||!item.retailers.every(offer)||item.retailers.length!==item.in_stock_retailer_count))return null;
  }
  return payload.items as Item[];
}
export async function loadQualifiedRadar(fetcher:typeof fetch):Promise<ProbeResult>{
  const session=await loadCustomerSession('/api/customer/v1/session',fetcher);
  if(!session.authenticated||session.tier==='visitor')return {status:'denied'};
  try{
    const response=await fetcher(session.tier==='premium'?'/api/radar/v2/member':'/api/radar/v2/free',{
      credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
    if(!response.ok)return {status:response.status===401||response.status===403?'denied':'unavailable'};
    if(response.headers.get('cache-control')!=='private, no-store'||!response.headers.get('vary')?.toLowerCase().split(',').map(s=>s.trim()).includes('cookie'))return {status:'unavailable'};
    const parsed=items(await response.json(),session.tier==='premium');
    return parsed?{status:'ready',tier:session.tier,items:parsed}:{status:'unavailable'};
  }catch{return {status:'unavailable'};}
}
export function QualificationRadar({result}:{result:ProbeResult}){
  if(result.status!=='ready')return <p role="status">{result.status==='denied'?'Sign in required':'Radar unavailable'}</p>;
  return <section aria-label="Qualification Radar"><ul>{result.items.map((item,i)=><li key={i}>
    {item.product}: {item.in_stock_retailer_count}
    {result.tier==='premium'&&item.retailers?.map((r,n)=><a key={n} href={r.url}>{r.name}</a>)}
  </li>)}</ul></section>;
}
