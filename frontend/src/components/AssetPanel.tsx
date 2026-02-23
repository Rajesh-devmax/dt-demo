import React from "react";

export function AssetPanel({ asset, live }: any) {
  if (!asset) return <div style={{ padding: 12 }}>Select an asset on the map.</div>;
  const t = live?.metrics || {};
  const state = live?.state || "—";

  return (
    <div style={{ padding: 12, border: "1px solid #ddd" }}>
      <div style={{ fontWeight: 700 }}>{asset.name} ({asset.id})</div>
      <div style={{ color: "#555" }}>{asset.area}</div>
      <hr />
      <div><b>State:</b> {state}</div>
      <div><b>Temp:</b> {t.tempC ?? "—"} °C</div>
      <div><b>Vibration:</b> {t.vibrationMmS ?? "—"} mm/s</div>
      <div><b>Power:</b> {t.powerKw ?? "—"} kW</div>
      <div><b>Throughput:</b> {t.throughputPph ?? "—"} parts/hr</div>
      <div><b>Cycle time:</b> {t.cycleTimeSec ?? "—"} s</div>
      <div><b>Good/Scrap:</b> {t.goodCount ?? "—"} / {t.scrapCount ?? "—"}</div>
    </div>
  );
}