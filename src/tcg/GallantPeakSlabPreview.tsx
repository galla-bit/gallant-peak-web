import {useState} from 'react';
import inventory from '../../data/drafts/gallant-peak-pcg-slabs.json';
import photoManifest from '../../data/drafts/gallant-peak-pcg-photo-manifest.json';

const photosById = new Map(photoManifest.items.map(photos => [photos.id, photos]));
const photoUrls = import.meta.glob<string>('./slab-photos/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** Owner-only review fixture. Never mount in production without the explicit preview flag. */
export function GallantPeakSlabPreview(){
  const [selected,setSelected]=useState('all');
  const items=inventory.items.filter(item=>selected==='all'||String(item.grade)===selected);
  return <section aria-label="Gallant Peak graded card draft preview">
    <div className="notice" role="status"><strong>DRAFT PREVIEW — NOT FOR SALE</strong><br/>Gallant Peak first-party inventory. Prices are approved. Checkout is disabled.</div>
    <div className="section-head"><div><p className="eyebrow">GALLANT PEAK INVENTORY</p><h2>GRADED POKÉMON CARDS</h2></div><p>Individual PCG slabs · NZD</p></div>
    <div className="tcg-filters"><label>PCG grade<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="all">All grades</option>{[7,8,9,9.5].map(grade=><option key={grade} value={grade}>{grade}</option>)}</select></label></div>
    <ul className="tcg-product-grid" aria-label="Gallant Peak graded cards">
      {items.map(item=><li key={item.id}><article className="placeholder" style={{height:'100%'}}>
        <span>Sold by Gallant Peak · PCG {item.grade}</span>
        <h3>{item.name}</h3>
        <p>{item.set} · {item.card_number}</p>
        <p><strong>NZ${item.price_nzd.toFixed(2)}</strong> · Available · 1 slab</p>
        <p>Certificate: <code>{item.certificate_number}</code></p>
        <div className="tcg-slab-photos">
          {(['front', 'back'] as const).map(side => {
            const file = photosById.get(item.id)?.[side];
            const url = file && photoUrls[`./slab-photos/${file}`];
            return url && <figure key={side}>
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.name} slab ${side} photo`}>
                <img src={url} alt={`${item.name} slab ${side}`} loading="lazy" />
              </a>
              <figcaption>{side === 'front' ? 'Front' : 'Back'}</figcaption>
            </figure>;
          })}
        </div>
        {item.certificate_verified && item.verification_url ?
          <a href={item.verification_url} target="_blank" rel="noopener noreferrer" aria-label={`View PCG Grading Report for ${item.name}`}>View PCG Grading Report ↗</a> : <>
            <p><small>PCG report verification pending.</small></p>
            <a href="https://pcgpopreport.com/" target="_blank" rel="noopener noreferrer" aria-label={`Open official PCG certificate search for ${item.name}`}>Search official PCG certificates ↗</a>
          </>}
      </article></li>)}
    </ul>
  </section>;
}
