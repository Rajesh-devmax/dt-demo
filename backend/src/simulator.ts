type AssetState = "RUNNING" | "IDLE" | "DOWN" | "DEGRADED";

type Telemetry = {
  ts: number;
  assetId: string;
  state: AssetState;
  metrics: {
    tempC?: number;
    vibrationMmS?: number;
    powerKw?: number;
    throughputPph?: number;
    goodCount?: number;
    scrapCount?: number;
    cycleTimeSec?: number;
  };
};

const assets = [
  { id: "CNC-01", kind: "CNC", baseTemp: 55, baseVib: 2.1, basePower: 18 },
  { id: "CNC-02", kind: "CNC", baseTemp: 58, baseVib: 2.2, basePower: 19 },
  { id: "ASM-ROB-01", kind: "ROBOT", baseTemp: 45, baseVib: 1.2, basePower: 6 },
  { id: "OVEN-01", kind: "OVEN", baseTemp: 180, baseVib: 0.6, basePower: 40 },
  { id: "CONV-01", kind: "CONVEYOR", baseTemp: 35, baseVib: 1.0, basePower: 3 },
  { id: "PACK-01", kind: "PACKER", baseTemp: 42, baseVib: 1.5, basePower: 7 },
];

function jitter(x: number, pct: number) {
  const delta = x * pct * (Math.random() * 2 - 1);
  return x + delta;
}

function pickState(prev: AssetState): AssetState {
  const r = Math.random();
  if (prev === "DOWN") return r < 0.7 ? "DOWN" : "IDLE";
  if (r < 0.86) return prev;
  if (r < 0.92) return "IDLE";
  if (r < 0.97) return "DEGRADED";
  return "DOWN";
}

type TelemetryListener = (payload: string) => void;

export function startSimulator(emit: TelemetryListener) {
  const stateByAsset: Record<string, AssetState> = {};
  const drift: Record<string, number> = {};

  // Initialize explicitly so lookups are always defined
  for (const a of assets) {
    stateByAsset[a.id] = "RUNNING";
    drift[a.id] = 0;
    if (a.id === "CONV-01" && Math.random() < 0.9) stateByAsset[a.id] = "RUNNING";
  }

  setInterval(() => {
    for (const a of assets) {
      const prev: AssetState = stateByAsset[a.id] ?? "RUNNING";
      const state: AssetState = pickState(prev);
      stateByAsset[a.id] = state;

      const d0 = drift[a.id] ?? 0;
      const d1 = Math.max(0, Math.min(3, d0 + (state === "DEGRADED" ? 0.02 : -0.01)));
      drift[a.id] = d1;

      const temp =
        a.kind === "OVEN"
          ? jitter(a.baseTemp + d1 * 4, 0.01)
          : jitter(a.baseTemp + d1 * 2, 0.02);

      const vib = jitter(a.baseVib + d1 * 0.8, 0.06);
      const power = jitter(a.basePower + (state === "RUNNING" ? 0 : -a.basePower * 0.5), 0.05);

      const throughput = state === "RUNNING" ? Math.round(jitter(120, 0.15)) : 0;
      const good = state === "RUNNING" ? Math.max(0, Math.round(jitter(8, 0.3))) : 0;
      const scrap =
        state === "DEGRADED"
          ? Math.max(0, Math.round(jitter(2, 0.7)))
          : Math.random() < 0.05
            ? 1
            : 0;

      const cycle = state === "RUNNING" ? jitter(30 + d1 * 2, 0.1) : 0;

      const msg: Telemetry = {
        ts: Date.now(),
        assetId: a.id,
        state,
        metrics: {
          tempC: Number(temp.toFixed(1)),
          vibrationMmS: Number(vib.toFixed(2)),
          powerKw: Number(power.toFixed(1)),
          throughputPph: throughput,
          goodCount: good,
          scrapCount: scrap,
          cycleTimeSec: Number(cycle.toFixed(1)),
        },
      };

      const payload = JSON.stringify({ type: "telemetry", data: msg });
      emit(payload);

      // Alerts
      const alerts: any[] = [];
      if (msg.metrics.vibrationMmS! > 4.5) {
        alerts.push({ severity: "HIGH", code: "VIB_HIGH", assetId: a.id, msg: "Excessive vibration detected" });
      }
      if (a.kind === "OVEN" && (msg.metrics.tempC! < 170 || msg.metrics.tempC! > 190)) {
        alerts.push({ severity: "MED", code: "TEMP_DRIFT", assetId: a.id, msg: "Oven temperature out of band" });
      }
      if (msg.metrics.powerKw! > a.basePower * 1.25) {
        alerts.push({ severity: "MED", code: "ENERGY_SPIKE", assetId: a.id, msg: "Power consumption spike" });
      }

      for (const al of alerts) {
        const ap = JSON.stringify({ type: "alert", data: { ...al, ts: Date.now() } });
        emit(ap);
      }
    }
  }, 1000);
}
