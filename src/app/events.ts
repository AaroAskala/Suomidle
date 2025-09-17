export type EventSource = 'click' | 'tick' | 'offline' | 'system';

export interface GameEventMap {
  loyly_throw: { amount: number; timestamp: number; source: EventSource };
  click: { amount: number; timestamp: number; source: EventSource };
  population_gain: {
    amount: number;
    timestamp: number;
    source: EventSource;
    currentPopulation: number;
    totalPopulation: number;
  };
  building_bought: {
    buildingId: string;
    amount: number;
    price: number;
    totalOwned: number;
    timestamp: number;
  };
  building_bought_same_type: {
    buildingId: string;
    totalOwned: number;
    timestamp: number;
  };
  technology_bought: {
    techId: string;
    cost: number;
    count: number;
    timestamp: number;
  };
  prestige: {
    timestamp: number;
    newMultiplier: number;
    newPoints: number;
  };
  tier_unlocked: {
    timestamp: number;
    tier: number;
  };
  tick: {
    timestamp: number;
    delta: number;
    source: EventSource;
  };
}

export type GameEventType = keyof GameEventMap;
export type GameEventPayload<K extends GameEventType> = GameEventMap[K];
export type GameEventHandler<K extends GameEventType> = (payload: GameEventPayload<K>) => void;

class EventBus {
  private listeners = new Map<GameEventType, Set<GameEventHandler<GameEventType>>>();

  on<K extends GameEventType>(type: K, handler: GameEventHandler<K>): () => void {
    const existing = this.listeners.get(type) ?? new Set<GameEventHandler<GameEventType>>();
    existing.add(handler as GameEventHandler<GameEventType>);
    this.listeners.set(type, existing);
    return () => this.off(type, handler);
  }

  once<K extends GameEventType>(type: K, handler: GameEventHandler<K>): () => void {
    const wrap: GameEventHandler<K> = (payload) => {
      this.off(type, wrap);
      handler(payload);
    };
    return this.on(type, wrap);
  }

  off<K extends GameEventType>(type: K, handler: GameEventHandler<K>): void {
    const set = this.listeners.get(type);
    if (!set) return;
    set.delete(handler as GameEventHandler<GameEventType>);
    if (set.size === 0) this.listeners.delete(type);
  }

  emit<K extends GameEventType>(type: K, payload: GameEventPayload<K>): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const handler of Array.from(set)) {
      (handler as GameEventHandler<K>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const gameEvents = new EventBus();
