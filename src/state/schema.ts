export type DecimalString = `${number}`;

export interface MaailmaPurchase {
  /** Identifier of the Maailma shop item. */
  id: string;
  /** Current level purchased for the item. */
  level: number;
}

export interface MaailmaState {
  /** Available Tuhka currency represented as a decimal string. */
  tuhka: DecimalString;
  /** Total Tuhka earned over the lifetime of the save, as a decimal string. */
  totalTuhkaEarned: DecimalString;
  /** Mapping of Maailma purchase id to its purchase details. */
  purchases: Record<string, MaailmaPurchase>;
}

export interface MultipliersState {
  population_cps: number;
}

export interface GameState {
  population: number;
  totalPopulation: number;
  tierLevel: number;
  buildings: Record<string, number>;
  techCounts: Record<string, number>;
  multipliers: MultipliersState;
  cps: number;
  clickPower: number;
  prestigePoints: number;
  prestigeMult: number;
  eraMult: number;
  lastSave: number;
  lastMajorVersion: number;
  eraPromptAcknowledged: boolean;
  maailma: MaailmaState;
}

export interface SaveGame {
  version: number;
  state: GameState;
}
