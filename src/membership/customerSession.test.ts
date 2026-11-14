import {describe,it,expect,vi} from 'vitest';
import {loadCustomerSession,VISITOR_SESSION} from './customerSession';

describe('customer session',()=>{
  it('rejects missing endpoint and untrusted cross-origin endpoints',async()=>{
    const fetcher=vi.fn();
    expect(await loadCustomerSession('',fetcher as unknown as typeof fetch)).toEqual(VISITOR_SESSION);
    expect(await loadCustomerSession('https://other.example/session',fetcher as unknown as typeof fetch)).toEqual(VISITOR_SESSION);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('uses server-confirmed tier with cookie credentials and no caching',async()=>{
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({authenticated:true,tier:'premium'})});
    expect(await loadCustomerSession('/api/customer/v1/session',fetcher as unknown as typeof fetch)).toEqual({authenticated:true,tier:'premium'});
    expect(fetcher).toHaveBeenCalledWith('/api/customer/v1/session',{credentials:'include',cache:'no-store',headers:{Accept:'application/json'}});
  });
  it('does not trust invalid or unauthenticated tier payloads',async()=>{
    const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({authenticated:false,tier:'premium'})});
    expect(await loadCustomerSession('/api/customer/v1/session',fetcher as unknown as typeof fetch)).toEqual(VISITOR_SESSION);
  });
});
