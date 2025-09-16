export type TelemetryEvent = string;

export type TelemetryPayload = Record<string, unknown>;

export interface TelemetryClient {
  emit: (event: TelemetryEvent, payload: TelemetryPayload) => void;
}

const fallbackClient: TelemetryClient = {
  emit: () => {},
};

let overrideClient: TelemetryClient | null = null;

const candidateKeys = [
  '__suomidleTelemetry',
  'suomidleTelemetry',
  '__telemetry',
  'telemetry',
] as const;

const isTelemetryClient = (value: unknown): value is TelemetryClient =>
  typeof value === 'object' &&
  value !== null &&
  'emit' in value &&
  typeof (value as { emit?: unknown }).emit === 'function';

const findGlobalTelemetryClient = (): TelemetryClient | null => {
  const globalAny = globalThis as Record<string, unknown>;
  for (const key of candidateKeys) {
    const candidate = globalAny[key];
    if (isTelemetryClient(candidate)) {
      return candidate;
    }
  }
  return null;
};

const resolveClient = (): TelemetryClient =>
  overrideClient ?? findGlobalTelemetryClient() ?? fallbackClient;

export const telemetry = {
  emit(event: TelemetryEvent, payload: TelemetryPayload) {
    try {
      resolveClient().emit(event, payload);
    } catch {
      // Swallow telemetry errors to avoid impacting gameplay.
    }
  },
};

export const setTelemetryClient = (client: TelemetryClient | null) => {
  overrideClient = client;
};
