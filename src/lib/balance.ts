export interface Generator {
  id: string;
  name: string;
  baseCost: number;
  costMultiplier: number;
  rate: number; // population per second
}

export const balance = {
  generators: [
    { id: 'cursor', name: 'Cursor', baseCost: 10, costMultiplier: 1.15, rate: 0.1 },
    { id: 'grandma', name: 'Grandma', baseCost: 100, costMultiplier: 1.15, rate: 1 },
  ],
  getPrice(gen: Generator, count: number) {
    return gen.baseCost * Math.pow(gen.costMultiplier, count);
  },
};

export default balance;
