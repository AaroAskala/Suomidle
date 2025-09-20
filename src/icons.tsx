import type { ReactNode, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

const background = '#0f172a';
const backgroundStroke = '#1e293b';
const accentLight = '#f8fafc';

const BasePanel = ({ children }: { children: ReactNode }) => (
  <g>
    <rect
      x={4}
      y={4}
      width={56}
      height={56}
      rx={12}
      fill={background}
      stroke={backgroundStroke}
      strokeWidth={2}
    />
    {children}
  </g>
);

export const SaunaIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M16 46h32v8H16z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M14 32l18-12 18 12v14H14z"
        fill="#fb923c"
        stroke="#c2410c"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect
        x={28}
        y={34}
        width={8}
        height={12}
        rx={1.5}
        fill="#78350f"
        stroke="#431407"
        strokeWidth={1.5}
      />
      <path
        d="M24 20c0-4 3-6 3-9"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d="M32 18c0-4 3-6 3-9"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d="M40 20c0-4 3-6 3-9"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.55}
      />
    </BasePanel>
  </svg>
);

export const KylakauppaIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M16 48h32v6H16z"
        fill="#1d4ed8"
        stroke="#1e40af"
        strokeWidth={2}
      />
      <path
        d="M14 30h36v18H14z"
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth={2}
      />
      <path
        d="M14 30l6-10h24l6 10"
        fill="#93c5fd"
        stroke="#2563eb"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M18 30v6c0 2-1.6 4-3.5 4S11 38 11 36v-6"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M46 30v6c0 2 1.6 4 3.5 4S53 38 53 36v-6"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect x={24} y={36} width={8} height={12} rx={1.5} fill="#1d4ed8" />
      <rect x={35} y={36} width={11} height={6} rx={1} fill="#facc15" />
    </BasePanel>
  </svg>
);

export const AlkoIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M32 10c4 0 7 3 7 6 0 2-0.5 3.5-1.5 5.5-1.2 2.5-1.5 5.5-1.5 8.5v2c0 2.8 0.7 5.6 2 8l3 6c1.6 3 0.1 7-3.4 7H26.4c-3.5 0-5-4-3.4-7l3-6c1.3-2.4 2-5.2 2-8v-2c0-3-0.3-6-1.5-8.5C25.5 19.5 25 18 25 16c0-3 3-6 7-6z"
        fill="#f87171"
        stroke="#b91c1c"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29 18h6"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d="M27 44h10"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />
    </BasePanel>
  </svg>
);

export const EnsiapuIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <rect
        x={18}
        y={14}
        width={28}
        height={36}
        rx={6}
        fill="#f97316"
        stroke="#c2410c"
        strokeWidth={2}
      />
      <path
        d="M32 22v10m-5-5h10"
        stroke={accentLight}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M22 18l-4-4"
        stroke={accentLight}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.6}
      />
    </BasePanel>
  </svg>
);

export const BaariIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M22 14h20l-2 18a10 10 0 01-8 8 10 10 0 01-8-8z"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M32 40v8"
        stroke="#fbbf24"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M26 48h12"
        stroke="#fde68a"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M24 18h16"
        stroke={accentLight}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.8}
      />
      <path
        d="M26 24h12"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />
    </BasePanel>
  </svg>
);

export const CittariIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M20 20l-4 8v14a4 4 0 004 4h24a4 4 0 004-4V28l-4-8z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M20 20l5-6h14l5 6"
        fill="#86efac"
        stroke="#16a34a"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M18 30h28"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.75}
      />
      <rect x={24} y={34} width={8} height={10} rx={1.5} fill="#166534" opacity={0.8} />
      <rect x={36} y={34} width={8} height={10} rx={1.5} fill="#166534" opacity={0.8} />
      <path
        d="M22 44h20"
        stroke="#bbf7d0"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const SateriIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M12 40h40v10H12z"
        fill="#4ade80"
        stroke="#15803d"
        strokeWidth={2}
      />
      <path
        d="M18 28l14-12 14 12v12H18z"
        fill="#22c55e"
        stroke="#166534"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M20 42c4-4 8-6 12-6s8 2 12 6"
        stroke="#bbf7d0"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d="M26 42v8"
        stroke="#14532d"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M38 42v8"
        stroke="#14532d"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M24 28c0-4 2-7 8-10"
        stroke="#fefce8"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />
    </BasePanel>
  </svg>
);

export const KasinoIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <circle cx={32} cy={32} r={16} fill="#e879f9" stroke="#c026d3" strokeWidth={3} />
      <circle cx={32} cy={32} r={10} fill="#fdf4ff" stroke="#c026d3" strokeWidth={2} />
      <circle cx={32} cy={24} r={2} fill="#c026d3" />
      <circle cx={32} cy={40} r={2} fill="#c026d3" />
      <circle cx={24} cy={32} r={2} fill="#c026d3" />
      <circle cx={40} cy={32} r={2} fill="#c026d3" />
      <path
        d="M20 18l-4 4 28 28 4-4z"
        fill="#f0abfc"
        opacity={0.35}
      />
      <rect
        x={18}
        y={18}
        width={28}
        height={28}
        rx={8}
        stroke="#f0abfc"
        strokeWidth={2}
        strokeDasharray="4 4"
        opacity={0.7}
      />
    </BasePanel>
  </svg>
);

export const KirkkoIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M30 14l-6 8v10H14v18h36V32H40V22z"
        fill="#60a5fa"
        stroke="#2563eb"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M32 14v10m-4-4h8"
        stroke={accentLight}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <rect x={28} y={36} width={8} height={12} rx={2} fill="#1d4ed8" />
      <path
        d="M20 32v18"
        stroke="#1e40af"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M44 32v18"
        stroke="#1e40af"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const VankilaIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <rect
        x={16}
        y={18}
        width={32}
        height={28}
        rx={4}
        fill="#9ca3af"
        stroke="#4b5563"
        strokeWidth={2}
      />
      <path
        d="M16 24h32"
        stroke="#4b5563"
        strokeWidth={2}
      />
      <path
        d="M16 40h32"
        stroke="#4b5563"
        strokeWidth={2}
      />
      <path
        d="M22 18v28m8-28v28m8-28v28m8-28v28"
        stroke="#1f2937"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={32} cy={32} r={4} fill="#1f2937" opacity={0.35} />
    </BasePanel>
  </svg>
);

export const BordelliIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M32 42s-8-5-12-11c-4-6 0-13 6-13 4 0 6 3 6 3s2-3 6-3c6 0 10 7 6 13-4 6-12 11-12 11z"
        fill="#fb7185"
        stroke="#be123c"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M20 20l-4-2m32 2l4-2"
        stroke="#fbcfe8"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.8}
      />
      <circle cx={20} cy={46} r={3} fill="#fbcfe8" opacity={0.8} />
      <circle cx={44} cy={18} r={2} fill="#fde68a" />
      <circle cx={18} cy={18} r={2} fill="#fde68a" />
    </BasePanel>
  </svg>
);

export const KampusIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M16 44h32v8H16z"
        fill="#38bdf8"
        stroke="#0ea5e9"
        strokeWidth={2}
      />
      <path
        d="M18 28h28v16H18z"
        fill="#0ea5e9"
        stroke="#0369a1"
        strokeWidth={2}
      />
      <path
        d="M18 28l14-10 14 10"
        fill="#bae6fd"
        stroke="#0ea5e9"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M20 34h8v8h-8zm16 0h8v8h-8z"
        fill="#1d4ed8"
        opacity={0.8}
      />
      <path
        d="M18 44c0 4 4 6 14 6s14-2 14-6"
        stroke="#f0f9ff"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.6}
      />
    </BasePanel>
  </svg>
);

export const TehdasIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M16 46h32v8H16z"
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth={2}
      />
      <path
        d="M18 34l8-6v6l8-6v6l8-6v20H18z"
        fill="#64748b"
        stroke="#334155"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect x={40} y={18} width={6} height={18} rx={2} fill="#475569" />
      <path
        d="M40 18c0-4 3-8 7-10"
        stroke="#cbd5f5"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d="M22 40h4v4h-4zm8 0h4v4h-4zm8 0h4v4h-4z"
        fill="#e2e8f0"
      />
    </BasePanel>
  </svg>
);

export const ParlamenttitaloIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M18 44h28v10H18z"
        fill="#cbd5f5"
        stroke="#6366f1"
        strokeWidth={2}
      />
      <path
        d="M14 34h36v10H14z"
        fill="#818cf8"
        stroke="#4f46e5"
        strokeWidth={2}
      />
      <path
        d="M24 24c0-6 4-10 8-10s8 4 8 10v10H24z"
        fill="#a5b4fc"
        stroke="#6366f1"
        strokeWidth={2}
      />
      <path
        d="M30 18h4v-4h-4z"
        fill="#facc15"
      />
      <path
        d="M18 44l-4 4m36-4l4 4"
        stroke="#eef2ff"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M22 38h4m4 0h4m4 0h4"
        stroke="#eef2ff"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const PlaceholderIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <circle cx={32} cy={28} r={10} fill="#38bdf8" stroke="#0ea5e9" strokeWidth={2} />
      <path
        d="M28 42h8"
        stroke="#0ea5e9"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M28 26c0-2.5 2-4 4-4s4 1.5 4 3c0 1.5-1 2.5-2 3.5-1 1-2 1.5-2 3.5"
        stroke={accentLight}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BasePanel>
  </svg>
);

export const VihtaIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M28 36l-8 16"
        stroke="#92400e"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M20 22c4-6 12-8 18-4s8 12 4 18-12 8-18 4-8-12-4-18z"
        fill="#22c55e"
        stroke="#15803d"
        strokeWidth={2}
      />
      <path
        d="M22 24c4 4 10 6 18 6"
        stroke="#bbf7d0"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d="M32 34l6 6"
        stroke="#14532d"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const KaljaIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <rect
        x={20}
        y={18}
        width={20}
        height={28}
        rx={4}
        fill="#fde68a"
        stroke="#ca8a04"
        strokeWidth={2}
      />
      <rect
        x={28}
        y={14}
        width={8}
        height={6}
        rx={2}
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth={1.5}
      />
      <path
        d="M38 24h6a4 4 0 014 4v6a6 6 0 01-6 6"
        fill="none"
        stroke="#facc15"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M24 24h12"
        stroke="#78350f"
        strokeWidth={2}
      />
      <path
        d="M24 32h12"
        stroke="#78350f"
        strokeWidth={2}
      />
      <path
        d="M24 40h12"
        stroke="#78350f"
        strokeWidth={2}
      />
      <path
        d="M24 18c0-2 2-4 6-4s6 2 6 4"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.8}
      />
    </BasePanel>
  </svg>
);

export const KossuIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M26 14h12l-2 8v10c0 2.2 0.8 4.3 2.2 6l2.8 3.5c2 2.5 0.2 6.5-3.2 6.5H26.2c-3.4 0-5.2-4-3.2-6.5L25.8 38c1.4-1.7 2.2-3.8 2.2-6V22z"
        fill="#c4b5fd"
        stroke="#7c3aed"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M26 18h12"
        stroke="#ede9fe"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.75}
      />
      <path
        d="M30 14v-2a2 2 0 012-2h0a2 2 0 012 2v2"
        stroke="#ede9fe"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M24 36h16"
        stroke="#a855f7"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.6}
      />
    </BasePanel>
  </svg>
);

export const KiuluJaKauhaIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M20 28l4 18a8 8 0 007.9 6h0.2A8 8 0 0040 46l4-18z"
        fill="#fbbf24"
        stroke="#b45309"
        strokeWidth={2}
      />
      <path
        d="M18 28h28"
        stroke="#78350f"
        strokeWidth={2}
      />
      <path
        d="M44 22l6-6"
        stroke="#fde68a"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M44 22l-2 10"
        stroke="#78350f"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={50} cy={16} r={4} fill="#fde68a" stroke="#b45309" strokeWidth={2} />
      <path
        d="M24 34c2 4 6 6 8 6s6-2 8-6"
        stroke="#fde68a"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const SaunalakkiIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M22 40c0-10 4-20 10-20s10 10 10 20"
        fill="#f5d0fe"
        stroke="#d946ef"
        strokeWidth={2}
      />
      <path
        d="M20 42h24"
        stroke="#a21caf"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M32 20c0-2 1-4 3-4"
        stroke="#fdf4ff"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M24 38c2 2 5 3 8 3s6-1 8-3"
        stroke="#a855f7"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <circle cx={20} cy={42} r={2} fill="#fde68a" />
      <circle cx={44} cy={42} r={2} fill="#fde68a" />
    </BasePanel>
  </svg>
);

export const LampomittariIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <rect
        x={28}
        y={14}
        width={8}
        height={26}
        rx={4}
        fill="#f87171"
        stroke="#b91c1c"
        strokeWidth={2}
      />
      <circle cx={32} cy={44} r={10} fill="#fee2e2" stroke="#f87171" strokeWidth={3} />
      <circle cx={32} cy={44} r={6} fill="#f87171" />
      <path
        d="M32 22v12"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M26 20h12"
        stroke="#fecaca"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M26 28h12"
        stroke="#fecaca"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const BuranaIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <rect
        x={18}
        y={26}
        width={28}
        height={12}
        rx={6}
        fill="#fca5a5"
        stroke="#dc2626"
        strokeWidth={2}
      />
      <rect
        x={22}
        y={22}
        width={12}
        height={20}
        rx={6}
        fill="#fef08a"
        stroke="#eab308"
        strokeWidth={2}
        transform="rotate(-45 28 32)"
      />
      <rect
        x={30}
        y={22}
        width={12}
        height={20}
        rx={6}
        fill="#bfdbfe"
        stroke="#3b82f6"
        strokeWidth={2}
        transform="rotate(45 36 32)"
      />
      <path
        d="M24 32h16"
        stroke={accentLight}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
    </BasePanel>
  </svg>
);

export const SaunatuoksuIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M32 16c4 6 10 14 10 22 0 6-4 12-10 12s-10-6-10-12c0-8 6-16 10-22z"
        fill="#a7f3d0"
        stroke="#14b8a6"
        strokeWidth={2}
      />
      <path
        d="M28 30c0 2 1 4 4 4s4-2 4-4"
        stroke="#0f766e"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M24 38c2 2 5 4 8 4s6-2 8-4"
        stroke="#5eead4"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <circle cx={24} cy={24} r={3} fill="#99f6e4" />
      <circle cx={40} cy={24} r={3} fill="#99f6e4" />
    </BasePanel>
  </svg>
);

export const SaunaklonkkuIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M22 44c0-10 4-18 10-18s10 8 10 18c0 6-4 10-10 10s-10-4-10-10z"
        fill="#c7d2fe"
        stroke="#4338ca"
        strokeWidth={2}
      />
      <path
        d="M26 30c0-4 3-8 6-8s6 4 6 8"
        stroke="#6366f1"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={28} cy={40} r={2} fill="#312e81" />
      <circle cx={36} cy={40} r={2} fill="#312e81" />
      <path
        d="M30 46c1.5 1 2.5 1 4 0"
        stroke="#312e81"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M32 22l-3-6m3 6l3-6"
        stroke="#fef3c7"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const UraanikivetIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M22 46l4-18 10-8 6 10-4 18-10 8z"
        fill="#bef264"
        stroke="#65a30d"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M30 28l4 8"
        stroke="#3f6212"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M22 46l12-10 8 4"
        stroke="#d9f99d"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.7}
      />
      <circle cx={44} cy={22} r={4} fill="#bef264" stroke="#3f6212" strokeWidth={2} />
      <path
        d="M44 18v-4m0 24v-4m-4-8h-4m16 0h-4"
        stroke="#d9f99d"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const KamehamehaIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <circle cx={32} cy={32} r={12} fill="#38bdf8" stroke="#0ea5e9" strokeWidth={3} />
      <circle cx={32} cy={32} r={6} fill="#bae6fd" stroke="#38bdf8" strokeWidth={2} />
      <path
        d="M18 32c6 0 10-6 14-10s8-6 14-6"
        stroke="#67e8f9"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M18 24c4 0 8-2 12-6"
        stroke="#bae6fd"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.5}
      />
      <path
        d="M18 40c6 0 10 6 14 10s8 6 14 6"
        stroke="#67e8f9"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.6}
      />
    </BasePanel>
  </svg>
);

export const HawkinginLoylygeneraattoriIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <rect
        x={18}
        y={20}
        width={28}
        height={24}
        rx={6}
        fill="#a855f7"
        stroke="#7c3aed"
        strokeWidth={2}
      />
      <rect x={24} y={26} width={16} height={12} rx={2} fill="#f5d0fe" />
      <path
        d="M24 26l-6-6"
        stroke="#ede9fe"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M40 26l6-6"
        stroke="#ede9fe"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M28 42h8"
        stroke="#ede9fe"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={32} cy={32} r={3} fill="#7c3aed" />
      <path
        d="M20 34h-4m32 0h-4"
        stroke="#c4b5fd"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

export const TorchIcon = (props: IconProps) => (
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" focusable="false" {...props}>
    <BasePanel>
      <path
        d="M32 14c4 4 8 8 8 12a8 8 0 11-16 0c0-4 4-8 8-12z"
        fill="#f97316"
        stroke="#c2410c"
        strokeWidth={2}
      />
      <path
        d="M28 44l-2 10h12l-2-10"
        fill="#9ca3af"
        stroke="#4b5563"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M30 34h4l-1 10h-2z"
        fill="#facc15"
      />
      <path
        d="M28 24c0-2 2-4 4-4s4 2 4 4"
        stroke="#fde68a"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d="M24 18c0 2 2 4 2 6m12-6c0 2-2 4-2 6"
        stroke="#fed7aa"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </BasePanel>
  </svg>
);

// The icon map is consumed outside the React component tree, so we deliberately
// export this non-component collection from the same module as the icon
// components. Fast refresh is unaffected because the export is static.
// eslint-disable-next-line react-refresh/only-export-components
export const iconMap = {
  sauna: SaunaIcon,
  kylakauppa: KylakauppaIcon,
  alko: AlkoIcon,
  ensiapu: EnsiapuIcon,
  baari: BaariIcon,
  cittari: CittariIcon,
  sateri: SateriIcon,
  kasino: KasinoIcon,
  kirkko: KirkkoIcon,
  vankila: VankilaIcon,
  bordelli: BordelliIcon,
  kampus: KampusIcon,
  tehdas: TehdasIcon,
  parlamenttitalo: ParlamenttitaloIcon,
  placeholder: PlaceholderIcon,
  vihta: VihtaIcon,
  kalja: KaljaIcon,
  kossu: KossuIcon,
  kiulu_ja_kauha: KiuluJaKauhaIcon,
  saunalakki: SaunalakkiIcon,
  lampomittari: LampomittariIcon,
  burana: BuranaIcon,
  saunatuoksu: SaunatuoksuIcon,
  saunaklonkku: SaunaklonkkuIcon,
  uraanikivet: UraanikivetIcon,
  kamehameha: KamehamehaIcon,
  hawkingin_loylygeneraattori: HawkinginLoylygeneraattoriIcon,
  torch: TorchIcon,
} as const;

export type IconKey = keyof typeof iconMap;

