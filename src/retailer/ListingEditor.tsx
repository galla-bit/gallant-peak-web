import {CollectionEditor} from './CollectionEditor';
import type {EditorProps} from './ContentForm';
export function ListingEditor(props:EditorProps){return <><p>These products stay in your retailer space. Gallant Peak controls global publication to Products, Radar and New & Upcoming.</p><CollectionEditor {...props} kind="listing" label="product" fields={[{key:'name',label:'Name'},{key:'description',label:'Description',multiline:true},{key:'game',label:'Game'},{key:'product_url',label:'Product URL'}]}/></>;}
