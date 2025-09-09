export interface UpgradeDef {
  id: string;
  name: string;
  cost: number;
  apply: {
    type: 'add' | 'mult';
    target: 'click' | 'cps';
    value: number;
  };
}

export const upgrades: UpgradeDef[] = [
  {
    id: 'plus1',
    name: 'Plus One',
    cost: 10,
    apply: { type: 'add', target: 'click', value: 1 },
  },
  {
    id: 'double',
    name: 'Double Click',
    cost: 25,
    apply: { type: 'mult', target: 'click', value: 2 },
  },
  {
    id: 'triple',
    name: 'Triple Click',
    cost: 50,
    apply: { type: 'mult', target: 'click', value: 3 },
  },
];

export default upgrades;
