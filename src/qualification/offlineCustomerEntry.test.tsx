// @vitest-environment jsdom
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import contract from '../../tools/qualification/fixtures/customer-runtime-http.json';
import {OfflineCustomerEntry} from '../../tools/qualification/offlineCustomerEntry';
afterEach(cleanup);

it('cannot activate through absent or malformed configuration',()=>{
  const fetcher=vi.fn();
  render(<OfflineCustomerEntry enabled={false} fetcher={fetcher}/>);
  expect(screen.getByRole('status').textContent).toContain('disabled');
  expect(fetcher).not.toHaveBeenCalled();
});

it.each(Object.entries(contract.cases))('renders actual offline-runtime contract: %s',async(name,entries)=>{
  const paths:Record<string,string>={'/api/customer/v1/session':'session','/api/radar/v2/free':'free','/api/radar/v2/member':'member'};
  const fetcher=vi.fn(async(url:RequestInfo|URL)=>{
    const response=(entries as Record<string,{body:unknown;status:number;cache_control:string;vary:string}>)[paths[String(url)]];
    return new Response(JSON.stringify(response.body),{status:response.status,headers:{'Cache-Control':response.cache_control,Vary:response.vary}});
  });
  render(<OfflineCustomerEntry enabled={true} fetcher={fetcher}/>);
  await waitFor(()=>expect(screen.queryByText('Loading isolated Radar')).toBeNull());
  if(name==='anonymous')expect(screen.getByRole('status').textContent).toContain('Sign in');
  if(name==='free'){
    expect(screen.getByText(/Offline booster/)).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    expect(document.body.textContent).not.toContain('Synthetic Shop');
  }
  if(name==='premium')expect(screen.getByRole('link',{name:'Synthetic Shop'}).getAttribute('href')).toBe('https://retailer.invalid/product');
  if(name==='canonical_revoked')expect(screen.queryByText(/Offline booster/)).toBeNull();
});

it('withholds late Premium data after disabling the evaluation',async()=>{
  let finish:(response:Response)=>void=()=>{};
  const fetcher=vi.fn(()=>new Promise<Response>(resolve=>{finish=resolve;}));
  const view=render(<OfflineCustomerEntry enabled={true} fetcher={fetcher}/>);
  view.rerender(<OfflineCustomerEntry enabled={false} fetcher={fetcher}/>);
  finish(new Response(JSON.stringify({authenticated:true,tier:'premium'})));
  await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('disabled'));
  expect(screen.queryByRole('link')).toBeNull();
});
