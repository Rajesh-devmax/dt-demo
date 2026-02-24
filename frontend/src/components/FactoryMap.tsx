export function FactoryMap({ assets, statusByAsset, selected, onSelect }: any) {
  return (
    <svg width="700" height="380" style={{ border: "1px solid #ddd", background: "#fafafa" }}>
      {/* Areas */}
      <rect x="40" y="60" width="260" height="160" fill="#fff" stroke="#ccc" />
      <text x="50" y="80" fontSize="12">CNC Cell</text>

      <rect x="320" y="60" width="320" height="140" fill="#fff" stroke="#ccc" />
      <text x="330" y="80" fontSize="12">Paint / Assembly</text>

      <rect x="320" y="220" width="320" height="120" fill="#fff" stroke="#ccc" />
      <text x="330" y="240" fontSize="12">Packaging</text>

      {/* Assets */}
      {assets.map((a: any) => {
        const s = statusByAsset[a.id]?.state || "IDLE";
        const color =
          s === "RUNNING" ? "#2ecc71" :
          s === "DEGRADED" ? "#f1c40f" :
          s === "DOWN" ? "#e74c3c" : "#3498db";

        const isSel = selected?.id === a.id;

        return (
          <g key={a.id} onClick={() => onSelect(a)} style={{ cursor: "pointer" }}>
            <circle cx={a.x} cy={a.y} r={14} fill={color} stroke={isSel ? "#111" : "#666"} strokeWidth={isSel ? 3 : 1} />
            <text x={a.x + 18} y={a.y + 4} fontSize="11">{a.id}</text>
          </g>
        );
      })}
    </svg>
  );
}