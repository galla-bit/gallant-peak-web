import {useCallback,useEffect,useState} from 'react';
import {ContextualEditor} from '../../retailer/ContextualEditor';
import {EditingProvider,useUnsavedStoreChanges} from '../../retailer/editing';
import type {AccessibleStores} from '../../retailer/contracts';
import type {RetailerClient} from '../../retailer/api';
import type {RetailerSpace} from './model';
import type {TcgEventsFeedResult} from '../events/feed';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {retailerClient,useRetailerAccess} from '../../retailer/useRetailerAccess';
import {RetailerProfile} from './VerifiedStores';
import {authorisedStores} from './model';
import {DEMO_NOW,demonstrationEvents,mythicDeckPreview} from './demonstration';
import {useEventsFeed} from '../events/useEventsFeed';
const noStores:readonly RetailerSpace[]=[];
export function VerifiedStoreRoute({client,stores=noStores,storeId,now,eventsFeed}:{client?:RetailerClient;stores?:readonly RetailerSpace[];storeId?:string;now?:number;eventsFeed?:TcgEventsFeedResult}){
 const params=useParams();const id=storeId??params.storeId??'';
 const navigate=useNavigate();const access=useRetailerAccess(client,id,import.meta.env.VITE_RETAILER_EDITOR_PREVIEW==='true');
 const [editing,setEditing]=useState<{id:string;member:AccessibleStores['stores'][number];csrf:string;controller:AbortController}|null>(null);
 const [expired,setExpired]=useState(false);const guard=useUnsavedStoreChanges();
 useEffect(()=>()=>editing?.controller.abort(),[editing]);
 const close=useCallback(()=>{setEditing(null);setExpired(false);guard.discard();},[guard.discard]);
 useEffect(()=>{if(editing&&editing.id!==id){editing.controller.abort();close();}},[id,editing,close]);
 const onDenied=useCallback((category:string)=>{if(category==='denied')close();else setExpired(true);access.invalidate(category);},[close,access.invalidate]);
 const feed=useEventsFeed(import.meta.env.VITE_TCG_EVENTS_PUBLIC_FEED_URL,eventsFeed,now);
 const demo=id===mythicDeckPreview.id;
 const store=demo?mythicDeckPreview:authorisedStores(stores).find(row=>row.id===id);
 const member=access.status==='ready'&&!demo?access.stores.find(row=>row.id===id):undefined;
 const canEdit=import.meta.env.VITE_RETAILER_EDITOR_PREVIEW==='true'&&member&&Object.values(member.management).some(Boolean);
 const active=editing?.id===id&&!demo?editing:null;
 const sessionChanged=!!active&&access.status==='ready'&&access.csrf!==active.csrf;
 const edit=canEdit&&!active?<button type="button" onClick={()=>{if(member&&access.csrf){setExpired(false);setEditing({id,member,csrf:access.csrf,controller:new AbortController()});}}}>Edit Store</button>:undefined;
 return <main id="main-content" tabIndex={-1} className="page">
 <div aria-label="Retailer session">
 {access.status==='loading'&&<p role="status">Checking retailer session…</p>}
 {access.status==='anonymous'&&<Link to="/retailer">Retailer login</Link>}
 {access.status==='ready'&&<><button type="button" onClick={()=>guard.leave(()=>{close();void access.logout();})}>Log out</button><button type="button" onClick={()=>guard.leave(()=>{close();void access.refresh();})}>Refresh retailer access</button></>}
 {(access.status==='unavailable'||access.status==='logout-unconfirmed')&&<><p role="status">{access.status==='logout-unconfirmed'?'Server logout was not confirmed. Local management state was cleared.':'Retailer management temporarily unavailable.'}</p><button type="button" onClick={()=>guard.leave(()=>{close();void access.refresh();})}>Recheck retailer access</button></>}
 </div>
 {store?<RetailerProfile key={id} store={store} feed={demo?demonstrationEvents:feed} now={demo?DEMO_NOW:now} onBack={()=>guard.leave(()=>navigate('/tcg-hunt',{state:{verifiedStores:true,returnStoreId:id}}))} ownerControl={edit}/>:<>
 <Link to="/tcg-hunt" state={{verifiedStores:true,returnStoreId:id}}>Back to Verified Stores</Link>
 {member?<><p className="eyebrow">RETAILER STORE</p><div className="section-head"><h1>{member.name}</h1>{edit}</div><p role="status">Public store content is not connected.</p></>:<><h1>Verified Store</h1><p role="status">Store content unavailable.</p></>}
 </>}
 {import.meta.env.VITE_RETAILER_EDITOR_PREVIEW==='true'&&active&&(access.status!=='ready'||member)&&<EditingProvider disabled={expired||sessionChanged||access.status!=='ready'} markDirty={guard.markDirty} leave={guard.leave}>
 {(expired||sessionChanged||access.status==='anonymous')&&<p role="alert">Your session ended or changed. Draft values are retained in memory; writes are stopped. <Link to="/retailer">Sign in to resume editing</Link></p>}
 <ContextualEditor client={client??retailerClient} storeId={id} generation={1} csrf={active.csrf} signal={active.controller.signal} onDenied={onDenied} management={member?.management??active.member.management} onExit={close}/>
 </EditingProvider>}
 </main>;
}
