import {ResultEditor} from './ResultEditor';
import {EventEditor} from './EventEditor';
import {NewsEditor} from './NewsEditor';
import {ListingEditor} from './ListingEditor';
import {ProfileEditor} from './ProfileEditor';
import {useEffect,useRef,useState} from 'react';
import {createRetailerClient,type RetailerClient} from './api';
import {useRetailerSession} from './session';
import type {EditorProps} from './ContentForm';
const defaultClient=createRetailerClient();
const sections=['Overview','News & Updates','Products','Events & Competitions'] as const;
/** A new generation destroys all section and canonical-selection state. */
function StoreContent(props:EditorProps&{name:string}){
 const [section,setSection]=useState<typeof sections[number]>('Overview');
 const [resultEvent,setResultEvent]=useState<string|null>(null);
 return <section aria-label="Private retailer content"><h2>{props.name}</h2>
 <div role="group" aria-label="Retailer editor sections">{sections.map(name=><button type="button" key={name} aria-pressed={section===name} onClick={()=>{setSection(name);setResultEvent(null);}}>{name}</button>)}</div>
 <h3>{section}</h3><p>Private retailer content is separate from public feed publication.</p>
 {section==='Overview'&&<ProfileEditor {...props}/>}
 {section==='News & Updates'&&<NewsEditor {...props}/>}
 {section==='Products'&&<ListingEditor {...props}/>}
 {section==='Events & Competitions'&&<>{resultEvent&&<ResultEditor key={resultEvent} {...props} eventId={resultEvent}/>}<EventEditor {...props} onSelectResult={setResultEvent}/></>}
 </section>;
}
export function RetailerWorkspace({client=defaultClient}:{client?:RetailerClient}){
 const session=useRetailerSession(client);const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();},[session.generation]);
 const store=session.stores.find(row=>row.id===session.selectedStoreId);
 return <main id="main-content" tabIndex={-1} className="page retailer-editor"><p className="eyebrow">PRIVATE RETAILER EDITOR PREVIEW</p><h1 ref={heading} tabIndex={-1}>Retailer workspace</h1><p className="notice">Contract preview only. Real sign-in and retailer onboarding are not connected.</p>
 {session.status==='loading'&&<p role="status">Checking retailer session…</p>}
 {session.status==='anonymous'&&<p role="status">Sign-in is not connected in this preview. No account access is being simulated.</p>}
 {session.status==='session-ended'&&<p role="alert">Your session ended. Private editor data has been cleared.</p>}
 {session.status==='logout-unconfirmed'&&<p role="alert">Server logout was not confirmed. Local editor data was cleared; your server session may still exist.</p>}
 {session.status==='error'&&<p role="alert">The retailer session is unavailable.</p>}
 {session.status!=='loading'&&session.status!=='ready'&&<button type="button" onClick={()=>void session.recheck()}>Recheck session</button>}
 {session.status==='ready'&&<>
 <button type="button" onClick={()=>void session.logout()}>Log out</button><button type="button" onClick={()=>void session.recheck()}>Refresh retailer access</button>
 {session.stores.length===0?<p role="status">No authorised retailer spaces are assigned to this account.</p>:<label>Retailer space<select value={session.selectedStoreId??''} onChange={event=>session.selectStore(event.target.value)}><option value="" disabled>Select a retailer</option>{session.stores.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>}
 {store&&<StoreContent key={session.generation} name={store.name} client={client} storeId={store.id} generation={session.generation} csrf={session.csrf!} signal={session.signalForGeneration()} onDenied={session.onDenied}/>}
 </>}
 </main>;
}
