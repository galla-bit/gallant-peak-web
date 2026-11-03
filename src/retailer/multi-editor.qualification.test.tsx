// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,within,waitFor} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {RetailerWorkspace} from './RetailerWorkspace';
import {testClient,json,session,stores} from './__tests__/http';
afterEach(cleanup);
it('qualifies profile, news, local listing, canonical event/result and access loss through one private workspace',async()=>{
 // Disposable wire responses only: this is not a substitute server/domain.
 const records=new Map<string,Record<string,unknown>>();let access=true,sequence=0;
 const base='/api/retailer/v1/stores/store-a';
 const record=(kind:string,id:string,body:Record<string,unknown>,revision=1)=>{const fields={...body};delete fields.state;delete fields.supersedes_revision;return {schema_version:1,id,retailer_id:'store-a',kind,revision,state:body.state??'PUBLISHED',fields,updated_at:'2026-11-02T00:00:00Z',...(kind==='event'||kind==='result'?{organiser_id:'org-a'}:{}),...(kind==='result'?{event_id:id.split(':')[1]}:{})};};
 records.set(base+'/profile',record('profile','profile-a',{name:'Private profile',description:'Text',source_url:'https://a.test/about',state:'DRAFT'}));
 const {client,fetcher}=testClient((raw,init)=>{
  const path=raw.split('?')[0];if(path==='/auth/session')return json(session);if(path.endsWith('/me/stores'))return json({...stores,stores:access?stores.stores:[]});if(init?.method&&init.method!=='GET'&&!access)return json({},403);
  if(path.includes('/publication/')){const id=path.split('/').at(-1);const row=[...records.values()].find(row=>row.id===id);return json({schema_version:1,id,revision:row?.revision??1,domains:[{domain:path.includes('/result/')?'winners':'retailers',state:'queued'}]});}
  const plural=path.split('/')[6],kind=plural==='listings'?'listing':plural==='events'?'event':'news';
  if(init?.method==='POST'){const id=kind+'-'+(++sequence),row=record(kind,id,JSON.parse(String(init.body)));records.set(path+'/'+id,row);return json({schema_version:1,id,revision:1,publication_status:'queued'},201);}
  if(init?.method==='PUT'){const previous=records.get(path);const currentKind=path.endsWith('/profile')?'profile':path.endsWith('/result')?'result':kind;const eventId=path.split('/').at(-2)!;const id=previous?.id??'result:'+eventId;const revision=Number(previous?.revision??0)+1;const row=record(currentKind,String(id),JSON.parse(String(init.body)),revision);if(currentKind==='result')row.event_id=eventId;records.set(path,row);return json({schema_version:1,id,revision,publication_status:'queued'});}
  const row=records.get(path);if(row)return json(row,200,{ETag:'"r'+row.revision+'"'});
  if(['/news','/listings','/events'].some(suffix=>path.endsWith(suffix)))return json({schema_version:1,items:[...records.entries()].filter(([key])=>key.startsWith(path+'/')&&!key.endsWith('/result')).map(([,value])=>value),next_after_id:null});
  return json({},404);
 });
 render(<RetailerWorkspace client={client}/>);await screen.findByLabelText('Retailer space');fireEvent.change(screen.getByLabelText('Retailer space'),{target:{value:'store-a'}});await screen.findByDisplayValue('Private profile');fireEvent.change(screen.getByLabelText('Name'),{target:{value:'Updated profile'}});fireEvent.click(screen.getByRole('button',{name:'Save profile'}));await screen.findByText(/Saved revision 2/);
 async function create(section:string,label:string,fields:[string,string][]){fireEvent.click(screen.getByRole('button',{name:section}));fireEvent.click(screen.getByRole('button',{name:'Create '+label}));await screen.findByLabelText(fields[0][0]);for(const [name,value] of fields)fireEvent.change(screen.getByLabelText(name),{target:{value}});if(label==='event')fireEvent.change(screen.getByLabelText('State'),{target:{value:'PUBLISHED'}});fireEvent.click(screen.getByRole('button',{name:'Save '+label}));await screen.findByText(/Saved revision 1/);}
 await create('News & Updates','news',[['Title','Local news'],['Body','Community text'],['Source URL','https://a.test/news']]);
 await create('Products','product',[['Name','Local box'],['Description','Local listing'],['Game','Pokemon'],['Product URL','https://a.test/box']]);
 await create('Events & Competitions','event',[['Name','Canonical competition'],['Game','Pokemon'],['Starts at (ISO instant with offset)','2026-10-31T01:00:00Z'],['Timezone (UTC or Pacific/Auckland)','UTC'],['Event URL','https://a.test/event'],['Source URL','https://a.test/event']]);
 fireEvent.click(await screen.findByRole('button',{name:'Results for Canonical competition'}));const result=within(screen.getByRole('region',{name:'Result editor'}));await result.findByLabelText('Winner');for(const [name,value] of [['Winner','Player'],['Completed at (ISO instant with offset)','2026-10-31T05:00:00Z'],['Source URL','https://a.test/result']])fireEvent.change(result.getByLabelText(name),{target:{value}});fireEvent.click(result.getByRole('button',{name:'Save result'}));await result.findByText(/Saved revision 1/);fireEvent.click(await result.findByRole('checkbox',{name:'Confirm correction supersedes revision 1'}));access=false;fireEvent.click(result.getByRole('button',{name:'Save result'}));await screen.findByText(/No authorised retailer spaces/);expect(screen.queryByDisplayValue('Player')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Refresh retailer access'}));await screen.findByText(/No authorised retailer spaces/);access=true;fireEvent.click(screen.getByRole('button',{name:'Refresh retailer access'}));await screen.findByLabelText('Retailer space');expect(screen.queryByDisplayValue('Player')).toBeNull();expect(fetcher.mock.calls.some(([path])=>String(path).includes('promotion'))).toBe(false);expect(screen.queryByRole('button',{name:/publish globally/i})).toBeNull();
});
