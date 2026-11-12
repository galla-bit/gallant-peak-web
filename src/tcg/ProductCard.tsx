import {useId, useState} from 'react';
import type {ProductGroup} from './presentation';
import type {TcgAvailability, TcgPublicItem} from './types';

const labels: Record<TcgAvailability, string> = {
  in_stock:'In stock', limited:'Limited', out_of_stock:'Out of stock', unknown:'Unknown',
};
const purchasable=(offer:TcgPublicItem)=>offer.availability==='in_stock'||offer.availability==='limited';

function observedTime(timestamp: string) {
  return <time dateTime={timestamp}>{new Date(timestamp).toLocaleString('en-NZ', {timeZone:'Pacific/Auckland'})} NZ time</time>;
}

function detectedAge(observedAt:string) {
  const minutes=Math.max(0,Math.floor((Date.now()-Date.parse(observedAt))/60000));
  return `Detected ${minutes} minute${minutes===1?'':'s'} ago`;
}

function compareOffers(a:TcgPublicItem,b:TcgPublicItem) {
  const aAvailable=purchasable(a), bAvailable=purchasable(b);
  if(aAvailable!==bAvailable) return aAvailable?-1:1;
  const aPrice=aAvailable&&a.price_nzd!==undefined?Number(a.price_nzd):Infinity;
  const bPrice=bAvailable&&b.price_nzd!==undefined?Number(b.price_nzd):Infinity;
  if(aPrice!==bPrice) return aPrice-bPrice;
  return Date.parse(b.observed_at)-Date.parse(a.observed_at) || a.retailer.localeCompare(b.retailer);
}

export function ProductCard({group}: {group: ProductGroup}) {
  const [expanded, setExpanded] = useState(false);
  const comparisonId = useId();
  const sortedOffers=[...group.offers].sort(compareOffers);
  return <article className="tcg-product-card">
    <div className="tcg-product-summary">
      <p className="eyebrow">{group.game}</p>
      <h3>{group.product}</h3>
      <p className={`tcg-status tcg-status--${group.aggregateAvailability}`}>{labels[group.aggregateAvailability]}</p>
      <p>{group.retailerCount} {group.retailerCount === 1 ? 'retailer' : 'retailers'}</p>
      <p className="tcg-product-price">{group.lowestAvailablePriceNzd !== undefined ? `From NZ$${group.lowestAvailablePriceNzd.toFixed(2)}` : 'No available price supplied'}</p>
      <p className="muted">{detectedAge(group.latestObservedAt)} · Latest offer observed {observedTime(group.latestObservedAt)}</p>
      <p className="muted">Historical retailer observations. Availability and prices may have changed.</p>
      <button type="button" aria-expanded={expanded} aria-controls={comparisonId} onClick={()=>setExpanded(!expanded)}>
        {expanded ? 'Hide' : 'Compare'} retailers for {group.product}
      </button>
    </div>
    <div id={comparisonId} hidden={!expanded}>
      {expanded && <ul className="tcg-retailer-list" aria-label={`Retailer offers for ${group.product}`}>
        {sortedOffers.map((offer, index)=><li className="tcg-retailer-row" key={`${offer.id}-${index}`}>
          <strong>{offer.retailer}</strong>
          <p className={`tcg-status tcg-status--${offer.availability}`}>{labels[offer.availability]}</p>
          <p>{offer.price_nzd !== undefined ? `NZ$${offer.price_nzd}` : 'Price not supplied'}</p>
          <p className="muted">{detectedAge(offer.observed_at)} · Observed {observedTime(offer.observed_at)}</p>
          <a href={offer.retailer_url} target="_blank" rel="noopener noreferrer">View at {offer.retailer}</a>
        </li>)}
      </ul>}
    </div>
  </article>;
}
