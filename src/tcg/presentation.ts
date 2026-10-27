import type {TcgAvailability, TcgPublicItem} from './types';

export interface ProductGroup {
  key: string;
  game: string;
  product: string;
  offers: TcgPublicItem[];
  retailerCount: number;
  aggregateAvailability: TcgAvailability;
  lowestAvailablePriceNzd?: number;
  latestObservedAt: string;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function groupTcgItems(items: TcgPublicItem[]): ProductGroup[] {
  const groups = new Map<string, TcgPublicItem[]>();
  for (const item of items) {
    const key = JSON.stringify([normalize(item.game), normalize(item.product)]);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return [...groups].map(([key, offers]) => {
    const precedence: TcgAvailability[] = ['in_stock', 'limited', 'unknown', 'out_of_stock'];
    const prices = offers.filter(offer =>
      (offer.availability === 'in_stock' || offer.availability === 'limited') && offer.price_nzd !== undefined,
    ).map(offer => Number(offer.price_nzd));
    return {
      key, game:offers[0].game, product:offers[0].product, offers,
      retailerCount:new Set(offers.map(offer=>offer.retailer)).size,
      aggregateAvailability:precedence.find(state=>offers.some(offer=>offer.availability===state))!,
      lowestAvailablePriceNzd:prices.length ? prices.reduce((lowest, price)=>Math.min(lowest, price)) : undefined,
      latestObservedAt:offers.reduce((latest, offer)=>
        Date.parse(offer.observed_at)>Date.parse(latest) ? offer.observed_at : latest, offers[0].observed_at),
    };
  });
}

export function filterProductGroups(groups: ProductGroup[], filters: {game: string; availability: string}): ProductGroup[] {
  return groups.filter(group =>
    (filters.game === 'all' || group.game === filters.game) &&
    (filters.availability === 'all' || group.offers.some(offer=>offer.availability===filters.availability)),
  );
}
