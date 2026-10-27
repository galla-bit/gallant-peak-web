import {useState, type ReactNode} from 'react';

const views = ['Products', 'New & Upcoming', 'Events', 'Stores'] as const;

export function RadarViews({products,events}: {products: ReactNode; events?:ReactNode}) {
  const [view, setView] = useState<typeof views[number]>('Products');
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
      {view==='Stores' && <p className="notice" role="status">The approved public retailer projection is not connected. Store profiles and monitoring health are not available yet.</p>}
    </div>
  </>;
}
