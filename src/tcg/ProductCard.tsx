import {useId, useState} from 'react';
import type {ProductGroup} from './presentation';
import type {TcgAvailability} from './types';

const labels: Record<TcgAvailability, string> = {
  in_stock:'In stock', limited:'Limited', out_of_stock:'Out of stock', unknown:'Unknown',
};

function observedTime(timestamp: string) {
  return <time dateTime={timestamp}>{new Date(timestamp).toLocaleString('en-NZ', {timeZone:'Pacific/Auckland'})} NZ time</time>;
}

export function ProductCard({group}: {group: ProductGroup}) {
  const [expanded, setExpanded] = useState(false);
  const comparisonId = useId();
  return <article className="tcg-product-card">
    <div className="tcg-product-summary">
      <p className="eyebrow">{group.game}</p>
      <h3>{group.product}</h3>
      <p className={`tcg-status tcg-status--${group.aggregateAvailability}`}>{labels[group.aggregateAvailability]}</p>
      <p>{group.retailerCount} {group.retailerCount === 1 ? 'retailer' : 'retailers'}</p>
      <p>{group.lowestAvailablePriceNzd !== undefined ? `From NZ$${group.lowestAvailablePriceNzd.toFixed(2)}` : 'No available price supplied'}</p>
      <p className="muted">Latest offer observed {observedTime(group.latestObservedAt)}</p>
      <button type="button" aria-expanded={expanded} aria-controls={comparisonId} onClick={()=>setExpanded(!expanded)}>
        {expanded ? 'Hide' : 'Compare'} retailers for {group.product}
      </button>
    </div>
    <div id={comparisonId} hidden={!expanded}>
      {expanded && <ul className="tcg-retailer-list" aria-label={`Retailer offers for ${group.product}`}>
        {group.offers.map((offer, index)=><li className="tcg-retailer-row" key={`${offer.id}-${index}`}>
          <strong>{offer.retailer}</strong>
          <p className={`tcg-status tcg-status--${offer.availability}`}>{labels[offer.availability]}</p>
          <p>{offer.price_nzd !== undefined ? `NZ$${offer.price_nzd}` : 'Price not supplied'}</p>
          <p className="muted">Observed {observedTime(offer.observed_at)}</p>
          <a href={offer.retailer_url} target="_blank" rel="noreferrer">View at {offer.retailer}</a>
        </li>)}
      </ul>}
    </div>
  </article>;
}
