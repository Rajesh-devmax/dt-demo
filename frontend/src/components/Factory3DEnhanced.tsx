import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

type Asset = { id: string; name: string; area: string; x: number; y: number };
type Props = {
  assets: Asset[];
  statusByAsset: Record<string, any>;
  selected: Asset | null;
  onSelect: (a: Asset | null) => void;
};

type AssetState = "RUNNING" | "IDLE" | "DOWN" | "DEGRADED";

function stateColor(state: AssetState | string) {
  switch (state) {
    case "RUNNING": return "#2ecc71";
    case "DEGRADED": return "#f1c40f";
    case "DOWN": return "#e74c3c";
    case "IDLE": return "#3498db";
    default: return "#95a5a6";
  }
}

// Map your existing 2D coordinates (x,y) into 3D world (x,z)
function toWorld(x: number, y: number) {
  const scale = 0.02;
  return new THREE.Vector3((x - 350) * scale, 0, (y - 190) * scale);
}

type PresetKey = "overview" | "cnc" | "packaging" | "paint";

const CAMERA_PRESETS: Record<PresetKey, { position: [number, number, number]; target: [number, number, number] }> = {
  overview:   { position: [6.0, 6.0, 7.0], target: [0.0, 0.0, 0.0] },
  cnc:        { position: [-6.0, 3.5, -3.2], target: [-3.2, 0.0, -1.2] },
  packaging:  { position: [6.2, 3.5, 3.8], target: [3.0, 0.0, 2.1] },
  paint:      { position: [6.0, 3.2, -3.6], target: [3.0, 0.0, -1.5] },
};

/** Smooth camera move to a preset */
function CameraRig({ preset }: { preset: PresetKey }) {
  const { camera } = useThree();
  const controls = useThree((s) => (s as any).controls) as any;

  const targetPos = useMemo(() => new THREE.Vector3(...CAMERA_PRESETS[preset].position), [preset]);
  const targetLook = useMemo(() => new THREE.Vector3(...CAMERA_PRESETS[preset].target), [preset]);

  useFrame(() => {
    // lerp camera
    camera.position.lerp(targetPos, 0.06);

    // lerp orbit target if controls exist
    if (controls?.target) {
      controls.target.lerp(targetLook, 0.08);
      controls.update?.();
    } else {
      camera.lookAt(targetLook);
    }
  });

  return null;
}

function ZoneLabel({ pos, label }: { pos: [number, number, number]; label: string }) {
  return (
    <Html position={pos} distanceFactor={10}>
      <div style={{ fontSize: 12, padding: "2px 6px", background: "rgba(255,255,255,0.85)", border: "1px solid #ddd" }}>
        <b>{label}</b>
      </div>
    </Html>
  );
}

function CNCUnitCell() {
  return (
    <group>
      {/* base pad */}
      <mesh position={[-3.2, 0.04, -1.2]} receiveShadow>
        <boxGeometry args={[5.2, 0.08, 3.2]} />
        <meshStandardMaterial color="#e9edf2" />
      </mesh>

      {/* CNC machines */}
      {Array.from({ length: 3 }).map((_, i) => (
        <group key={`cnc-${i}`} position={[-4.4 + i * 1.7, 0.2, -1.7]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.5, 0.7]} />
            <meshStandardMaterial color="#7f8c8d" />
          </mesh>
          <mesh position={[0.35, 0.1, 0]} castShadow>
            <boxGeometry args={[0.2, 0.2, 0.45]} />
            <meshStandardMaterial color="#b0bec5" />
          </mesh>
          <mesh position={[-0.2, 0.28, 0.0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.35, 16]} />
            <meshStandardMaterial color="#616161" />
          </mesh>
        </group>
      ))}

      {/* robot arm */}
      <group position={[-2.6, 0.2, -0.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.25, 16]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
        <mesh position={[0.18, 0.42, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
          <boxGeometry args={[0.35, 0.08, 0.08]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
      </group>

      <ZoneLabel pos={[-3.2, 0.6, -1.2]} label="CNC Cell" />
    </group>
  );
}

function PaintAssemblyLine() {
  return (
    <group>
      {/* base pad */}
      <mesh position={[3.0, 0.04, -1.5]} receiveShadow>
        <boxGeometry args={[6.2, 0.08, 2.8]} />
        <meshStandardMaterial color="#eef1f5" />
      </mesh>

      {/* oven tunnel */}
      <group position={[1.8, 0.35, -1.6]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.7, 0.9]} />
          <meshStandardMaterial color="#d35400" />
        </mesh>
        <mesh position={[0, 0.1, 0.46]}>
          <boxGeometry args={[1.2, 0.4, 0.08]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>
      </group>

      {/* paint booth */}
      <group position={[3.6, 0.3, -1.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.6, 0.9]} />
          <meshStandardMaterial color="#5dade2" />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[1.3, 0.08, 0.8]} />
          <meshStandardMaterial color="#a9cce3" />
        </mesh>
      </group>

      {/* conveyor */}
      <group position={[3.0, 0.18, -0.6]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.12, 0.35]} />
          <meshStandardMaterial color="#95a5a6" />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={`paint-roller-${i}`} position={[-1.4 + i * 0.46, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
            <meshStandardMaterial color="#616a6b" />
          </mesh>
        ))}
      </group>

      <ZoneLabel pos={[3.0, 0.65, -1.5]} label="Paint / Assembly" />
    </group>
  );
}

function PackagingLine() {
  return (
    <group>
      {/* base pad */}
      <mesh position={[3.0, 0.04, 2.1]} receiveShadow>
        <boxGeometry args={[6.2, 0.08, 2.6]} />
        <meshStandardMaterial color="#eef1f5" />
      </mesh>

      {/* packaging station */}
      <group position={[2.0, 0.28, 2.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.55, 0.8]} />
          <meshStandardMaterial color="#7dcea0" />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[1.0, 0.08, 0.7]} />
          <meshStandardMaterial color="#abebc6" />
        </mesh>
      </group>

      {/* pallets */}
      {Array.from({ length: 2 }).map((_, i) => (
        <group key={`pack-pallet-${i}`} position={[4.2 + i * 1.0, 0.12, 2.2]}>
          <mesh>
            <boxGeometry args={[0.7, 0.1, 0.7]} />
            <meshStandardMaterial color="#9c6b3d" />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.6, 0.18, 0.6]} />
            <meshStandardMaterial color="#d8d1c3" />
          </mesh>
        </group>
      ))}

      {/* outbound conveyor */}
      <group position={[3.1, 0.18, 1.4]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.12, 0.35]} />
          <meshStandardMaterial color="#95a5a6" />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={`pack-roller-${i}`} position={[-1.5 + i * 0.5, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.4, 12]} />
            <meshStandardMaterial color="#616a6b" />
          </mesh>
        ))}
      </group>

      <ZoneLabel pos={[3.0, 0.65, 2.1]} label="Packaging" />
    </group>
  );
}

function FactoryShell() {
  const columns = Array.from({ length: 4 }).map((_, i) => -4.2 + i * 2.8);
  const rows = Array.from({ length: 3 }).map((_, i) => -2.6 + i * 2.6);

  return (
    <group>
      {/* perimeter base */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[19.2, 0.04, 11.2]} />
        <meshStandardMaterial color="#dfe6ed" />
      </mesh>

      {/* columns */}
      {columns.map((x) =>
        rows.map((z) => (
          <mesh key={`col-${x}-${z}`} position={[x, 0.9, z]} castShadow>
            <boxGeometry args={[0.18, 1.8, 0.18]} />
            <meshStandardMaterial color="#c7cdd6" />
          </mesh>
        ))
      )}

      {/* overhead beams */}
      {rows.map((z) => (
        <mesh key={`beam-${z}`} position={[0, 1.86, z]} castShadow>
          <boxGeometry args={[18.4, 0.12, 0.16]} />
          <meshStandardMaterial color="#b7bec8" />
        </mesh>
      ))}

      {/* skylight strip */}
      <mesh position={[0, 2.04, 0]}>
        <boxGeometry args={[17.2, 0.06, 1.8]} />
        <meshStandardMaterial color="#edf4ff" emissive="#f5f9ff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function OverheadLights() {
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => (
        <group key={`light-${i}`} position={[-6 + i * 3, 1.7, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.08, 0.32]} />
            <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.6} />
          </mesh>
          <pointLight intensity={0.35} distance={6} position={[0, -0.25, 0]} color="#ffffff" />
        </group>
      ))}
    </group>
  );
}

function PipeRun() {
  return (
    <group>
      <mesh position={[-3.6, 1.45, -3.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 6.5, 16]} />
        <meshStandardMaterial color="#9fb0c3" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[-0.2, 1.45, -3.6]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 7.0, 16]} />
        <meshStandardMaterial color="#9fb0c3" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[3.2, 1.45, -3.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 6.0, 16]} />
        <meshStandardMaterial color="#9fb0c3" metalness={0.4} roughness={0.35} />
      </mesh>
    </group>
  );
}

function PalletStacks() {
  return (
    <group>
      {Array.from({ length: 3 }).map((_, i) => (
        <group key={`pallet-${i}`} position={[2.4 + i * 0.7, 0.08, 3.2]}>
          <mesh>
            <boxGeometry args={[0.6, 0.08, 0.6]} />
            <meshStandardMaterial color="#9c6b3d" />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.55, 0.18, 0.55]} />
            <meshStandardMaterial color="#c9c2b0" />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <boxGeometry args={[0.5, 0.16, 0.5]} />
            <meshStandardMaterial color="#d8d1c3" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SafetyRails() {
  return (
    <group>
      <mesh position={[3.0, 0.2, 0.8]}>
        <boxGeometry args={[5.8, 0.08, 0.08]} />
        <meshStandardMaterial color="#f4b400" />
      </mesh>
      <mesh position={[3.0, 0.35, 0.8]}>
        <boxGeometry args={[5.8, 0.05, 0.05]} />
        <meshStandardMaterial color="#f4b400" />
      </mesh>
      <mesh position={[-2.6, 0.2, -2.2]}>
        <boxGeometry args={[4.2, 0.08, 0.08]} />
        <meshStandardMaterial color="#f4b400" />
      </mesh>
      <mesh position={[-2.6, 0.35, -2.2]}>
        <boxGeometry args={[4.2, 0.05, 0.05]} />
        <meshStandardMaterial color="#f4b400" />
      </mesh>
    </group>
  );
}

function FloorDetails() {
  return (
    <group>
      {/* walkway */}
      <mesh position={[-5.2, 0.03, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.03, 10.6]} />
        <meshStandardMaterial color="#e1e5eb" />
      </mesh>
      {/* floor stripes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`stripe-${i}`} position={[1.4 + i * 1.2, 0.03, -0.9]}>
          <boxGeometry args={[0.8, 0.02, 0.08]} />
          <meshStandardMaterial color="#f0c419" />
        </mesh>
      ))}
    </group>
  );
}

/** A moving part box that cycles along a conveyor direction */
function MovingParts({
  running,
  length = 1.2,
  count = 4,
  speed = 0.35,
  direction = "x",
}: {
  running: boolean;
  length?: number;
  count?: number;
  speed?: number;
  direction?: "x" | "z";
}) {
  const group = useRef<THREE.Group>(null!);
  const offsets = useMemo(() => Array.from({ length: count }, (_, i) => i / count), [count]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      // base phase per item, animate with time
      const p = (offsets[i] + (running ? t * speed : 0)) % 1; // 0..1
      const pos = (p - 0.5) * length; // -L/2..L/2
      if (direction === "x") child.position.set(pos, 0.12, 0);
      else child.position.set(0, 0.12, pos);
      (child as THREE.Mesh).visible = running; // only show when running
    });
  });

  return (
    <group ref={group}>
      {offsets.map((_, i) => (
        <mesh key={i} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.10]} />
          <meshStandardMaterial color="#8e5a2b" />
        </mesh>
      ))}
    </group>
  );
}

/** Conveyor with animated rollers + moving parts */
function Conveyor({
  id,
  live,
  selected,
  onSelect,
  position,
  rotationY = 0,
}: {
  id: string;
  live: any;
  selected: boolean;
  onSelect: () => void;
  position: [number, number, number];
  rotationY?: number;
}) {
  const state: AssetState = live?.state ?? "IDLE";
  const running = state === "RUNNING";
  const color = stateColor(state);

  const rollers = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (!rollers.current) return;
    // spin rollers only when running
    const spin = running ? delta * 6 : delta * 0.5;
    rollers.current.children.forEach((m) => (m.rotation.x += spin));
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* belt */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.12, 0.35]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.08} />
      </mesh>

      {/* rollers */}
      <group ref={rollers}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh
            key={i}
            position={[-0.5 + i * 0.2, 0.0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.04, 0.04, 0.38, 12]} />
            <meshStandardMaterial color="#666" metalness={0.4} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* moving parts on top */}
      <MovingParts running={running} direction="x" />

      {selected && (
        <mesh>
          <boxGeometry args={[1.3, 0.22, 0.45]} />
          <meshStandardMaterial color="#111" wireframe />
        </mesh>
      )}

      <Html position={[0, 0.45, 0]} distanceFactor={9}>
        <div style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #ddd", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
          <b>{id}</b>
        </div>
      </Html>
    </group>
  );
}

function GenericMachine({ asset, live, selected, onSelect }: { asset: Asset; live: any; selected: boolean; onSelect: () => void }) {
  const state: AssetState = live?.state ?? "IDLE";
  const color = stateColor(state);

  const pos = useMemo(() => {
    const v = toWorld(asset.x, asset.y);
    return [v.x, 0.18, v.z] as [number, number, number];
  }, [asset.x, asset.y]);

  const isCNC = asset.id.startsWith("CNC");
  const isRobot = asset.id.includes("ROB");
  const isOven = asset.id.includes("OVEN");
  const isPacker = asset.id.includes("PACK");

  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Base body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[isOven ? 0.9 : 0.55, 0.35, 0.45]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} />
      </mesh>

      {/* Extra details */}
      {isCNC && (
        <mesh position={[0.2, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.25, 16]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      )}

      {isRobot && (
        <>
          <mesh position={[0, 0.26, 0]} castShadow>
            <boxGeometry args={[0.08, 0.35, 0.08]} />
            <meshStandardMaterial color="#777" />
          </mesh>
          <mesh position={[0.14, 0.38, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
            <boxGeometry args={[0.25, 0.06, 0.06]} />
            <meshStandardMaterial color="#777" />
          </mesh>
        </>
      )}

      {isPacker && (
        <mesh position={[0, 0.25, 0.23]} castShadow>
          <boxGeometry args={[0.30, 0.18, 0.05]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      )}

      {selected && (
        <mesh>
          <boxGeometry args={[isOven ? 1.0 : 0.62, 0.42, 0.52]} />
          <meshStandardMaterial color="#111" wireframe />
        </mesh>
      )}

      <Html position={[0, 0.5, 0]} distanceFactor={9}>
        <div style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #ddd", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
          <b>{asset.id}</b>
        </div>
      </Html>
    </group>
  );
}

/** Small overlay minimap rendered in DOM, not in 3D */
function MiniMap({
  assets,
  statusByAsset,
  selected,
  onSelect,
}: {
  assets: Asset[];
  statusByAsset: Record<string, any>;
  selected: Asset | null;
  onSelect: (a: Asset) => void;
}) {
  // Determine bounds from current asset coordinates
  const xs = assets.map(a => a.x);
  const ys = assets.map(a => a.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 700);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 380);

  const W = 220, H = 140;
  const pad = 10;

  function mapX(x: number) {
    return pad + ((x - minX) / (maxX - minX || 1)) * (W - pad * 2);
  }
  function mapY(y: number) {
    return pad + ((y - minY) / (maxY - minY || 1)) * (H - pad * 2);
  }

  return (
    <div style={{
      position: "absolute",
      right: 12,
      bottom: 12,
      width: W,
      height: H,
      background: "rgba(255,255,255,0.92)",
      border: "1px solid #ddd",
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
    }}>
      <div style={{ padding: "6px 8px", borderBottom: "1px solid #eee", fontSize: 12 }}>
        <b>Mini-map</b> (click an asset)
      </div>
      <svg width={W} height={H - 30} style={{ display: "block" }}>
        {/* zones (rough) */}
        <rect x="18" y="18" width="85" height="60" fill="#fafafa" stroke="#e2e2e2" />
        <rect x="110" y="18" width="95" height="52" fill="#fafafa" stroke="#e2e2e2" />
        <rect x="110" y="75" width="95" height="45" fill="#fafafa" stroke="#e2e2e2" />

        {assets.map(a => {
          const s = statusByAsset[a.id]?.state ?? "IDLE";
          const fill = stateColor(s);
          const isSel = selected?.id === a.id;
          return (
            <g key={a.id} onClick={() => onSelect(a)} style={{ cursor: "pointer" }}>
              <circle cx={mapX(a.x)} cy={mapY(a.y)} r={isSel ? 5 : 4} fill={fill} stroke={isSel ? "#111" : "#666"} strokeWidth={isSel ? 2 : 1} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PresetBar({ preset, setPreset }: { preset: PresetKey; setPreset: (p: PresetKey) => void }) {
  const btn = (key: PresetKey, label: string) => (
    <button
      onClick={() => setPreset(key)}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: key === preset ? "2px solid #111" : "1px solid #ddd",
        background: key === preset ? "#f3f3f3" : "#fff",
        cursor: "pointer"
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <div style={{ fontWeight: 700 }}>Camera:</div>
      {btn("overview", "Plant Overview")}
      {btn("cnc", "CNC Cell")}
      {btn("paint", "Paint / Oven")}
      {btn("packaging", "Packaging Line")}
    </div>
  );
}

export function Factory3DEnhanced({ assets, statusByAsset, selected, onSelect }: Props) {
  const [preset, setPreset] = useState<PresetKey>("overview");

  // Keep preset sensible when selecting an asset (optional “auto” behavior)
  useEffect(() => {
    if (!selected) return;
    if (selected.area.toLowerCase().includes("cnc")) setPreset("cnc");
    else if (selected.area.toLowerCase().includes("paint") || selected.id.includes("OVEN")) setPreset("paint");
    else if (selected.area.toLowerCase().includes("pack")) setPreset("packaging");
  }, [selected]);

  return (
    <div style={{ position: "relative" }}>
      <PresetBar preset={preset} setPreset={setPreset} />

      <div
        style={{
          height: "70vh",
          minHeight: 520,
          border: "1px solid #e5e7eb",
          background: "#fff",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Canvas
          shadows
          camera={{ position: [6, 6, 7], fov: 45 }}
          onPointerMissed={() => onSelect(null)}
          onCreated={(state) => {
            // attach controls reference for CameraRig
            (state as any).controls = null;
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[6, 10, 4]} intensity={1.0} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <directionalLight position={[-6, 6, -4]} intensity={0.35} color="#dbe7ff" />
          <pointLight position={[0, 3.4, 0]} intensity={0.35} distance={18} color="#ffffff" />

          {/* floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[20, 12]} />
            <meshStandardMaterial color="#f4f5f7" />
          </mesh>

          {/* building shell + infrastructure */}
          <FactoryShell />
          <OverheadLights />
          <PipeRun />
          <FloorDetails />
          <SafetyRails />
          <PalletStacks />

          {/* realistic unit zones */}
          <CNCUnitCell />
          <PaintAssemblyLine />
          <PackagingLine />

          {/* assets */}
          {assets.map(a => {
            const live = statusByAsset[a.id];
            const isSelected = selected?.id === a.id;

            // Use special conveyor renderer for CONV-01 (you can extend to more)
            if (a.id.includes("CONV")) {
              const p = toWorld(a.x, a.y);
              return (
                <Conveyor
                  key={a.id}
                  id={a.id}
                  live={live}
                  selected={isSelected}
                  onSelect={() => onSelect(a)}
                  position={[p.x, 0.18, p.z]}
                  rotationY={0}
                />
              );
            }

            return (
              <GenericMachine
                key={a.id}
                asset={a}
                live={live}
                selected={isSelected}
                onSelect={() => onSelect(a)}
              />
            );
          })}

          {/* Better way to expose controls to CameraRig: create a controls component */}
          <ControlsAndRig preset={preset} />

        </Canvas>

        {/* Mini-map overlay */}
        <MiniMap
          assets={assets}
          statusByAsset={statusByAsset}
          selected={selected}
          onSelect={(a) => onSelect(a)}
        />
      </div>
    </div>
  );
}

/** Helper component: captures OrbitControls instance and runs CameraRig */
function ControlsAndRig({ preset }: { preset: PresetKey }) {
  const controlsRef = useRef<any>(null);
  const { gl } = useThree();

  // Prevent page scroll during wheel zoom if desired:
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [gl.domElement]);

  return (
    <>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        panSpeed={0.7}
        minDistance={3.2}
        maxDistance={14}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2 - 0.08}
        screenSpacePanning={false}
        ref={controlsRef}
      />
      {/* Put controls on state so CameraRig can find them */}
      <ExposeControls controlsRef={controlsRef} />
      <CameraRig preset={preset} />
    </>
  );
}

function ExposeControls({ controlsRef }: { controlsRef: RefObject<any> }) {
  const three = useThree() as any;
  useEffect(() => {
    three.controls = controlsRef.current;
  }, [three, controlsRef]);
  return null;
}
