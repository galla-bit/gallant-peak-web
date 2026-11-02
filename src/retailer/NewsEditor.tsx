import {CollectionEditor} from './CollectionEditor';
import type {EditorProps} from './ContentForm';
export function NewsEditor(props:EditorProps){return <CollectionEditor {...props} kind="news" label="news" fields={[{key:'title',label:'Title'},{key:'body',label:'Body',multiline:true},{key:'source_url',label:'Source URL'}]}/>;}
