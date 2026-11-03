import {useEditing} from './editing';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ContentForm,errorCopy,type EditorProps,type Field} from './ContentForm';
import {RetailerApiError} from './api';
import {validateBody,type CollectionKind,type ContentDTO,type SavedReceipt} from './contracts';
interface Props extends EditorProps {kind:CollectionKind;label:string;fields:Field[];onSelectResult?:(eventId:string)=>void;canWrite?:boolean;allowedStates?:string[]}
export function CollectionEditor(props:Props){
 const runtime=useEditing();
 const {client,storeId,kind,signal,onDenied}=props;const [items,setItems]=useState<ContentDTO[]>([]);const [next,setNext]=useState<string|null>(null);const [loaded,setLoaded]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [selection,setSelection]=useState<string|null>(null);const [receipt,setReceipt]=useState<SavedReceipt>();const alive=useRef(true);const pending=useRef(false);
 const loadPage=useCallback(async(afterId?:string)=>{if(pending.current)return;pending.current=true;setBusy(true);setError('');try{const page=await client.list(storeId,kind,{limit:50,afterId},signal);if(!alive.current||signal.aborted)return;setItems(old=>afterId?[...old,...page.items.filter(item=>!old.some(row=>row.id===item.id))]:page.items);setNext(page.next_after_id);setLoaded(true);}catch(reason){if(!alive.current||signal.aborted)return;const category=reason instanceof RetailerApiError?reason.category:'unavailable';setError(category);if(category==='denied'||category==='session-ended')onDenied(category);}finally{pending.current=false;if(alive.current&&!signal.aborted)setBusy(false);}},[client,storeId,kind,signal,onDenied]);
 useEffect(()=>{alive.current=true;void loadPage();return()=>{alive.current=false;};},[loadPage]);
 const load=useCallback(()=>selection==='new'?Promise.reject(new RetailerApiError('not-found')):client.get(storeId,kind,selection!,signal),[client,storeId,kind,selection,signal]);
 return <section aria-label={`${props.label} management`}><button type="button" hidden={props.canWrite===false} disabled={runtime.disabled} onClick={()=>{if(selection!=='new')runtime.leave(()=>{setSelection('new');setReceipt(undefined);});}}>Create {props.label}</button>
 {error&&<p role="alert">{errorCopy[error]}</p>}{busy&&<p role="status">Loading {props.label}…</p>}
 <ul aria-label={`Own ${props.label}`}>{items.map(row=><li key={row.id}><button type="button" hidden={props.canWrite===false} disabled={runtime.disabled} onClick={()=>{if(selection!==row.id)runtime.leave(()=>{setSelection(row.id);setReceipt(undefined);});}}>Edit {String((row.fields as Record<string,unknown>).title??(row.fields as Record<string,unknown>).name)}</button> <span>{row.state}</span>{kind==='event'&&props.onSelectResult&&<button type="button" disabled={runtime.disabled} onClick={()=>props.onSelectResult!(row.id)}>Results for {String((row.fields as Record<string,unknown>).name)}</button>}</li>)}</ul>
 {next?<button type="button" disabled={busy} onClick={()=>void loadPage(next)}>Load more {props.label}</button>:loaded&&<p>All loaded {props.label} shown.</p>}
 {error&&<button type="button" disabled={busy} onClick={()=>void loadPage()}>Retry loading {props.label}</button>}
 {receipt&&<p role="status">Saved revision {receipt.revision}. Public visibility is not confirmed.</p>}
 {selection&&<ContentForm key={selection} {...props} kind={kind} label={props.label} allowMissing={selection==='new'} load={load} fields={props.fields} onSaved={selection==='new'?saved=>{setReceipt(saved);setSelection(saved.id);void loadPage();}:undefined} makeInput={(value,baseline)=>{const body=validateBody(kind,value);return baseline?{operation:'item-update',storeId,kind,id:baseline.record.id,etag:baseline.etag,body}:{operation:'collection-create',storeId,kind,body};}}/>}
 </section>;
}
