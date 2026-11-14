// @vitest-environment jsdom
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import contract from '../../tools/qualification/fixtures/customer-radar-http.json';
import {loadQualifiedRadar,QualificationRadar} from '../../tools/qualification/customerRadarProbe';

afterEach(cleanup);
type Exchange={status:number;body:unknown;cache_control:string;vary:string};
const routes:Record<string,string>={'/api/customer/v1/session':'session','/api/radar/v2/free':'free','/api/radar/v2/member':'member'};
function transport(entries:Record<string,Exchange>){
  return vi.fn(async (url:RequestInfo|URL)=>{
    const r=entries[routes[String(url)]];
    if(!r) throw new Error('unexpected qualification request');
    return new Response(JSON.stringify(r.body),{status:r.status,headers:{
      'Content-Type':'application/json','Cache-Control':r.cache_control,'Vary':r.vary}});
  });
}

it.each(Object.entries(contract.cases))('consumes backend mock identity/account/canonical response: %s',async(name,entries)=>{
  const fetcher=transport(entries);
  const result=await loadQualifiedRadar(fetcher);
  render(<QualificationRadar result={result}/>);
  if(['anonymous','unverified_identity','revoked_session','disabled_account'].includes(name)){
    expect(result.status).toBe('denied');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(/Synthetic boundary/)).toBeNull();
  }else{
    expect(result.status).toBe('ready');
    const premium=['premium','revoked_canonical'].includes(name);
    expect(fetcher.mock.calls.map(c=>c[0])).toEqual(['/api/customer/v1/session',premium?'/api/radar/v2/member':'/api/radar/v2/free']);
    expect(fetcher).toHaveBeenLastCalledWith(premium?'/api/radar/v2/member':'/api/radar/v2/free',{
      credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
    if(!premium){
      expect(screen.queryByRole('link')).toBeNull();
      expect(document.body.textContent).not.toContain('Shared display name');
      expect(JSON.stringify(result)).not.toContain('retailers');
      expect(JSON.stringify(result)).not.toContain('retailer_id');
    }
    if(name==='premium') expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    if(name==='revoked_canonical') expect(screen.queryByText(/Synthetic boundary/)).toBeNull();
  }
});

it.each(['premium_payload','extra_identity','unknown_schema','negative_count','unsafe_url','missing_privacy','membership_race'])('withholds untrusted transport mutation: %s',async mutation=>{
  const source=structuredClone(mutation==='unsafe_url'?contract.cases.premium:contract.cases.free);
  const payload=source.free.body as {schema_version:number;items:Record<string,unknown>[]};
  if(mutation==='premium_payload') source.free.body=structuredClone(contract.cases.premium.member.body);
  if(mutation==='extra_identity') payload.items[0].retailer_id='hidden-retailer';
  if(mutation==='unknown_schema') payload.schema_version=99;
  if(mutation==='negative_count') payload.items[0].in_stock_retailer_count=-1;
  if(mutation==='missing_privacy') source.free.cache_control='public';
  if(mutation==='membership_race') source.free.status=403;
  if(mutation==='unsafe_url'){
    const member=source.member.body as {items:{retailers:{url:string}[]}[]};
    member.items.find(i=>i.retailers.length)!.retailers[0].url='javascript:alert(1)';
  }
  const result=await loadQualifiedRadar(transport(source));
  expect(result.status).not.toBe('ready');
  render(<QualificationRadar result={result}/>);
  expect(screen.queryByRole('link')).toBeNull();
  expect(document.body.textContent).not.toContain('Synthetic');
});
