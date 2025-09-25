import { describe, expect, it } from 'vitest';
import { __testMigrateRemovedMaailmaPurchases } from '../app/store';

describe('maailma migration helpers', () => {
  it('refunds removed Maailmankivi purchases and drops them from history', () => {
    const legacy = {
      tuhka: '10',
      purchases: ['maailmankivi', 'tuhkan_viisaus', 'maailmankivi'],
      totalTuhkaEarned: '0',
      totalResets: 0,
      era: 0,
    };

    const migrated = __testMigrateRemovedMaailmaPurchases(legacy);

    expect(migrated).not.toBe(legacy);
    expect(migrated.tuhka).toBe('130');
    expect(migrated.purchases).toEqual(['tuhkan_viisaus']);
    expect(legacy.purchases).toEqual(['maailmankivi', 'tuhkan_viisaus', 'maailmankivi']);
  });

  it('handles invalid Tuhka strings by treating them as zero before refunding', () => {
    const legacy = {
      tuhka: 'not-a-number',
      purchases: ['maailmankivi'],
      totalTuhkaEarned: '0',
      totalResets: 0,
      era: 0,
    };

    const migrated = __testMigrateRemovedMaailmaPurchases(legacy);

    expect(migrated.tuhka).toBe('60');
    expect(migrated.purchases).toEqual([]);
  });

  it('returns the original reference when no removed purchases are present', () => {
    const current = {
      tuhka: '42',
      purchases: ['tuhkan_viisaus'],
      totalTuhkaEarned: '100',
      totalResets: 1,
      era: 0,
    };

    const migrated = __testMigrateRemovedMaailmaPurchases(current);

    expect(migrated).toBe(current);
  });
});
