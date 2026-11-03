import {useState, type ReactNode} from 'react';
import {VerifiedStores} from './stores/VerifiedStores';

const views = ['Products', 'New & Upcoming', 'Events', 'Verified Stores'] as const;

export function RadarViews({products,events,stores,startStores}: {products: ReactNode; events?:ReactNode; stores?:ReactNode;startStores?:boolean}) {
  const [view, setView] = useState<typeof views[number]>(startStores?'Verified Stores':'Products');
  return <>
    <div className="radar-views" role="group" aria-label="Radar views">
      {views.map(name=><button key={name} type="button" aria-pressed={view===name} onClick={()=>setView(name)}>{name}</button>)}
    </div>
    <div className="radar-view-content" role="region" aria-label={view}>
      {view==='Products' && products}
      {view==='Events' && (events??<p className="notice" role="status">Events and published results are not connected.</p>)}
      {view==='New & Upcoming' && <>
        <p className="notice" role="status">GallantDiscoveries public release intelligence is not connected. Coming soon.</p>
        <p className="muted">Planned lifecycle (reference only): Official announcement → Coming soon → NZ listings discovered → Preorders open → Released → In stock → Restock/price changes.</p>
      </>}
      {view==='Verified Stores' && (stores??<VerifiedStores/>)}
    </div>
  </>;
}
