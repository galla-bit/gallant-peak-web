import type {RetailerSpace} from './model';
import {authorisedStores} from './model';

/** Public outbound-only directory; never grants verification from collector observations. */
export function validStoreWebsite(value:unknown):value is string {
  if(typeof value!=='string') return false;
  try {
    const url=new URL(value);
    return url.protocol==='https:' && !!url.hostname && url.username==='' && url.password==='' &&
      url.port==='' && url.hash==='' && url.hostname.includes('.') &&
      url.hostname!=='localhost' && !url.hostname.endsWith('.local');
  } catch { return false; }
}

/** Only publish supplied editorial copy; never generate or infer a description. */
export function storeDescription(value:unknown):string|undefined {
  if(typeof value!=='string') return undefined;
  const trimmed=value.trim();
  return trimmed.length>0 && trimmed.length<=240 ? trimmed : undefined;
}

export function VerifiedStoreDirectory({stores=[]}:{stores?:readonly RetailerSpace[]}) {
  const authorised=authorisedStores(stores).filter(store=>validStoreWebsite(store.websiteUrl));
  return <section className="verified-stores">
    <div className="section-head"><div><p className="eyebrow">RETAILER DIRECTORY</p><h2>Verified Stores</h2></div>
      <p>Authorised retailer cards link directly to their official websites. Approved TCG offers appear separately in Radar.</p></div>
    {authorised.length===0?<p className="notice" role="status">No verified store cards have been published yet.</p>:
      <ul className="tcg-product-grid" aria-label="Authorised Verified Stores">{authorised.map(store=><li key={store.id}>
        <article className="tcg-event-card"><h3>{store.name}</h3>{storeDescription(store.description)&&<p>{storeDescription(store.description)}</p>}
          <a href={store.websiteUrl} target="_blank" rel="noopener noreferrer">Visit {store.name} website</a>
        </article></li>)}</ul>}
    <p className="muted">Stock monitoring does not grant Verified Store status. Product availability and checkout must be confirmed on the retailer's website.</p>
  </section>;
}
