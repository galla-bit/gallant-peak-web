import {Link,Navigate} from 'react-router-dom';
import type {RetailerClient} from './api';
import {useRetailerAccess} from './useRetailerAccess';
export const storeRoute=(id:string)=>'/tcg-hunt/verified-stores/'+encodeURIComponent(id);
const navigateToIssuer=(url:string)=>window.location.assign(url);
export function RetailerEntry({client,navigateToProvider=navigateToIssuer}:{client?:RetailerClient;navigateToProvider?:(url:string)=>void}){
 const access=useRetailerAccess(client);
 if(access.status==='ready'&&access.stores.length===1)return <Navigate replace to={storeRoute(access.stores[0].id)}/>;
 return <main id="main-content" tabIndex={-1} className="page"><h1>Retailer access</h1>
 {access.status==='loading'&&<p role="status">Checking retailer session…</p>}
 {access.status==='anonymous'&&<button type="button" onClick={()=>void access.login(navigateToProvider)}>Retailer login</button>}
 {(access.status==='unavailable'||access.status==='logout-unconfirmed')&&<><p role="status">{access.status==='logout-unconfirmed'?'Server logout was not confirmed. Local management state was cleared.':'Retailer management temporarily unavailable.'}</p><button type="button" onClick={()=>void access.refresh()}>Recheck retailer access</button></>}
 {access.status==='ready'&&<><button type="button" onClick={()=>void access.logout()}>Log out</button>{access.stores.length===0?<p role="status">No current retailer access</p>:<><h2>Choose a store to manage</h2><ul>{access.stores.map(store=><li key={store.id}><Link to={storeRoute(store.id)}>{store.name}</Link></li>)}</ul></>}</>}
 <Link to="/tcg-hunt">Back to TCG Hunt</Link>
 </main>;
}
