import {describe, expect, it} from 'vitest';
import {parseTcgPublicSnapshot} from '../contract';
import {publicSnapshotV1Fixture} from './public-snapshot-v1';

describe('public TCG snapshot fixture', () => {
  it('is delayed v1 example data that validates without rejected records', () => {
    expect(publicSnapshotV1Fixture.schema_version).toBe(1);
    expect(publicSnapshotV1Fixture.delayed).toBe(true);
    expect(publicSnapshotV1Fixture.minimum_delay_seconds).toBe(900);
    expect(publicSnapshotV1Fixture.items.map(item => item.game)).toEqual(expect.arrayContaining(['Pokemon', 'One Piece', 'Yu-Gi-Oh!']));
    expect(publicSnapshotV1Fixture.items.every(item => item.retailer_url.startsWith('https://'))).toBe(true);
    const result = parseTcgPublicSnapshot(publicSnapshotV1Fixture, Date.parse('2026-10-22T02:00:00Z'), 60 * 60 * 1000);
    expect(result.snapshot).not.toBeNull();
    expect(result.rejectedItems).toBe(0);
  });

  it('contains no internal or security fields', () => {
    const serialized = JSON.stringify(publicSnapshotV1Fixture).toLowerCase();
    for (const forbidden of ['token', 'cookie', 'password', 'webhook', 'watch_id', 'scheduler', 'audit_log']) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
