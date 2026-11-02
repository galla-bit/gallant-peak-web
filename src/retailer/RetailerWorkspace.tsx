import {NewsEditor} from './NewsEditor';
import {ListingEditor} from './ListingEditor';
import {ProfileEditor} from './ProfileEditor';
import {useEffect,useRef,useState} from 'react';
import {createRetailerClient,type RetailerClient} from './api';
import {useRetailerSession} from './session';
const defaultClient=createRetailerClient();
const sections=['Overview','News & Updates','Products','Events & Competitions'] as const;
export function RetailerWorkspace({client=defaultClient}:{client?:RetailerClient}){
 const session=useRetailerSession(client);const [section,setSection]=useState<typeof sections[number]>('Overview');const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();setSection('Overview');},[session.generation]);
 const store=session.stores.find(row=>row.id===session.selectedStoreId);
 return <main id="main-content" tabIndex={-1} className="page retailer-editor"><p className="eyebrow">PRIVATE RETAILER EDITOR PREVIEW</p><h1 ref={heading} tabIndex={-1}>Retailer workspace</h1><p className="notice">Contract preview only. Real sign-in and retailer onboarding are not connected.</p>
 {session.status==='loading'&&<p role="status">Checking retailer session…</p>}
 {session.status==='anonymous'&&<p role="status">Sign-in is not connected in this preview. No account access is being simulated.</p>}
 {session.status==='session-ended'&&<p role="alert">Your session ended. Private editor data has been cleared.</p>}
 {session.status==='logout-unconfirmed'&&<p role="alert">Server logout was not confirmed. Local editor data was cleared; your server session may still exist.</p>}
 {session.status==='error'&&<p role="alert">The retailer session is unavailable.</p>}
 {session.status!=='loading'&&session.status!=='ready'&&<button type="button" onClick={()=>void session.recheck()}>Recheck session</button>}
 {session.status==='ready'&&<><button type="button" onClick={()=>void session.logout()}>Log out</button>{session.stores.length===0?<p role="status">No authorised retailer spaces are assigned to this account.</p>:<label>Retailer space<select value={session.selectedStoreId??''} onChange={event=>session.selectStore(event.target.value)}><option value="" disabled>Select a retailer</option>{session.stores.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>}
 {store&&<section key={session.generation} aria-label="Private retailer content"><h2>{store.name}</h2><div role="group" aria-label="Retailer editor sections">{sections.map(name=><button type="button" key={name} aria-pressed={section===name} onClick={()=>setSection(name)}>{name}</button>)}</div><h3>{section}</h3><p>Private retailer content is separate from public feed publication.</p>{section==='News & Updates'&&<NewsEditor client={client} storeId={store.id} generation={session.generation} csrf={session.csrf!} signal={session.signalForGeneration()} onDenied={session.onDenied}/>}{section==='Products'&&<ListingEditor client={client} storeId={store.id} generation={session.generation} csrf={session.csrf!} signal={session.signalForGeneration()} onDenied={session.onDenied}/>}{section==='Overview'&&<ProfileEditor client={client} storeId={store.id} generation={session.generation} csrf={session.csrf!} signal={session.signalForGeneration()} onDenied={session.onDenied}/>}</section>}</>}
 </main>;
}
