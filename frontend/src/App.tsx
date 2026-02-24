import { useEffect, useState } from "react";
import { connectWS } from "./ws";
import { AssetPanel } from "./components/AssetPanel";
import { Factory3DEnhanced } from "./components/Factory3DEnhanced";

export default function App() {
  const [assets, setAssets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [statusByAsset, setStatusByAsset] = useState<Record<string, any>>({});
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/assets").then(r => r.json()).then(setAssets);
  }, []);

  useEffect(() => {
    const ws = connectWS((msg) => {
      if (msg.type === "telemetry") {
        const t = msg.data;
        setStatusByAsset(prev => ({ ...prev, [t.assetId]: t }));
      }
      if (msg.type === "alert") {
        setAlerts(prev => [msg.data, ...prev].slice(0, 20));
      }
    });
    return () => ws.close();
  }, []);

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
