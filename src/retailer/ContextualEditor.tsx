import {useState} from 'react';
import {ProfileEditor} from './ProfileEditor';
import {NewsEditor} from './NewsEditor';
import {ListingEditor} from './ListingEditor';
import {EventEditor} from './EventEditor';
import {ResultEditor} from './ResultEditor';
import type {EditorProps} from './ContentForm';
import type {Management} from './contracts';
import {useEditing} from './editing';

export function ContextualEditor(props:EditorProps&{management:Management;onExit:()=>void}){
 const hints=props.management;const runtime=useEditing();
 const sections=[['Overview',hints.profile_write],['Products',hints.products_write],['News & Updates',hints.news_write],['Events & Competitions',hints.events_write||hints.results_write]] as const;
 const [selected,setSelected]=useState('');const [resultEvent,setResultEvent]=useState<string|null>(null);
 const section=sections.find(([name,allowed])=>allowed&&name===selected)?.[0]??sections.find(([,allowed])=>allowed)?.[0];
 return <section aria-label="Contextual store editor"><h2>Edit Store</h2>
 <button type="button" onClick={()=>runtime.leave(props.onExit)}>Exit Edit Store</button>
 <div role="group" aria-label="Edit Store sections">{sections.filter(([,allowed])=>allowed).map(([name])=><button type="button" key={name} aria-pressed={section===name} onClick={()=>{if(name!==section)runtime.leave(()=>{setSelected(name);setResultEvent(null);});}}>{name}</button>)}</div>
 {section==='Overview'&&<ProfileEditor {...props}/>}
 {section==='Products'&&<ListingEditor {...props}/>}
 {section==='News & Updates'&&<NewsEditor {...props}/>}
 {section==='Events & Competitions'&&<>{resultEvent&&hints.results_write?<><button type="button" onClick={()=>runtime.leave(()=>setResultEvent(null))}>Back to canonical events</button><ResultEditor key={resultEvent} {...props} eventId={resultEvent}/></>:<EventEditor {...props} canWrite={hints.events_write} canPublish={hints.events_publish} onSelectResult={hints.results_write?id=>runtime.leave(()=>setResultEvent(id)):undefined}/>}</>}
 </section>;
}
