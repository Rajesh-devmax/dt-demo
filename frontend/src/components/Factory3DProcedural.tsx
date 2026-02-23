import React, { useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

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

// map your existing 2D coordinates into world coords
function toWorld(x: number, y: number) {
  const scale = 0.02;
  return new THREE.Vector3((x - 350) * scale, 0, (y - 190) * scale);
}

/** Zone block */
function Zone({ pos, size, label }: { pos: [number, number, number]; size: [number, number, number]; label: string }) {
  return (
    <group position={pos}>
      <mesh receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Html position={[0, size[1] / 2 + 0.05, 0]} distanceFactor={10}>
        <div style={{ fontSize: 12, padding: "2px 6px", background: "rgba(255,255,255,0.85)", border: "1px solid #ddd" }}>
          <b>{label}</b>
        </div>
      </Html>
    </group>
  );
}

function MachineBody({ color, selected }: { color: string; selected: boolean }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.35, 0.45]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} />
      </mesh>
      {/* outline-ish selection helper */}
      {selected && (
        <mesh>
          <boxGeometry args={[0.62, 0.42, 0.52]} />
          <meshStandardMaterial color="#111" wireframe />
        </mesh>
      )}
    </group>
  );
}

/** Different shapes per asset type based on id prefix (simple but effective) */
function MachineShape({ assetId, color, selected }: { assetId: string; color: string; selected: boolean }) {
  if (assetId.startsWith("CNC")) {
    return (
      <group>
        <MachineBody color={color} selected={selected} />
        {/* spindle */}
        <mesh position={[0.2, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.25, 16]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      </group>
    );
  }
  if (assetId.includes("ROB")) {
    return (
      <group>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.18, 20]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} />
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.08, 0.35, 0.08]} />
          <meshStandardMaterial color="#777" />
        </mesh>
        <mesh position={[0.1, 0.35, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
          <boxGeometry args={[0.25, 0.06, 0.06]} />
          <meshStandardMaterial color="#777" />
        </mesh>
        {selected && (
          <mesh>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#111" wireframe />
          </mesh>
        )}
      </group>
    );
  }
  if (assetId.includes("OVEN")) {
    return (
      <group>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.35, 0.45]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} />
        </mesh>
        {/* door */}
        <mesh position={[0.35, 0.0, 0.23]} castShadow>
          <boxGeometry args={[0.25, 0.25, 0.03]} />
          <meshStandardMaterial color="#555" />
        </mesh>
        {selected && (
          <mesh>
            <boxGeometry args={[1.0, 0.45, 0.55]} />
            <meshStandardMaterial color="#111" wireframe />
          </mesh>
        )}
      </group>
    );
  }
  if (assetId.includes("CONV")) {
    return (
      <group>
        {/* belt */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.12, 0.35]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.08} />
        </mesh>
        {/* rollers */}
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[-0.5 + i * 0.2, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.38, 12]} />
            <meshStandardMaterial color="#666" />
          </mesh>
        ))}
        {selected && (
          <mesh>
            <boxGeometry args={[1.3, 0.22, 0.45]} />
            <meshStandardMaterial color="#111" wireframe />
          </mesh>
        )}
      </group>
    );
  }
  // default (packer etc.)
  return <MachineBody color={color} selected={selected} />;
}

function Machine({ asset, live, selected, onSelect }: any) {
  const state: AssetState = live?.state ?? "IDLE";
  const color = stateColor(state);

  const pos = useMemo(() => {
    const v = toWorld(asset.x, asset.y);
    return [v.x, 0.18, v.z] as [number, number, number];
  }, [asset.x, asset.y]);

  return (
    <group
      position={pos}
      onClick={(e) => { e.stopPropagation(); onSelect(asset); }}
    >
      <MachineShape assetId={asset.id} color={color} selected={selected} />

      <Html position={[0, 0.5, 0]} distanceFactor={9}>
        <div style={{
          background: "rgba(255,255,255,0.9)",
          border: "1px solid #ddd",
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 11,
          whiteSpace: "nowrap"
        }}>
          <b>{asset.id}</b>
        </div>
      </Html>
    </group>
  );
}

export function Factory3DProcedural({ assets, statusByAsset, selected, onSelect }: Props) {
  return (
    <div style={{ height: 460, border: "1px solid #ddd", background: "#fff" }}>
      <Canvas
        shadows
        camera={{ position: [5, 5, 6], fov: 45 }}
        onPointerMissed={() => onSelect(null)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 10, 4]} intensity={1.1} castShadow />

        {/* floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 12]} />
          <meshStandardMaterial color="#f4f5f7" />
        </mesh>

        {/* zones (simple white blocks) */}
        <Zone pos={[-3.2, 0.06, -1.2]} size={[5.2, 0.12, 3.2]} label="CNC Cell" />
        <Zone pos={[ 3.0, 0.06, -1.5]} size={[6.2, 0.12, 2.8]} label="Paint / Assembly" />
        <Zone pos={[ 3.0, 0.06,  2.1]} size={[6.2, 0.12, 2.6]} label="Packaging" />

        {/* assets */}
        {assets.map(a => (
          <Machine
            key={a.id}
            asset={a}
            live={statusByAsset[a.id]}
            selected={selected?.id === a.id}
            onSelect={onSelect}
          />
        ))}

        <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  );
}