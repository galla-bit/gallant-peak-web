export type TcgAvailability = 'in_stock' | 'limited' | 'out_of_stock' | 'unknown';

export interface TcgPublicItem {
  id: string;
  game: string;
  product: string;
  retailer: string;
  price_nzd?: string;
  availability: TcgAvailability;
  observed_at: string;
  retailer_url: string;
}

export interface TcgPublicSnapshot {
  schema_version: 1;
  generated_at: string;
  delayed: true;
  minimum_delay_seconds: 900;
  items: TcgPublicItem[];
}
