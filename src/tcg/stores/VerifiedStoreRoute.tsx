import type {RetailerClient} from '../../retailer/api';
import type {RetailerSpace} from './model';
import type {TcgEventsFeedResult} from '../events/feed';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {useRetailerAccess} from '../../retailer/useRetailerAccess';
import {RetailerProfile} from './VerifiedStores';
import {authorisedStores} from './model';
import {DEMO_NOW,demonstrationEvents,mythicDeckPreview} from './demonstration';
import {useEventsFeed} from '../events/useEventsFeed';
const noStores:readonly RetailerSpace[]=[];
export function VerifiedStoreRoute({client,stores=noStores,storeId,now,eventsFeed}:{client?:RetailerClient;stores?:readonly RetailerSpace[];storeId?:string;now?:number;eventsFeed?:TcgEventsFeedResult}){
 const params=useParams();const id=storeId??params.storeId??'';
 const navigate=useNavigate();const access=useRetailerAccess(client,id);
 const feed=useEventsFeed(import.meta.env.VITE_TCG_EVENTS_PUBLIC_FEED_URL,eventsFeed,now);
 const demo=id===mythicDeckPreview.id;
 const store=demo?mythicDeckPreview:authorisedStores(stores).find(row=>row.id===id);
 const member=access.status==='ready'&&!demo?access.stores.find(row=>row.id===id):undefined;
 const canEdit=member&&Object.values(member.management).some(Boolean);
 const edit=canEdit?<span><button type="button" disabled aria-describedby="editing-milestone">Edit Store</button><small id="editing-milestone">Editing comes in the next milestone.</small></span>:undefined;
 return <main id="main-content" tabIndex={-1} className="page">
 <div aria-label="Retailer session">
 {access.status==='loading'&&<p role="status">Checking retailer session…</p>}
 {access.status==='anonymous'&&<Link to="/retailer">Retailer login</Link>}
 {access.status==='ready'&&<><button type="button" onClick={()=>void access.logout()}>Log out</button><button type="button" onClick={()=>void access.refresh()}>Refresh retailer access</button></>}
 {(access.status==='unavailable'||access.status==='logout-unconfirmed')&&<><p role="status">{access.status==='logout-unconfirmed'?'Server logout was not confirmed. Local management state was cleared.':'Retailer management temporarily unavailable.'}</p><button type="button" onClick={()=>void access.refresh()}>Recheck retailer access</button></>}
 </div>
 {store?<RetailerProfile key={id} store={store} feed={demo?demonstrationEvents:feed} now={demo?DEMO_NOW:now} onBack={()=>navigate('/tcg-hunt',{state:{verifiedStores:true,returnStoreId:id}})} ownerControl={edit}/>:<>
 <Link to="/tcg-hunt" state={{verifiedStores:true,returnStoreId:id}}>Back to Verified Stores</Link>
 {member?<><p className="eyebrow">RETAILER STORE</p><div className="section-head"><h1>{member.name}</h1>{edit}</div><p role="status">Public store content is not connected.</p></>:<><h1>Verified Store</h1><p role="status">Store content unavailable.</p></>}
 </>}
 </main>;
}
