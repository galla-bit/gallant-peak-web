import type {TcgPublicSnapshot} from '../types';

export const publicSnapshotV1Fixture: TcgPublicSnapshot = {
  schema_version: 1,
  generated_at: '2026-10-22T01:50:00Z',
  delayed: true,
  minimum_delay_seconds: 900,
  items: [
    {id:'example-pokemon-1',game:'Pokemon',product:'Example Booster Box',retailer:'Example Cards North',price_nzd:'189.99',availability:'in_stock',observed_at:'2026-10-22T01:35:00Z',retailer_url:'https://example.com/pokemon'},
    {id:'example-one-piece-1',game:'One Piece',product:'Example Display',retailer:'Example Hobby Store',availability:'limited',observed_at:'2026-10-22T01:34:00Z',retailer_url:'https://example.com/one-piece'},
    {id:'example-yugioh-1',game:'Yu-Gi-Oh!',product:'Example Booster Display',retailer:'Example Games NZ',price_nzd:'149.00',availability:'out_of_stock',observed_at:'2026-10-22T01:33:00Z',retailer_url:'https://example.com/yugioh'},
  ],
};
