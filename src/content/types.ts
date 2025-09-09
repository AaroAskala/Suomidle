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
  unlock?: {
    tier: number;
  };
}

export interface TierDef {
  name: string;
  tier: number;
  population: number;
}
