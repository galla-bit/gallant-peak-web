import {CollectionEditor} from './CollectionEditor';
import type {EditorProps} from './ContentForm';
export function ListingEditor(props:EditorProps){return <><p>Store products belong to your Verified Store. Saving one does not place it in Radar, global Products, New & Upcoming or Releases. Gallant Peak manages broader promotion separately.</p><CollectionEditor {...props} kind="listing" label="product" fields={[{key:'name',label:'Name'},{key:'description',label:'Description',multiline:true},{key:'game',label:'Game'},{key:'product_url',label:'Product URL'}]}/></>;}
