import {useCallback} from 'react';
import {ContentForm,type EditorProps} from './ContentForm';
import {validateBody} from './contracts';
export function ProfileEditor(props:EditorProps){
 const load=useCallback(()=>props.client.getProfile(props.storeId,props.signal),[props.client,props.storeId,props.signal]);
 return <ContentForm {...props} kind="profile" label="Profile" allowMissing load={load} fields={[{key:'name',label:'Name'},{key:'description',label:'Description',multiline:true},{key:'source_url',label:'Source URL'}]} makeInput={(value,baseline)=>baseline?{operation:'item-update',storeId:props.storeId,kind:'profile',id:baseline.record.id,etag:baseline.etag,body:validateBody('profile',value)}:{operation:'profile-create',storeId:props.storeId,body:validateBody('profile',value)}}/>;
}
