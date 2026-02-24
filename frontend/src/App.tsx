import { useEffect, useState } from "react";
import { connectSSE } from "./ws";
import { AssetPanel } from "./components/AssetPanel";
import { Factory3DEnhanced } from "./components/Factory3DEnhanced";

export default function App() {
  const [assets, setAssets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [statusByAsset, setStatusByAsset] = useState<Record<string, any>>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

  useEffect(() => {
    fetch(`${apiBase}/api/assets`).then(r => r.json()).then(setAssets);
  }, [apiBase]);

  useEffect(() => {
    const sse = connectSSE((msg: any) => {
      if (msg.type === "telemetry") {
        const t = msg.data;
        setStatusByAsset(prev => ({ ...prev, [t.assetId]: t }));
      }
      if (msg.type === "alert") {
        setAlerts(prev => [msg.data, ...prev].slice(0, 20));
      }
    });
    return () => {
      sse.close();
    };
  }, []);

  const triggerAlarm = async (payload: { code: string; severity: string; assetId: string; msg: string }) => {
    await fetch(`${apiBase}/api/alarms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const selectedLive = selected ? statusByAsset[selected.id] : null;

  return (
    <div
      style={{
        fontFamily: "inherit",
        padding: "20px 24px 32px",
        display: "grid",
        gridTemplateColumns: "minmax(520px, 1.6fr) minmax(320px, 0.9fr)",
        gap: 20,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Manufacturing Digital Twin
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: 24 }}>Plant Overview</h2>
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: 12, boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)" }}>
          <Factory3DEnhanced
            assets={assets}
            statusByAsset={statusByAsset}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <div style={{ background: "#ffffff", borderRadius: 16, padding: 16, boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)" }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Live Alerts</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button
              onClick={() => triggerAlarm({
                code: "TEMP_DRIFT",
                severity: "MED",
                assetId: "OVEN-01",
                msg: "Oven temperature out of band",
              })}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #f59e0b",
                background: "#fff7ed",
                cursor: "pointer",
              }}
            >
              Trigger Overheat
            </button>
            <button
              onClick={() => triggerAlarm({
                code: "VIB_HIGH",
                severity: "HIGH",
                assetId: "CNC-01",
                msg: "Excessive vibration detected",
              })}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #ef4444",
                background: "#fef2f2",
                cursor: "pointer",
              }}
            >
              Trigger Vibration Alarm
            </button>
            <button
              onClick={() => triggerAlarm({
                code: "ENERGY_SPIKE",
                severity: "MED",
                assetId: "CONV-01",
                msg: "Power consumption spike",
              })}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid #6366f1",
                background: "#eef2ff",
                cursor: "pointer",
              }}
            >
              Trigger Energy Spike
            </button>
          </div>
          <div style={{ maxHeight: 200, overflow: "auto" }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #edf0f5" }}>
                <b>{a.severity}</b> {a.code} — <b>{a.assetId}</b>: {a.msg}
              </div>
            ))}
            {alerts.length === 0 && <div style={{ color: "#6b7280" }}>No alerts yet.</div>}
          </div>
        </div>
      </div>

      <aside
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
          position: "sticky",
          top: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Asset Details</h3>
        <AssetPanel asset={selected} live={selectedLive} />
      </aside>
    </div>
  );
}
