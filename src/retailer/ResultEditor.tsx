import {useCallback} from 'react';
import {ContentForm,type EditorProps} from './ContentForm';
import {validateBody} from './contracts';
export function ResultEditor(props:EditorProps&{eventId:string}){
 const load=useCallback(()=>props.client.getResult(props.storeId,props.eventId,props.signal),[props.client,props.storeId,props.eventId,props.signal]);
 return <><h4>Result for canonical event {props.eventId}</h4><p>Owner publication is an organiser result source under Gallant policy. It does not confer a current Verified Store badge.</p><ContentForm key={props.eventId} {...props} kind="result" label="Result" allowMissing confirmCorrection load={load} fields={[{key:'event_at',label:'Completed at (ISO instant with offset)'},{key:'winner',label:'Winner'},{key:'source_url',label:'Source URL'},{key:'deck_archetype',label:'Deck archetype',optional:true}]} makeInput={(value,baseline)=>baseline?{operation:'result-correct',storeId:props.storeId,eventId:props.eventId,etag:baseline.etag,body:validateBody('result',value)}:{operation:'result-create',storeId:props.storeId,eventId:props.eventId,body:validateBody('result',value)}}/></>;
}
