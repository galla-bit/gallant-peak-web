import type {TcgAvailability, TcgPublicItem, TcgPublicSnapshot} from './types';

const AVAILABILITY = new Set<TcgAvailability>(['in_stock', 'limited', 'out_of_stock', 'unknown']);
const PRICE = /^\d+(?:\.\d{1,2})?$/;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function httpsUrl(value: unknown): value is string {
  if (!nonEmpty(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function parseItem(value: unknown): TcgPublicItem | null {
  if (!record(value)) return null;
  if (!nonEmpty(value.id) || !nonEmpty(value.game) || !nonEmpty(value.product) || !nonEmpty(value.retailer)) return null;
  if (!AVAILABILITY.has(value.availability as TcgAvailability)) return null;
  if (!validDate(value.observed_at) || !httpsUrl(value.retailer_url)) return null;
  if (value.price_nzd !== undefined && (typeof value.price_nzd !== 'string' || !PRICE.test(value.price_nzd))) return null;

  return {
    id: value.id,
    game: value.game,
    product: value.product,
    retailer: value.retailer,
    ...(value.price_nzd === undefined ? {} : {price_nzd: value.price_nzd}),
    availability: value.availability as TcgAvailability,
    observed_at: value.observed_at,
    retailer_url: value.retailer_url,
  };
}

export function parseTcgPublicSnapshot(
  value: unknown,
  nowMs: number,
  maxAgeMs: number,
): {snapshot: TcgPublicSnapshot | null; rejectedItems: number; reason?: string} {
  if (!record(value) || value.schema_version !== 1) return {snapshot: null, rejectedItems: 0, reason: 'unsupported-schema'};
  if (!validDate(value.generated_at)) return {snapshot: null, rejectedItems: 0, reason: 'invalid-generated-at'};

  const generatedMs = Date.parse(value.generated_at);
  if (generatedMs > nowMs) return {snapshot: null, rejectedItems: 0, reason: 'future-generated-at'};
  if (nowMs - generatedMs > maxAgeMs) return {snapshot: null, rejectedItems: 0, reason: 'stale'};
  if (value.delayed !== true || !Array.isArray(value.items)) return {snapshot: null, rejectedItems: 0, reason: 'invalid-snapshot'};

  const items: TcgPublicItem[] = [];
  let rejectedItems = 0;
  for (const candidate of value.items) {
    const item = parseItem(candidate);
    if (item) items.push(item);
    else rejectedItems += 1;
  }

  return {snapshot: {schema_version: 1, generated_at: value.generated_at, delayed: true, items}, rejectedItems};
}
