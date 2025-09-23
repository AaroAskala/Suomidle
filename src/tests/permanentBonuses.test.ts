import { describe, it, expect } from 'vitest';
import { applyPermanentBonuses } from '../effects/applyPermanentBonuses';

describe('applyPermanentBonuses', () => {
  it('aggregates permanent bonuses from record purchases', () => {
    const save = {
      maailma: {
        purchases: {
          tuhkan_viisaus: { id: 'tuhkan_viisaus', level: 2 },
          ikuiset_hiillokset: { id: 'ikuiset_hiillokset', level: 3 },
          feeniks_sauna: { id: 'feeniks_sauna', level: 1 },
          maailmankivi: { id: 'maailmankivi', level: 1 },
          tyhjyys_tehokkuus: { id: 'tyhjyys_tehokkuus', level: 10 },
          kosminen_karsivallisyys: { id: 'kosminen_karsivallisyys', level: 2 },
          tuhkan_infuusio: { id: 'tuhkan_infuusio', level: 3 },
          alkulampo: { id: 'alkulampo', level: 3 },
          kuolematon_saunan_henki: { id: 'kuolematon_saunan_henki', level: 1 },
          tuhkan_riimu: { id: 'tuhkan_riimu', level: 4 },
        },
      },
    } satisfies Parameters<typeof applyPermanentBonuses>[0];

    const bonuses = applyPermanentBonuses(save);

    expect(save.modifiers?.permanent).toEqual(bonuses);
    expect(bonuses.techMultiplierBonusAdd).toBeCloseTo(0.4, 6);
    expect(bonuses.baseProdMult).toBeCloseTo(1.3 ** 3, 6);
    expect(bonuses.saunaPrestigeBaseMultiplierMin).toBeCloseTo(2);
    expect(bonuses.tierUnlockOffset).toBe(-1);
    expect(bonuses.buildingCostMultiplier.delta).toBeCloseTo(-0.05, 6);
    expect(bonuses.buildingCostMultiplier.floor).toBeCloseTo(1.1, 6);
    expect(bonuses.offlineProdMult).toBeCloseTo(1 + 0.5 * 2, 6);
    expect(bonuses.lampotilaRateMult).toBeCloseTo(1 + 0.05 * 3, 6);
    expect(bonuses.perTierGlobalCpsAdd['7']).toBeCloseTo(0.3, 6);
    expect(bonuses.keepTechOnSaunaReset).toBe(true);
    expect(bonuses.globalCpsAddPerTuhkaSpent).toBeCloseTo(0.005 * 4, 10);
    expect(bonuses.totalTuhkaSpent).toBe(668);
    expect(bonuses.globalCpsAddFromTuhkaSpent).toBeCloseTo(0.005 * 4 * 668, 6);
  });

  it('handles array-style purchase tracking', () => {
    const save = {
      maailma: {
        purchases: [
          'tuhkan_viisaus',
          'tuhkan_viisaus',
          'tuhkan_viisaus',
          'tuhkan_riimu',
          'tuhkan_riimu',
        ],
      },
    } satisfies Parameters<typeof applyPermanentBonuses>[0];

    const bonuses = applyPermanentBonuses(save);

    expect(bonuses.techMultiplierBonusAdd).toBeCloseTo(0.2 * 3, 6);
    expect(bonuses.globalCpsAddPerTuhkaSpent).toBeCloseTo(0.005 * 2, 10);
    const expectedSpent = 5 + 8 + 12 + 8 + 12; // first three levels of viisaus, two of riimu
    expect(bonuses.totalTuhkaSpent).toBe(expectedSpent);
    expect(bonuses.globalCpsAddFromTuhkaSpent).toBeCloseTo(expectedSpent * 0.005 * 2, 6);
  });
});
