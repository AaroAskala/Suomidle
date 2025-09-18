export interface Resource {
  id: string;
  name: string;
  icon?: string;
}

export interface BuildingDef {
  id: string;
  name: string;
  icon: string;
  baseCost: number;
  costMult: number;
  baseProd: number;
  description?: string;
  flavor?: string;
  unlock?: {
    tier: number;
  };
}

export interface TechEffect {
  type: 'mult' | 'add';
  target: string;
  value: number;
}

export interface TechDef {
  id: string;
  name: string;
  icon: string;
  cost: number;
  effects: TechEffect[];
  description?: string;
  flavor?: string;
  limit?: number;
  unlock?: {
    tier: number;
  };
}

export interface TierDef {
  name: string;
  tier: number;
  population: number;
}

export interface PrestigeFormula {
  type: 'sqrt';
  k: number;
  multPerPoint: number;
  base: number;
  stacking: 'add';
}

export interface PrestigeDef {
  id: string;
  name: string;
  icon: string;
  minPopulation: number;
  formula: PrestigeFormula;
  description?: string;
  flavor?: string;
}
