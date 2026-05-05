import { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Grid,
  Text,
} from '@react-three/drei';
import * as THREE from 'three';

// ── Types ─────────────────────────────────────────────────────────────────

export type ComponentType =
  | 'tv' | 'balcao' | 'panel_led' | 'cadeira' | 'totem'
  | 'mesa' | 'sofa' | 'vitrine' | 'banner' | 'planta' | 'prateleira' | 'carpet'
  | 'arco' | 'pilar' | 'viga' | 'teto_painel' | 'luminaria' | 'suspensao_logo' | 'counter_curvo'
  | 'poltrona' | 'banqueta' | 'puff' | 'mesa_redonda' | 'video_wall' | 'kiosk_digital'
  | 'track_spot' | 'neon_sign' | 'arvore_grande' | 'expositor' | 'recepcao'
  | 'forma_caixa' | 'forma_cubo' | 'forma_cilindro';

export interface StandComponent {
  id: string;
  type: ComponentType | string;
  col: number;
  row: number;
  w: number;
  d: number;
  h: number;
  yOffset?: number;   // height from floor (for suspended / elevated elements)
  curvature?: number; // arc angle in degrees (0 = flat, 180 = semicircle) — only for forma_caixa/cubo
  color: string;
  label?: string | null;
}

export interface StandData {
  width: number;
  depth: number;
  wallColor: string;
  floorColor: string;
  accentColor: string;
  brandName?: string | null;
  wallConfig?: 'open' | '1wall' | '2walls' | '3walls';
  wallHeight?: number;
  components: StandComponent[];
  summary?: string;
}

// ── Color utils ──────────────────────────────────────────────────────────

const HEX6_RE = /^#[0-9A-Fa-f]{6}$/;
const HEX3_RE = /^#[0-9A-Fa-f]{3}$/;

export function safeColor(hex: string | undefined | null, fallback = '#888888'): string {
  if (!hex) return fallback;
  if (HEX6_RE.test(hex)) return hex;
  if (HEX3_RE.test(hex)) {
    const h = hex.slice(1);
    return '#' + h[0]+h[0] + h[1]+h[1] + h[2]+h[2];
  }
  return fallback;
}

// ── Floor meshes ──────────────────────────────────────────────────────────

function TV({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const screenH = Math.max(0.3, h - 0.35);
  const screenY = 0.35 + screenH / 2;
  return (
    <>
      <mesh position={[0, 0.025, 0]} castShadow>
        <boxGeometry args={[w * 0.38, 0.05, d * 0.7]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.27, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, screenY, 0]} castShadow>
        <boxGeometry args={[w + 0.07, screenH + 0.07, 0.07]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
      </mesh>
      <mesh position={[0, screenY, 0.04]}>
        <boxGeometry args={[w, screenH, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} toneMapped={false} />
      </mesh>
    </>
  );
}

function PainelLED({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.1, h + 0.1, d]} />
        <meshStandardMaterial color="#111111" roughness={0.5} />
      </mesh>
      <mesh position={[0, h / 2, d / 2 + 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </>
  );
}

function Totem({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const r = Math.min(w, d) * 0.38;
  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r * 1.06, h, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, h, 0]}>
        <sphereGeometry args={[r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.35} />
      </mesh>
      <mesh position={[0, h * 0.52, r + 0.005]}>
        <planeGeometry args={[r * 1.35, h * 0.38]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} opacity={0.88} transparent />
      </mesh>
    </>
  );
}

function Balcao({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  return (
    <>
      <mesh position={[0, h * 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.96, d]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, h + 0.02, 0]}>
        <boxGeometry args={[w + 0.04, 0.04, d + 0.04]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.3} metalness={0.25} />
      </mesh>
    </>
  );
}

function Mesa({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const legH = h - 0.04; const lr = 0.03;
  return (
    <>
      <mesh position={[0, h - 0.02, 0]} castShadow>
        <boxGeometry args={[w, 0.04, d]} /><meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {([-1, 1] as const).flatMap(sx => ([-1, 1] as const).map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - lr - 0.02), legH / 2, sz * (d / 2 - lr - 0.02)]} castShadow>
          <cylinderGeometry args={[lr, lr, legH, 8]} /><meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      )))}
    </>
  );
}

function Cadeira({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const seatY = h * 0.5; const legH = seatY - 0.03; const lr = 0.025;
  return (
    <>
      <mesh position={[0, seatY, 0]} castShadow>
        <boxGeometry args={[w * 0.9, 0.06, d * 0.88]} /><meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, h * 0.78, -(d * 0.5 - 0.025)]} castShadow>
        <boxGeometry args={[w * 0.88, h * 0.5, 0.05]} /><meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {([-1, 1] as const).flatMap(sx => ([-1, 1] as const).map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.34, legH / 2, sz * d * 0.34]} castShadow>
          <cylinderGeometry args={[lr, lr, legH, 6]} /><meshStandardMaterial color="#777777" metalness={0.5} roughness={0.4} />
        </mesh>
      )))}
    </>
  );
}

function Sofa({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const armW = w * 0.09; const backD = d * 0.28;
  return (
    <>
      <mesh position={[0, h * 0.42, 0]} castShadow><boxGeometry args={[w - armW * 2, h * 0.45, d * 0.72]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[-(w / 2 - armW / 2), h * 0.52, 0]} castShadow><boxGeometry args={[armW, h * 0.62, d]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[w / 2 - armW / 2, h * 0.52, 0]} castShadow><boxGeometry args={[armW, h * 0.62, d]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[0, h * 0.65, -(d / 2 - backD / 2)]} castShadow><boxGeometry args={[w, h * 0.88, backD]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      <mesh position={[0, h * 0.12, 0]} castShadow><boxGeometry args={[w - armW * 2, h * 0.22, d * 0.72]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
    </>
  );
}

function Vitrine({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const fw = 0.03;
  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} /><meshStandardMaterial color={color} transparent opacity={0.32} roughness={0.05} metalness={0.1} side={2} />
      </mesh>
      {([-1, 1] as const).flatMap(sx => ([-1, 1] as const).map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2), h / 2, sz * (d / 2)]}>
          <boxGeometry args={[fw, h + fw, fw]} /><meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2} />
        </mesh>
      )))}
      <mesh position={[0, h, 0]}><boxGeometry args={[w + fw, fw, d + fw]} /><meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2} /></mesh>
    </>
  );
}

function Banner({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const poleR = 0.018;
  return (
    <>
      <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[poleR, poleR, h, 8]} /><meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[w / 2 - poleR, h * 0.62, 0]}><planeGeometry args={[w - poleR * 2, h * 0.72]} /><meshStandardMaterial color={color} roughness={0.85} side={2} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.14, 0.14, 0.04, 12]} /><meshStandardMaterial color="#666666" metalness={0.5} roughness={0.4} /></mesh>
    </>
  );
}

function Planta({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const potR = Math.min(w, d) * 0.28;
  return (
    <>
      <mesh position={[0, h * 0.22, 0]} castShadow><cylinderGeometry args={[potR, potR * 0.78, h * 0.4, 12]} /><meshStandardMaterial color="#8b6914" roughness={0.9} /></mesh>
      <mesh position={[0, h * 0.42, 0]}><cylinderGeometry args={[potR, potR, 0.02, 12]} /><meshStandardMaterial color="#3d2b1f" roughness={0.95} /></mesh>
      <mesh position={[0, h * 0.74, 0]} castShadow><sphereGeometry args={[Math.min(w, d) * 0.52, 16, 12]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
    </>
  );
}

function Prateleira({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const levels = Math.max(2, Math.floor(h / 0.4));
  return (
    <>
      <mesh position={[0, h / 2, -(d / 2 - 0.02)]} castShadow><boxGeometry args={[w, h, 0.03]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      {([-1, 1] as const).map(sx => (
        <mesh key={sx} position={[sx * (w / 2 - 0.015), h / 2, 0]} castShadow><boxGeometry args={[0.03, h, d]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh>
      ))}
      {Array.from({ length: levels + 1 }, (_, i) => (
        <mesh key={i} position={[0, (i / levels) * h, 0]} castShadow><boxGeometry args={[w - 0.03, 0.03, d]} /><meshStandardMaterial color="#5a3e2b" roughness={0.7} /></mesh>
      ))}
    </>
  );
}

// ── Structural & Suspended components ────────────────────────────────────

function Arco({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const pilW = Math.max(0.2, Math.min(0.5, w * 0.1));
  const topH = Math.max(0.18, Math.min(0.35, h * 0.1));
  return (
    <>
      {/* Left pillar */}
      <mesh position={[-(w / 2 - pilW / 2), h / 2, 0]} castShadow>
        <boxGeometry args={[pilW, h, d]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[w / 2 - pilW / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[pilW, h, d]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, h - topH / 2, 0]} castShadow>
        <boxGeometry args={[w, topH, d]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* LED strip on underside of top beam */}
      <mesh position={[0, h - topH - 0.03, -d / 2 + 0.015]}>
        <boxGeometry args={[w - pilW * 2 - 0.1, 0.04, 0.02]} />
        <meshStandardMaterial color="#ffdd88" emissive="#ffdd88" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </>
  );
}

function Pilar({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const baseW = w + 0.12;
  return (
    <>
      {/* Base plate */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[baseW, 0.1, baseW]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Body */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Capital */}
      <mesh position={[0, h + 0.05, 0]}>
        <boxGeometry args={[baseW, 0.1, baseW]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>
    </>
  );
}

function Viga({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.3} />
      </mesh>
      {/* Accent line on underside */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w * 0.9, 0.02, d * 0.9]} />
        <meshStandardMaterial color="#ffcc66" emissive="#ffcc66" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    </>
  );
}

function TetoPainel({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  return (
    <>
      {/* Main panel */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Underside LED wash */}
      <mesh position={[0, -0.005, 0]}>
        <planeGeometry args={[w * 0.9, d * 0.9]} />
        <meshStandardMaterial color="#ffe8b0" emissive="#ffe8b0" emissiveIntensity={0.4} toneMapped={false} side={2} />
      </mesh>
      {/* Suspension cables (visual only, 4 corners) */}
      {([-1, 1] as const).flatMap(sx => ([-1, 1] as const).map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.15), h * 0.5 + 0.5, sz * (d / 2 - 0.15)]}>
          <cylinderGeometry args={[0.012, 0.012, 1, 4]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.6} roughness={0.3} />
        </mesh>
      )))}
    </>
  );
}

function Luminaria({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const coneH = Math.max(0.2, h * 0.4);
  const wireH = Math.max(0.3, h * 0.55);
  const radius = Math.max(0.15, w * 0.5);
  return (
    <>
      {/* Suspension wire */}
      <mesh position={[0, coneH + wireH / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, wireH, 4]} />
        <meshStandardMaterial color="#888888" metalness={0.5} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, coneH / 2, 0]} castShadow>
        <coneGeometry args={[radius, coneH, 20, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} side={2} />
      </mesh>
      {/* Top cap ring */}
      <mesh position={[0, coneH, 0]}>
        <cylinderGeometry args={[radius * 0.15, radius * 0.15, 0.06, 10]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Glowing bulb */}
      <mesh position={[0, coneH * 0.12, 0]}>
        <sphereGeometry args={[radius * 0.18, 10, 10]} />
        <meshStandardMaterial color="#fff9e0" emissive="#fff9e0" emissiveIntensity={5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, -coneH * 0.1, 0]} intensity={1.2} distance={5} color="#ffe8b0" />
    </>
  );
}

function SuspensaoLogo({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  return (
    <>
      {/* 4 suspension cables */}
      {([-1, 1] as const).flatMap(sx => ([-1, 1] as const).map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.08), h * 0.5 + 0.4, sz * (d / 2 - 0.08)]}>
          <cylinderGeometry args={[0.009, 0.009, 0.8, 4]} />
          <meshStandardMaterial color="#b0b0b0" metalness={0.6} />
        </mesh>
      )))}
      {/* Main panel body */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {/* Front face — lit */}
      <mesh position={[0, h / 2, d / 2 + 0.008]}>
        <planeGeometry args={[w * 0.88, h * 0.75]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {/* Back face — lit */}
      <mesh position={[0, h / 2, -(d / 2 + 0.008)]}>
        <planeGeometry args={[w * 0.88, h * 0.75]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} toneMapped={false} side={2} />
      </mesh>
    </>
  );
}

function CounterCurvo({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  return (
    <>
      {/* Main body — approximated with several boxes for a curved look */}
      {Array.from({ length: 5 }, (_, i) => {
        const t = (i / 4);
        const angle = t * Math.PI * 0.5;
        const rx = Math.cos(angle) * w * 0.45;
        const rz = Math.sin(angle) * d * 0.45;
        const segW = w / 5 + 0.05;
        return (
          <mesh key={i} position={[rx - w * 0.2, h * 0.48, rz - d * 0.2]} castShadow
            rotation={[0, -angle + Math.PI / 4, 0]}>
            <boxGeometry args={[segW, h * 0.96, d * 0.38]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        );
      })}
      {/* Tampo */}
      <mesh position={[0, h + 0.02, 0]}>
        <boxGeometry args={[w, 0.04, d]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.3} />
      </mesh>
    </>
  );
}

function Poltrona({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const seatH = h * 0.47;
  const backH = h - seatH;
  const armW = w * 0.1;
  const legH = seatH * 0.52;
  const lr = 0.025;
  return (
    <>
      <mesh position={[0, seatH, 0]} castShadow>
        <boxGeometry args={[w * 0.8, h * 0.19, d * 0.65]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, seatH + backH * 0.5, -(d * 0.5 - d * 0.1)]} castShadow>
        <boxGeometry args={[w * 0.78, backH * 0.88, d * 0.18]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[-(w / 2 - armW / 2), seatH * 0.88, 0]} castShadow>
        <boxGeometry args={[armW, seatH * 0.44, d * 0.7]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[w / 2 - armW / 2, seatH * 0.88, 0]} castShadow>
        <boxGeometry args={[armW, seatH * 0.44, d * 0.7]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {([-1, 1] as const).flatMap(sx => ([-1, 1] as const).map(sz => (
        <mesh key={`${sx}${sz}`} position={[sx * w * 0.31, legH / 2, sz * d * 0.27]} castShadow>
          <cylinderGeometry args={[lr * 0.65, lr, legH, 8]} />
          <meshStandardMaterial color="#8b7355" roughness={0.5} metalness={0.1} />
        </mesh>
      )))}
    </>
  );
}

function Banqueta({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const seatR = Math.min(w, d) * 0.44;
  const stemH = h * 0.72;
  const baseR = seatR * 0.85;
  return (
    <>
      <mesh position={[0, h, 0]} castShadow>
        <cylinderGeometry args={[seatR, seatR * 0.88, 0.06, 20]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, h + 0.035, 0]} castShadow>
        <cylinderGeometry args={[seatR * 0.9, seatR * 0.9, 0.04, 20]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, stemH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.055, stemH, 12]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.9} roughness={0.1} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * baseR * 0.5, 0.04, Math.sin(angle) * baseR * 0.5]}
            rotation={[0, -angle, 0]} castShadow>
            <boxGeometry args={[baseR, 0.045, 0.06]} />
            <meshStandardMaterial color="#c0c0c0" metalness={0.85} roughness={0.15} />
          </mesh>
        );
      })}
      <mesh position={[0, stemH * 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[seatR * 0.6, 0.022, 8, 24]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
    </>
  );
}

function Puff({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const r = Math.min(w, d) * 0.48;
  return (
    <>
      <mesh position={[0, h * 0.38, 0]} scale={[1, 0.6, Math.min(d, w) / Math.max(w, d)]} castShadow>
        <sphereGeometry args={[r, 24, 16]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[0, h * 0.66, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.04, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.12} />
      </mesh>
      {[0, Math.PI / 2].map((angle, i) => (
        <mesh key={i} position={[0, h * 0.67, 0]} rotation={[0, angle, 0]}>
          <boxGeometry args={[r * 1.5, 0.01, 0.012]} />
          <meshStandardMaterial color="#000000" opacity={0.15} transparent roughness={1} />
        </mesh>
      ))}
    </>
  );
}

function MesaRedonda({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const topR = Math.min(w, d) * 0.5;
  const pedesH = h * 0.82;
  return (
    <>
      <mesh position={[0, h, 0]} castShadow>
        <cylinderGeometry args={[topR, topR, 0.05, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.38} roughness={0.05} metalness={0.15} />
      </mesh>
      <mesh position={[0, h, 0]}>
        <torusGeometry args={[topR, 0.022, 8, 32]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, pedesH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, pedesH, 14]} />
        <meshStandardMaterial color="#8b7355" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[topR * 0.42, topR * 0.42, 0.04, 24]} />
        <meshStandardMaterial color="#8b7355" roughness={0.6} />
      </mesh>
    </>
  );
}

function VideoWall({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const cols = 3; const rows = 2;
  const bezel = 0.04;
  const panW = (w - bezel * (cols + 1)) / cols;
  const panH = (h - bezel * (rows + 1)) / rows;
  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w + 0.1, h + 0.1, d]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} />
      </mesh>
      {Array.from({ length: rows }, (_, ri) =>
        Array.from({ length: cols }, (_, ci) => {
          const px = -w / 2 + bezel + ci * (panW + bezel) + panW / 2;
          const py = bezel + ri * (panH + bezel) + panH / 2;
          return (
            <mesh key={`${ri}-${ci}`} position={[px, py, d / 2 + 0.005]}>
              <planeGeometry args={[panW, panH]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.15} toneMapped={false} />
            </mesh>
          );
        })
      )}
    </>
  );
}

function KioskDigital({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const baseR = Math.min(w, d) * 0.38;
  const screenH = h * 0.58;
  const screenW = w * 0.88;
  const pedestalH = h - screenH - 0.1;
  return (
    <>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[baseR, baseR * 1.1, 0.08, 16]} />
        <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, pedestalH / 2 + 0.08, 0]} castShadow>
        <boxGeometry args={[w * 0.28, pedestalH, d * 0.28]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, pedestalH + 0.08 + screenH / 2, 0]} castShadow>
        <boxGeometry args={[screenW + 0.06, screenH + 0.06, d]} />
        <meshStandardMaterial color="#141414" roughness={0.4} />
      </mesh>
      <mesh position={[0, pedestalH + 0.08 + screenH / 2, d / 2 + 0.004]}>
        <planeGeometry args={[screenW, screenH]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.92} toneMapped={false} />
      </mesh>
      <mesh position={[screenW * 0.44, pedestalH + 0.08 + 0.04, d / 2 + 0.009]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={3.5} toneMapped={false} />
      </mesh>
    </>
  );
}

function TrackSpot({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const offsets = [-0.36, 0, 0.36] as const;
  const angles  = [0.35, 0, -0.35] as const;
  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.55} />
      </mesh>
      {offsets.map((xOff, i) => (
        <group key={i} position={[xOff * w, 0, 0]} rotation={[angles[i], 0, 0]}>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
            <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.16, 0]} castShadow>
            <coneGeometry args={[0.085, 0.22, 16, 1, true]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.6} side={2} />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#fffbe0" emissive="#fffbe0" emissiveIntensity={4.5} toneMapped={false} />
          </mesh>
          <pointLight position={[0, -0.28, 0]} intensity={0.7} distance={5} color="#ffe0a0" />
        </group>
      ))}
    </>
  );
}

function NeonSign({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const r = 0.025;
  const ei = 4.5;
  return (
    <>
      <mesh position={[0, h / 2, -d / 2]}>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.02]} />
        <meshStandardMaterial color="#080810" roughness={0.95} />
      </mesh>
      <mesh position={[0, h - r, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r, r, w * 0.88, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={ei} toneMapped={false} />
      </mesh>
      <mesh position={[0, r, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r, r, w * 0.88, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={ei} toneMapped={false} />
      </mesh>
      <mesh position={[0, h / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r, r, w * 0.58, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={ei * 0.75} toneMapped={false} />
      </mesh>
      <mesh position={[-(w / 2 - r * 1.5), h / 2, 0]}>
        <cylinderGeometry args={[r, r, h * 0.88, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={ei} toneMapped={false} />
      </mesh>
      <mesh position={[w / 2 - r * 1.5, h / 2, 0]}>
        <cylinderGeometry args={[r, r, h * 0.88, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={ei} toneMapped={false} />
      </mesh>
      <pointLight position={[0, h / 2, 0.1]} intensity={0.9} distance={3.5} color={color} />
    </>
  );
}

function ArvoreGrande({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const potR = Math.min(w, d) * 0.28;
  const trunkR = potR * 0.22;
  const potH = h * 0.22;
  const trunkH = h * 0.52;
  const foliageBaseY = potH + trunkH;
  const fr = Math.min(w, d) * 0.42;
  const foliage: [number, number, number, number][] = [
    [0,          0,          0,          fr],
    [fr * 0.58,  0,         -fr * 0.38,  fr * 0.72],
    [-fr * 0.52, 0,         -fr * 0.33,  fr * 0.68],
    [fr * 0.2,   0,          fr * 0.58,  fr * 0.64],
    [-fr * 0.28, fr * 0.38,  fr * 0.22,  fr * 0.54],
  ];
  return (
    <>
      <mesh position={[0, potH / 2, 0]} castShadow>
        <cylinderGeometry args={[potR, potR * 0.72, potH, 14]} />
        <meshStandardMaterial color="#8b6914" roughness={0.9} />
      </mesh>
      <mesh position={[0, potH, 0]}>
        <torusGeometry args={[potR, potR * 0.08, 8, 16]} />
        <meshStandardMaterial color="#6b5010" roughness={0.8} />
      </mesh>
      <mesh position={[0, potH + 0.015, 0]}>
        <cylinderGeometry args={[potR * 0.88, potR * 0.88, 0.03, 14]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.95} />
      </mesh>
      <mesh position={[0, potH + trunkH / 2, 0]} castShadow>
        <cylinderGeometry args={[trunkR, trunkR * 1.4, trunkH, 10]} />
        <meshStandardMaterial color="#6b4423" roughness={0.9} />
      </mesh>
      {foliage.map(([fx, fy, fz, fradius], i) => (
        <mesh key={i} position={[fx, foliageBaseY + fy, fz]} castShadow>
          <sphereGeometry args={[fradius, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

function Expositor({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const levels = Math.max(2, Math.floor(h / 0.38));
  const sideT = 0.03;
  const backT = 0.025;
  return (
    <>
      <mesh position={[0, h / 2, -(d / 2 - backT / 2)]} castShadow>
        <boxGeometry args={[w, h, backT]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {([-1, 1] as const).map(sx => (
        <mesh key={sx} position={[sx * (w / 2 - sideT / 2), h / 2, 0]} castShadow>
          <boxGeometry args={[sideT, h, d - backT]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
      {Array.from({ length: levels + 1 }, (_, i) => {
        const shelfY = (i / levels) * h;
        return (
          <group key={i}>
            <mesh position={[0, shelfY, 0]}>
              <boxGeometry args={[w - sideT * 2, 0.025, d - backT]} />
              <meshStandardMaterial color="#c8a878" roughness={0.65} />
            </mesh>
            <mesh position={[0, shelfY + 0.02, d / 2 - backT / 2 - 0.01]}>
              <boxGeometry args={[w - sideT * 2, 0.04, 0.015]} />
              <meshStandardMaterial color="#b89060" roughness={0.7} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function Recepcao({ w, d, h, color }: { w: number; d: number; h: number; color: string }) {
  const backH = h * 1.4;
  const frontD = d * 0.72;
  const backD = d - frontD;
  const mainZ = backD / 2;
  return (
    <>
      <mesh position={[0, h * 0.48, mainZ]} castShadow receiveShadow>
        <boxGeometry args={[w, h * 0.96, frontD]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, h + 0.02, mainZ]}>
        <boxGeometry args={[w + 0.05, 0.04, frontD + 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.18} metalness={0.4} />
      </mesh>
      <mesh position={[0, backH / 2, -(frontD / 2)]} castShadow>
        <boxGeometry args={[w, backH, backD]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
      <mesh position={[0, backH + 0.02, -(frontD / 2)]}>
        <boxGeometry args={[w + 0.05, 0.04, backD + 0.05]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.18} metalness={0.4} />
      </mesh>
      <mesh position={[0, h * 0.55, mainZ + frontD / 2 + 0.005]}>
        <planeGeometry args={[w * 0.65, h * 0.42]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28} toneMapped={false} />
      </mesh>
    </>
  );
}

// ── Primitive shapes ──────────────────────────────────────────────────────

function FormaCaixa({ w, d, h, color, curvature = 0 }: { w: number; d: number; h: number; color: string; curvature?: number }) {
  const c = safeColor(color);

  if (curvature > 3) {
    // Arc-shaped panel. The chord (visual width from end to end) stays = w.
    // r = w / (2 * sin(curveRad/2)).  Cylinder center is offset in -Z so that
    // both arc endpoints sit at z = 0, and the midpoint bows into +Z.
    const curveRad = curvature * Math.PI / 180;
    const r = w / (2 * Math.sin(curveRad / 2));
    const cz = -r * Math.cos(curveRad / 2);           // cylinder origin offset
    const thetaStart = (Math.PI - curveRad) / 2;       // arc starts at +X side
    const segments = Math.max(8, Math.round(curveRad * 20));
    const innerR = Math.max(0.01, r - d);

    return (
      <group>
        {/* Outer face */}
        <mesh position={[0, h / 2, cz]} castShadow receiveShadow>
          <cylinderGeometry args={[r, r, h, segments, 1, true, thetaStart, curveRad]} />
          <meshStandardMaterial color={c} roughness={0.55} metalness={0.08} />
        </mesh>
        {/* Inner face — backside so thickness is visible */}
        <mesh position={[0, h / 2, cz]}>
          <cylinderGeometry args={[innerR, innerR, h, segments, 1, true, thetaStart, curveRad]} />
          <meshStandardMaterial color={c} roughness={0.6} side={THREE.BackSide} />
        </mesh>
        {/* Subtle edge overlay */}
        <mesh position={[0, h / 2, cz]}>
          <cylinderGeometry args={[r + 0.006, r + 0.006, h + 0.006, segments, 1, true, thetaStart, curveRad]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} wireframe />
        </mesh>
      </group>
    );
  }

  // Flat box (default)
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={c} roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w + 0.005, h + 0.005, d + 0.005]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.1} depthWrite={false} wireframe />
      </mesh>
    </group>
  );
}

function FormaCilindro({ w, d, h, color, curvature = 0 }: { w: number; d: number; h: number; color: string; curvature?: number }) {
  const r = Math.min(w, d) / 2;
  const c = safeColor(color);
  // curvature = degrees sliced away. 0 = full circle; 180 = half; 270 = quarter.
  const arcDeg = curvature > 0 ? Math.max(15, 360 - curvature) : 360;
  const arcRad = arcDeg * Math.PI / 180;
  const partial = curvature > 0;
  const segs = Math.max(12, Math.round(arcRad * 18));
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, h, segs, 1, partial, 0, arcRad]} />
        <meshStandardMaterial color={c} roughness={0.55} metalness={0.08} side={partial ? THREE.DoubleSide : THREE.FrontSide} />
      </mesh>
      <mesh position={[0, h, 0]}>
        <torusGeometry args={[r, 0.013, 6, segs, arcRad]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.008, 0]}>
        <torusGeometry args={[r, 0.013, 6, segs, arcRad]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Draggable component wrapper ───────────────────────────────────────────

const SPECIAL_TYPES = [
  'carpet','planta','vitrine','sofa','tv','panel_led','prateleira',
  'totem','balcao','mesa','cadeira','banner',
  'arco','pilar','viga','teto_painel','luminaria','suspensao_logo','counter_curvo',
  'poltrona','banqueta','puff','mesa_redonda','video_wall','kiosk_digital',
  'track_spot','neon_sign','arvore_grande','expositor','recepcao',
  'forma_caixa','forma_cubo','forma_cilindro',
];

interface CompProps {
  comp: StandComponent;
  standW: number;
  standD: number;
  selected: boolean;
  onSelect?: (id: string) => void;
  onPositionChange?: (id: string, col: number, row: number) => void;
  onContextMenu?: (id: string, x: number, y: number) => void;
  onResize?: (id: string, updates: Partial<StandComponent>) => void;
}

function CompMesh({ comp, standW, standD, selected, onSelect, onPositionChange, onContextMenu, onResize }: CompProps) {
  const { raycaster, gl, camera, controls } = useThree();
  const yOff = comp.yOffset ?? 0;
  // Drag plane is at the element's base height so horizontal drag stays at correct elevation
  const floorPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -yOff),
    [yOff]
  );
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, z: 0 });
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => { return () => { cleanupRef.current?.(); }; }, []);

  const { w, d, h, type } = comp;
  const curvature = comp.curvature ?? 0;
  const color = safeColor(comp.color);
  const px = comp.col + w / 2 - standW / 2;
  const pz = comp.row + d / 2 - standD / 2;

  const snap = (v: number, g = 0.25) => Math.round(v / g) * g;

  const PRIMITIVE_TYPES = ['forma_caixa', 'forma_cubo', 'forma_cilindro'];
  const isPrimitive = PRIMITIVE_TYPES.includes(type as string);

  // Resize drag factory — used by the face handles on primitive shapes
  const makeSizeDrag = (
    dragField: 'w' | 'd' | 'h',
    dragAxis: 'x' | 'z' | 'y',
    sign: 1 | -1,
  ) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (controls) (controls as any).enabled = false;
    gl.domElement.style.cursor = 'crosshair';

    let plane: THREE.Plane;
    if (dragAxis === 'x')      plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -pz);
    else if (dragAxis === 'z') plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -px);
    else                       plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -pz); // vertical plane — hit.y tracks up/down

    const hit0 = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit0);
    const startAxisVal = dragAxis === 'x' ? hit0.x : dragAxis === 'z' ? hit0.z : hit0.y;
    const startDim  = comp[dragField] as number;
    const startCol  = comp.col;
    const startRow  = comp.row;

    const onMoveResize = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const nx = ((ev.clientX - rect.left) / rect.width)  * 2 - 1;
      const ny = -((ev.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, hit)) return;

      const curAxisVal = dragAxis === 'x' ? hit.x : dragAxis === 'z' ? hit.z : hit.y;
      const rawDelta   = (curAxisVal - startAxisVal) * sign;
      const newDim     = Math.max(0.1, Math.round((startDim + rawDelta) / 0.1) * 0.1);

      const updates: Partial<StandComponent> = { [dragField]: newDim };
      if (sign === -1) {
        if (dragField === 'w') updates.col = Math.max(0, startCol + (startDim - newDim));
        if (dragField === 'd') updates.row = Math.max(0, startRow + (startDim - newDim));
      }
      onResize?.(comp.id, updates);
    };

    const onUpResize = () => {
      if (controls) (controls as any).enabled = true;
      gl.domElement.style.cursor = '';
      gl.domElement.removeEventListener('pointermove', onMoveResize);
      gl.domElement.removeEventListener('pointerup', onUpResize);
    };

    gl.domElement.addEventListener('pointermove', onMoveResize);
    gl.domElement.addEventListener('pointerup', onUpResize);
  };

  // Curvature drag — dragging the orange handle left/right changes arc angle
  const makeCurveDrag = () => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (controls) (controls as any).enabled = false;
    gl.domElement.style.cursor = 'crosshair';

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(yOff + h * 0.5));
    const hit0 = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, hit0);
    const startX = hit0.x;
    const startCurv = comp.curvature ?? 0;

    const onMoveC = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const nx = ((ev.clientX - rect.left) / rect.width)  * 2 - 1;
      const ny = -((ev.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      const delta = (hit.x - startX) * 60; // 60° per metre
      onResize?.(comp.id, { curvature: Math.max(0, Math.min(340, Math.round(startCurv + delta))) });
    };

    const onUpC = () => {
      if (controls) (controls as any).enabled = true;
      gl.domElement.style.cursor = '';
      gl.domElement.removeEventListener('pointermove', onMoveC);
      gl.domElement.removeEventListener('pointerup', onUpC);
    };

    gl.domElement.addEventListener('pointermove', onMoveC);
    gl.domElement.addEventListener('pointerup', onUpC);
  };

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect?.(comp.id);

    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(floorPlane, hit)) {
      dragOffset.current = { x: hit.x - px, z: hit.z - pz };
    } else {
      dragOffset.current = { x: 0, z: 0 };
    }

    dragging.current = true;
    gl.domElement.style.cursor = 'grabbing';
    if (controls) (controls as any).enabled = false;

    const onMove = (ev: PointerEvent) => {
      if (!dragging.current) return;
      const rect = gl.domElement.getBoundingClientRect();
      const nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(nx, ny), camera);
      const hit2 = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(floorPlane, hit2)) {
        const newCol = snap(Math.max(0, Math.min(standW - w, hit2.x - dragOffset.current.x - w / 2 + standW / 2)));
        const newRow = snap(Math.max(0, Math.min(standD - d, hit2.z - dragOffset.current.z - d / 2 + standD / 2)));
        onPositionChange?.(comp.id, newCol, newRow);
      }
    };

    const onUp = () => {
      dragging.current = false;
      gl.domElement.style.cursor = '';
      if (controls) (controls as any).enabled = true;
      gl.domElement.removeEventListener('pointermove', onMove);
      gl.domElement.removeEventListener('pointerup', onUp);
      cleanupRef.current = null;
    };

    cleanupRef.current = onUp;
    gl.domElement.addEventListener('pointermove', onMove);
    gl.domElement.addEventListener('pointerup', onUp);
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    e.nativeEvent.preventDefault();
    onSelect?.(comp.id);
    onContextMenu?.(comp.id, e.nativeEvent.clientX, e.nativeEvent.clientY);
  };

  return (
    <group
      position={[px, yOff, pz]}
      onPointerDown={handleDown}
      onContextMenu={handleContextMenu}
      onPointerEnter={() => { if (!dragging.current) gl.domElement.style.cursor = 'grab'; }}
      onPointerLeave={() => { if (!dragging.current) gl.domElement.style.cursor = ''; }}
    >
      {type === 'carpet' && (
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <boxGeometry args={[w, 0.04, d]} /><meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      )}
      {type === 'tv'            && <TV           w={w} d={d} h={h} color={color} />}
      {type === 'panel_led'     && <PainelLED    w={w} d={d} h={h} color={color} />}
      {type === 'totem'         && <Totem        w={w} d={d} h={h} color={color} />}
      {type === 'balcao'        && <Balcao       w={w} d={d} h={h} color={color} />}
      {type === 'mesa'          && <Mesa         w={w} d={d} h={h} color={color} />}
      {type === 'cadeira'       && <Cadeira      w={w} d={d} h={h} color={color} />}
      {type === 'sofa'          && <Sofa         w={w} d={d} h={h} color={color} />}
      {type === 'vitrine'       && <Vitrine      w={w} d={d} h={h} color={color} />}
      {type === 'banner'        && <Banner       w={w} d={d} h={h} color={color} />}
      {type === 'planta'        && <Planta       w={w} d={d} h={h} color={color} />}
      {type === 'prateleira'    && <Prateleira   w={w} d={d} h={h} color={color} />}
      {type === 'arco'          && <Arco         w={w} d={d} h={h} color={color} />}
      {type === 'pilar'         && <Pilar        w={w} d={d} h={h} color={color} />}
      {type === 'viga'          && <Viga         w={w} d={d} h={h} color={color} />}
      {type === 'teto_painel'   && <TetoPainel   w={w} d={d} h={h} color={color} />}
      {type === 'luminaria'     && <Luminaria    w={w} d={d} h={h} color={color} />}
      {type === 'suspensao_logo' && <SuspensaoLogo w={w} d={d} h={h} color={color} />}
      {type === 'counter_curvo'  && <CounterCurvo   w={w} d={d} h={h} color={color} />}
      {type === 'poltrona'       && <Poltrona       w={w} d={d} h={h} color={color} />}
      {type === 'banqueta'       && <Banqueta       w={w} d={d} h={h} color={color} />}
      {type === 'puff'           && <Puff           w={w} d={d} h={h} color={color} />}
      {type === 'mesa_redonda'   && <MesaRedonda    w={w} d={d} h={h} color={color} />}
      {type === 'video_wall'     && <VideoWall      w={w} d={d} h={h} color={color} />}
      {type === 'kiosk_digital'  && <KioskDigital   w={w} d={d} h={h} color={color} />}
      {type === 'track_spot'     && <TrackSpot      w={w} d={d} h={h} color={color} />}
      {type === 'neon_sign'      && <NeonSign       w={w} d={d} h={h} color={color} />}
      {type === 'arvore_grande'  && <ArvoreGrande   w={w} d={d} h={h} color={color} />}
      {type === 'expositor'      && <Expositor      w={w} d={d} h={h} color={color} />}
      {type === 'recepcao'       && <Recepcao       w={w} d={d} h={h} color={color} />}
      {(type === 'forma_caixa' || type === 'forma_cubo') && <FormaCaixa w={w} d={d} h={h} color={color} curvature={curvature} />}
      {type === 'forma_cilindro' && <FormaCilindro  w={w} d={d} h={h} color={color} curvature={curvature} />}

      {!SPECIAL_TYPES.includes(type as string) && type !== 'carpet' && (
        <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} /><meshStandardMaterial color={color} roughness={0.75} />
        </mesh>
      )}

      {type === 'totem' && comp.label && (
        <Text position={[0, h * 0.52, Math.min(w, d) * 0.38 + 0.06]} fontSize={Math.min(0.18, w * 0.35)}
          color={color} anchorX="center" anchorY="middle" maxWidth={w * 0.85}>
          {comp.label.slice(0, 12)}
        </Text>
      )}

      {/* Selection highlight */}
      {selected && (
        <>
          <mesh position={[0, Math.max(h, 0.1) / 2, 0]}>
            <boxGeometry args={[w + 0.16, Math.max(h, 0.1) + 0.16, d + 0.16]} />
            <meshStandardMaterial color="#ff8844" transparent opacity={0.15} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[w + 0.18, 0.02, d + 0.18]} />
            <meshStandardMaterial color="#ff8844" transparent opacity={0.55} depthWrite={false} />
          </mesh>
        </>
      )}

      {/* Resize handles — only for primitive shapes when selected */}
      {selected && isPrimitive && (
        <>
          {/* Width handles (±X) — red */}
          {([1, -1] as const).map(s => (
            <mesh
              key={`hx${s}`}
              position={[s * (w / 2 + 0.18), h / 2, 0]}
              onPointerDown={makeSizeDrag('w', 'x', s)}
              onPointerEnter={e => { e.stopPropagation(); gl.domElement.style.cursor = 'ew-resize'; }}
              onPointerLeave={e => { e.stopPropagation(); gl.domElement.style.cursor = dragging.current ? 'grabbing' : 'grab'; }}
            >
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshStandardMaterial color="#ff3333" emissive="#ff1111" emissiveIntensity={0.7} toneMapped={false} />
            </mesh>
          ))}
          {/* Depth handles (±Z) — blue */}
          {([1, -1] as const).map(s => (
            <mesh
              key={`hz${s}`}
              position={[0, h / 2, s * (d / 2 + 0.18)]}
              onPointerDown={makeSizeDrag('d', 'z', s)}
              onPointerEnter={e => { e.stopPropagation(); gl.domElement.style.cursor = 'ns-resize'; }}
              onPointerLeave={e => { e.stopPropagation(); gl.domElement.style.cursor = dragging.current ? 'grabbing' : 'grab'; }}
            >
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshStandardMaterial color="#3388ff" emissive="#1155ff" emissiveIntensity={0.7} toneMapped={false} />
            </mesh>
          ))}
          {/* Height handle (+Y) — green */}
          <mesh
            position={[0, h + 0.18, 0]}
            onPointerDown={makeSizeDrag('h', 'y', 1)}
            onPointerEnter={e => { e.stopPropagation(); gl.domElement.style.cursor = 'row-resize'; }}
            onPointerLeave={e => { e.stopPropagation(); gl.domElement.style.cursor = dragging.current ? 'grabbing' : 'grab'; }}
          >
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshStandardMaterial color="#33ff88" emissive="#11ff55" emissiveIntensity={0.7} toneMapped={false} />
          </mesh>
          {/* Curvature handle (orange sphere) — box and cylinder shapes */}
          {(type === 'forma_caixa' || type === 'forma_cubo' || type === 'forma_cilindro') && (
            <mesh
              position={[w / 2 + 0.5, h * 0.5, 0]}
              onPointerDown={makeCurveDrag()}
              onPointerEnter={e => { e.stopPropagation(); gl.domElement.style.cursor = 'ew-resize'; }}
              onPointerLeave={e => { e.stopPropagation(); gl.domElement.style.cursor = dragging.current ? 'grabbing' : 'grab'; }}
            >
              <sphereGeometry args={[0.12, 14, 10]} />
              <meshStandardMaterial color="#ff9500" emissive="#ff7000" emissiveIntensity={0.9} toneMapped={false} />
            </mesh>
          )}
          {/* Axis lines connecting handles to faces */}
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[w + 0.36, 0.018, 0.018]} />
            <meshStandardMaterial color="#ff3333" transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <mesh position={[0, h / 2, 0]}>
            <boxGeometry args={[0.018, 0.018, d + 0.36]} />
            <meshStandardMaterial color="#3388ff" transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <mesh position={[0, (h + 0.18) / 2, 0]}>
            <boxGeometry args={[0.018, h + 0.36, 0.018]} />
            <meshStandardMaterial color="#33ff88" transparent opacity={0.35} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ── Wall builder ──────────────────────────────────────────────────────────

function Wall({ position, size, color, accentColor }: {
  position: [number, number, number];
  size: [number, number, number];
  color: string; accentColor: string;
}) {
  const [w, h, d] = size;
  const AS = 0.10;
  return (
    <group position={position}>
      <mesh receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2 - AS / 2, 0]}>
        <boxGeometry args={[w, AS, d + 0.01]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.07} roughness={0.5} />
      </mesh>
    </group>
  );
}

// ── Stand scene ───────────────────────────────────────────────────────────

interface SceneProps {
  stand: StandData;
  selectedId?: string;
  onSelect?: (id: string) => void;
  onPositionChange?: (id: string, col: number, row: number) => void;
  onContextMenu?: (id: string, x: number, y: number) => void;
  onResize?: (id: string, updates: Partial<StandComponent>) => void;
}

function StandScene({ stand, selectedId, onSelect, onPositionChange, onContextMenu, onResize }: SceneProps) {
  const W  = Math.max(2, stand.width  || 8);
  const D  = Math.max(2, stand.depth  || 6);
  const WH = Math.max(1.5, Math.min(8, stand.wallHeight || 3));
  const WT = 0.08;

  const wallConfig  = stand.wallConfig ?? '2walls';
  const hasBack  = wallConfig !== 'open';
  const hasLeft  = wallConfig === '2walls' || wallConfig === '3walls';
  const hasRight = wallConfig === '3walls';

  const wallColor   = safeColor(stand.wallColor,   '#f0ede8');
  const floorColor  = safeColor(stand.floorColor,  '#d4c9b0');
  const accentColor = safeColor(stand.accentColor, '#7a1a2e');
  const components  = Array.isArray(stand.components) ? stand.components : [];

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color={floorColor} roughness={0.88} />
      </mesh>

      {hasBack  && <Wall position={[0, WH / 2, -D / 2 - WT / 2]} size={[W, WH, WT]} color={wallColor} accentColor={accentColor} />}
      {hasLeft  && <Wall position={[-W / 2 - WT / 2, WH / 2, 0]} size={[WT, WH, D]} color={wallColor} accentColor={accentColor} />}
      {hasRight && <Wall position={[ W / 2 + WT / 2, WH / 2, 0]} size={[WT, WH, D]} color={wallColor} accentColor={accentColor} />}

      {stand.brandName && hasBack && (
        <Text position={[0, WH * 0.55, -D / 2 + 0.04]} fontSize={Math.min(0.55, W * 0.075)}
          color={accentColor} anchorX="center" anchorY="middle" letterSpacing={0.06}>
          {stand.brandName.toUpperCase()}
        </Text>
      )}

      {components.map(comp => (
        <CompMesh
          key={comp.id}
          comp={comp}
          standW={W}
          standD={D}
          selected={selectedId === comp.id}
          onSelect={onSelect}
          onPositionChange={onPositionChange}
          onContextMenu={onContextMenu}
          onResize={onResize}
        />
      ))}

      <ContactShadows position={[0, 0.003, 0]} width={W + 4} height={D + 4} opacity={0.45} blur={2.5} far={5} />
    </>
  );
}

// ── Camera preset controller ─────────────────────────────────────────────

function CameraController({ preset, W, D }: { preset?: string; W: number; D: number }) {
  const { camera, controls } = useThree();
  const prevPreset = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!preset || preset === prevPreset.current || !controls) return;
    prevPreset.current = preset;
    const dist = Math.max(W, D) * 1.75;
    const cfgs: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
      iso:   { pos: [dist * 0.85, dist * 0.65, dist], target: [0, 1.2, 0] },
      top:   { pos: [0.001, dist * 2.2, 0.001],        target: [0, 0, 0]  },
      front: { pos: [0, D * 0.6, dist * 1.8],           target: [0, D * 0.6, 0] },
      side:  { pos: [dist * 1.8, D * 0.6, 0],           target: [0, D * 0.6, 0] },
    };
    const cfg = cfgs[preset] ?? cfgs.iso;
    camera.position.set(...cfg.pos);
    (controls as any).target.set(...cfg.target);
    (controls as any).update();
  }, [preset, W, D]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ── Public component ──────────────────────────────────────────────────────

interface StandViewerProps {
  stand: StandData;
  className?: string;
  selectedId?: string;
  cameraPreset?: string;
  onSelect?: (id: string) => void;
  onPositionChange?: (id: string, col: number, row: number) => void;
  onContextMenu?: (id: string, x: number, y: number) => void;
  onResize?: (id: string, updates: Partial<StandComponent>) => void;
}

export function StandViewer({ stand, className = '', selectedId, cameraPreset, onSelect, onPositionChange, onContextMenu, onResize }: StandViewerProps) {
  const W    = Math.max(2, stand.width  || 8);
  const D    = Math.max(2, stand.depth  || 6);
  const dist = Math.max(W, D) * 1.75;

  return (
    <div className={className} style={{ background: '#13111a' }} onContextMenu={e => e.preventDefault()}>
      <Canvas
        shadows
        camera={{ position: [dist * 0.85, dist * 0.65, dist], fov: 42, near: 0.1, far: 500 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#13111a']} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[W * 1.5, W * 2.5, D * 2]} intensity={0.9} castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

        <Suspense fallback={null}>
          <Environment preset="warehouse" />
          <StandScene
            stand={stand}
            selectedId={selectedId}
            onSelect={onSelect}
            onPositionChange={onPositionChange}
            onContextMenu={onContextMenu}
            onResize={onResize}
          />
        </Suspense>

        <Grid args={[80, 80]} cellSize={1} cellThickness={0.4} cellColor="#2a2838"
          sectionSize={5} sectionThickness={0.8} sectionColor="#3a3550"
          fadeDistance={40} fadeStrength={1.5} followCamera={false} infiniteGrid position={[0, -0.008, 0]} />

        <OrbitControls makeDefault target={[0, 1.2, 0]} minDistance={3} maxDistance={80}
          maxPolarAngle={Math.PI / 2 - 0.02} enableDamping dampingFactor={0.08} />

        <CameraController preset={cameraPreset} W={W} D={D} />
      </Canvas>
    </div>
  );
}
