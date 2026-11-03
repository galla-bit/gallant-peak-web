import {useEffect,useState} from 'react';
import {RetailerApiError,type RetailerClient} from './api';
import type {ContentKind,PublicationDTO} from './contracts';
interface Props {client:RetailerClient;storeId:string;kind:ContentKind;id:string;generation:number;signal:AbortSignal;onDenied:(category:string)=>void}
const labels={queued:'Awaiting processing',acknowledged:'Processing acknowledged',not_required:'No publication work required',unknown:'Processing state unknown'};
export function PublicationStatus(props:Props){
 const {client,storeId,kind,id,generation,signal,onDenied}=props;const [state,setState]=useState<PublicationDTO|null>(null);const [failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;setState(null);setFailed(false);void client.publication(storeId,kind,id,signal).then(dto=>{if(active&&!signal.aborted)setState(dto);}).catch(reason=>{if(!active||signal.aborted)return;setFailed(true);if(reason instanceof RetailerApiError&&(reason.category==='denied'||reason.category==='session-ended'))onDenied(reason.category);});return()=>{active=false;};},[client,storeId,kind,id,generation,signal,onDenied]);
 return <section aria-label="Publication processing"><p>This does not confirm public visibility.</p>{state?<><h4>Publication processing · revision {state.revision}</h4><ul>{state.domains.map(row=><li key={row.domain}>{row.domain}: {labels[row.state]}</li>)}</ul></>:<p role="status">{failed?'Publication processing state is unavailable.':'Checking publication processing…'}</p>}</section>;
}
