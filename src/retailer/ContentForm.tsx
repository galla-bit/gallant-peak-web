import {PublicationStatus} from './PublicationStatus';
import {useCallback,useEffect,useRef,useState} from 'react';
import {RetailerApiError,type RetailerClient} from './api';
import {validateBody,type ContentKind,type ContentDTO,type MutationInput,type SavedReceipt,type Versioned} from './contracts';
import {createMutationWorkflow} from './mutations';
export interface EditorProps {client:RetailerClient;storeId:string;generation:number;csrf:string;signal:AbortSignal;onDenied:(category:string)=>void}
export interface Field {key:string;label:string;multiline?:boolean;optional?:boolean}
export const errorCopy:Record<string,string>={
 'session-ended':'Your session ended. Private content was cleared.',denied:'This operation is not authorised for your current access.',
 'not-found':'This record is unavailable.',conflict:'This operation conflicts with current content. Compare your input with a fresh record.',
 precondition:'The record changed since it was loaded. Reload current content to compare; your input has not been overwritten.',
 invalid:'Check the plain-text fields, required values and supported URLs.',limited:'Too many requests. Wait before explicitly retrying.',
 unavailable:'Save or load could not be confirmed. No public visibility is implied.',contract:'The API response could not be validated.'};
interface FormProps extends EditorProps {kind:ContentKind;label:string;fields:Field[];load:()=>Promise<Versioned>;makeInput:(body:unknown,baseline:Versioned|null)=>MutationInput;allowMissing?:boolean;confirmCorrection?:boolean;onSaved?:(receipt:SavedReceipt)=>void}
export function ContentForm(props:FormProps){
 const {client,generation,signal,onDenied,load}=props;const [baseline,setBaseline]=useState<Versioned|null|undefined>();const [values,setValues]=useState<Record<string,string>>({});const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [receipt,setReceipt]=useState<SavedReceipt>();const [compare,setCompare]=useState<Versioned>();const [retryAt,setRetryAt]=useState(0);const [clock,setClock]=useState(Date.now());const [confirmed,setConfirmed]=useState(false);
 const workflow=useRef(createMutationWorkflow(client,generation));const alive=useRef(true);const alert=useRef<HTMLParagraphElement>(null);
 const fill=(record:ContentDTO)=>setValues({...Object.fromEntries(Object.entries(record.fields).filter(([,v])=>v!==null).map(([k,v])=>[k,String(v)])),...(props.kind==='result'?{}:{state:record.state})});
 const fail=useCallback((reason:unknown)=>{if(!alive.current||signal.aborted)return;const e=reason instanceof RetailerApiError?reason:new RetailerApiError('unavailable');setError(e.category);setRetryAt(e.retryAt??0);if(e.category==='denied'||e.category==='session-ended')onDenied(e.category);},[onDenied,signal]);
 useEffect(()=>{alive.current=true;workflow.current=createMutationWorkflow(client,generation);let current=true;void load().then(value=>{if(!current||signal.aborted)return;setBaseline(value);fill(value.record);}).catch(reason=>{if(!current||signal.aborted)return;if(reason instanceof RetailerApiError&&reason.category==='not-found'&&props.allowMissing){setBaseline(null);setValues(props.kind==='result'?{}:{state:'DRAFT'});}else fail(reason);});return()=>{current=false;alive.current=false;workflow.current.dispose();};},[load,signal,fail,props.allowMissing,props.kind]);
 useEffect(()=>{if(error)alert.current?.focus();},[error]);
 useEffect(()=>{if(!retryAt||retryAt<=Date.now())return;const timeout=setTimeout(()=>setClock(Date.now()),Math.min(retryAt-Date.now(),2147483647));return()=>clearTimeout(timeout);},[retryAt,clock]);
 const uncertain=!!workflow.current.intent&&['unavailable','limited','contract'].includes(error);
 async function save(retry=false){if(busy||signal.aborted||Date.now()<retryAt)return;try{
  if(!retry){const body:Record<string,unknown>={...values};for(const field of props.fields)if(field.optional&&!body[field.key])delete body[field.key];if(props.kind==='result'&&baseline){if(!confirmed)throw new RetailerApiError('invalid');body.supersedes_revision=baseline.record.revision;}try{validateBody(props.kind,body);}catch{throw new RetailerApiError('invalid');}workflow.current.prepare(props.makeInput(body,baseline??null));}
  setBusy(true);setError('');const saved=await workflow.current.submit(props.csrf,signal);if(!alive.current||signal.aborted)return;setReceipt(saved);workflow.current.discard();setBaseline(undefined);if(props.onSaved){props.onSaved(saved);return;}
  try{const latest=await load();if(!alive.current||signal.aborted)return;setBaseline(latest);fill(latest.record);setConfirmed(false);}catch(reason){fail(reason);}
 }catch(reason){fail(reason);}finally{if(alive.current&&!signal.aborted)setBusy(false);}}
 async function reload(){setError('');try{const latest=await load();if(alive.current&&!signal.aborted)setCompare(latest);}catch(reason){fail(reason);}}
 return <section aria-label={`${props.label} editor`}>
 {baseline===undefined&&!receipt&&!error&&<p role="status">Loading {props.label.toLowerCase()}…</p>}
 {error&&<p role="alert" ref={alert} tabIndex={-1}>{errorCopy[error]??errorCopy.unavailable}</p>}
 {receipt&&<p role="status">Saved revision {receipt.revision}. {receipt.publication_status==='queued'?'Awaiting publication processing.':'No publication work was required.'} This does not confirm public visibility.</p>}
 {receipt&&baseline===undefined&&<p>Current baseline is unknown. Reload before another update.</p>}
 {(baseline!==undefined||receipt)&&<form onSubmit={event=>{event.preventDefault();void save();}}>
 {props.fields.map(field=><label key={field.key}>{field.label}{field.multiline?<textarea value={values[field.key]??''} disabled={busy||uncertain} onChange={event=>setValues(old=>({...old,[field.key]:event.target.value}))}/>:<input value={values[field.key]??''} disabled={busy||uncertain} onChange={event=>setValues(old=>({...old,[field.key]:event.target.value}))}/>}</label>)}
 {props.kind!=='result'&&<label>State<select value={values.state??'DRAFT'} disabled={busy||uncertain} onChange={event=>setValues(old=>({...old,state:event.target.value}))}>{(props.kind==='event'?['DRAFT','PUBLISHED','CANCELLED']:['DRAFT','PUBLISHED','WITHDRAWN']).map(state=><option key={state}>{state}</option>)}</select></label>}
 {props.confirmCorrection&&baseline&&<label><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>Confirm correction supersedes revision {baseline.record.revision}</label>}
 <button type="submit" disabled={busy||baseline===undefined||uncertain||!!(props.confirmCorrection&&baseline&&!confirmed)}>Save {props.label.toLowerCase()}</button></form>}
 {uncertain&&<button type="button" disabled={busy||Date.now()<retryAt} onClick={()=>void save(true)}>Retry exact save</button>}
 {(error||receipt&&baseline===undefined)&&!uncertain&&<button type="button" onClick={()=>void reload()}>Reload current content to compare</button>}
 {compare&&<section aria-label="Current server content"><h4>Current server content · revision {compare.record.revision}</h4>{Object.entries(compare.record.fields).map(([name,value])=><p key={name}>{name}: {String(value)}</p>)}<button type="button" onClick={()=>{fill(compare.record);setBaseline(compare);setConfirmed(false);setCompare(undefined);setError('');workflow.current.discard();}}>Use current server content</button></section>}
 {(baseline||receipt)&&<PublicationStatus key={baseline?.record.revision??receipt?.revision} client={client} storeId={props.storeId} kind={props.kind} id={baseline?.record.id??receipt!.id} generation={generation} signal={signal} onDenied={onDenied}/>} </section>;
}
