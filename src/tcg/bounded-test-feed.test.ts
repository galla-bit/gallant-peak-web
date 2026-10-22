import {describe, expect, it} from 'vitest';
import {readFileSync} from 'node:fs';
import {parseTcgPublicSnapshot} from './contract';

describe('bounded synthetic HTTPS test feed artifact', () => {
  it('is schema-valid, explicitly synthetic, and contains no real retailer stock', () => {
    const value = JSON.parse(readFileSync(new URL('../../public/tcg-test-feed.json', import.meta.url), 'utf8'));
    const generatedMs = Date.parse(value.generated_at);
    const result = parseTcgPublicSnapshot(value, generatedMs + 10 * 60 * 1000, 60 * 60 * 1000);

    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot?.items.length).toBeGreaterThan(0);
    for (const item of result.snapshot?.items ?? []) {
      expect(item.product).toMatch(/^SYNTHETIC TEST/);
      expect(item.retailer).toMatch(/^SYNTHETIC TEST/);
      expect(new URL(item.retailer_url).hostname).toBe('example.com');
    }
  });
});
