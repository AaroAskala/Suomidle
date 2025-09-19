import type { ReactElement, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;
export type IconComponent = (props: IconProps) => ReactElement;

const baseSvgProps: IconProps = {
  viewBox: '0 0 64 64',
  xmlns: 'http://www.w3.org/2000/svg',
};

const SaunaIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fef3c7" />
    <path
      d="M16 30L32 18l16 12v18H16V30Z"
      fill="#f97316"
      stroke="#92400e"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path d="M12 30L32 16l20 14" stroke="#92400e" strokeWidth={3} strokeLinecap="round" />
    <rect x={26} y={34} width={12} height={12} rx={2} fill="#fde68a" stroke="#92400e" strokeWidth={2} />
    <path
      d="M42 22c-1.5-2-1.5-4 0-6m6 6c-1.5-2-1.5-4 0-6"
      stroke="#6b7280"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

const KylakauppaIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#dcfce7" />
    <rect x={14} y={26} width={36} height={22} rx={4} fill="#34d399" stroke="#047857" strokeWidth={2} />
    <path
      d="M14 26h36l-4 8H18l-4-8Z"
      fill="#bbf7d0"
      stroke="#047857"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <rect x={20} y={36} width={10} height={12} rx={2} fill="#ecfeff" stroke="#0f766e" strokeWidth={2} />
    <rect x={34} y={34} width={12} height={6} rx={2} fill="#f97316" />
    <circle cx={40} cy={46} r={3} fill="#10b981" stroke="#047857" strokeWidth={2} />
  </svg>
);

const AlkoIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fee2e2" />
    <rect x={20} y={22} width={24} height={28} rx={6} fill="#f87171" stroke="#7f1d1d" strokeWidth={2} />
    <path
      d="M32 12c-2 0-4 1.6-4 4v4h8v-4c0-2.4-2-4-4-4Z"
      fill="#7f1d1d"
    />
    <path d="M28 30h8v12c0 2.2-1.8 4-4 4s-4-1.8-4-4V30Z" fill="#fee2e2" />
    <circle cx={32} cy={32} r={4} fill="#f1f5f9" stroke="#7f1d1d" strokeWidth={2} />
  </svg>
);

const EnsiapuIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#f8fafc" />
    <rect x={20} y={18} width={24} height={8} rx={2} fill="#ef4444" />
    <rect x={28} y={18} width={8} height={28} rx={2} fill="#ef4444" />
    <rect x={14} y={28} width={36} height={20} rx={4} stroke="#0f172a" strokeWidth={2} fill="none" />
    <circle cx={24} cy={38} r={4} fill="#38bdf8" />
    <circle cx={40} cy={38} r={4} fill="#38bdf8" />
  </svg>
);

const BaariIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fef9c3" />
    <rect x={18} y={24} width={28} height={24} rx={8} fill="#fde68a" stroke="#b45309" strokeWidth={2} />
    <path
      d="M22 28h20l-2 10c-.6 3-2.4 6-8 6s-7.4-3-8-6l-2-10Z"
      fill="#f97316"
      opacity={0.85}
    />
    <rect x={26} y={16} width={16} height={10} rx={4} fill="#fff7ed" stroke="#b45309" strokeWidth={2} />
    <path d="M32 48v6" stroke="#92400e" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

const CittariIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#e0f2fe" />
    <path
      d="M16 22h32l-3 18H23l-3-12H16"
      fill="#38bdf8"
      stroke="#0c4a6e"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <circle cx={26} cy={46} r={3} fill="#0ea5e9" stroke="#0c4a6e" strokeWidth={2} />
    <circle cx={42} cy={46} r={3} fill="#0ea5e9" stroke="#0c4a6e" strokeWidth={2} />
    <path d="M18 30h18" stroke="#0c4a6e" strokeWidth={2} strokeLinecap="round" />
    <path d="M20 18h12" stroke="#0c4a6e" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

const SateriIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#ede9fe" />
    <rect x={16} y={20} width={32} height={28} rx={6} fill="#c4b5fd" stroke="#5b21b6" strokeWidth={2} />
    <rect x={24} y={12} width={16} height={10} rx={3} fill="#a78bfa" stroke="#5b21b6" strokeWidth={2} />
    <rect x={22} y={28} width={8} height={12} fill="#ede9fe" />
    <rect x={34} y={28} width={8} height={12} fill="#ede9fe" />
    <rect x={28} y={36} width={8} height={12} fill="#ddd6fe" />
  </svg>
);

const KasinoIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fff1f2" />
    <circle cx={32} cy={34} r={18} fill="#f9a8d4" stroke="#9d174d" strokeWidth={2} />
    <circle cx={32} cy={34} r={10} fill="#fdf2f8" stroke="#9d174d" strokeWidth={2} />
    <circle cx={32} cy={34} r={4} fill="#9d174d" />
    <circle cx={32} cy={16} r={4} fill="#f43f5e" />
    <circle cx={16} cy={34} r={4} fill="#f43f5e" />
    <circle cx={48} cy={34} r={4} fill="#f43f5e" />
    <circle cx={32} cy={52} r={4} fill="#f43f5e" />
  </svg>
);

const KirkkoIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#f8fafc" />
    <path
      d="M32 14l10 12v20H22V26l10-12Z"
      fill="#cbd5f5"
      stroke="#1d4ed8"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <rect x={28} y={36} width={8} height={10} fill="#e0f2fe" />
    <path d="M32 18v-6M28 16h8" stroke="#1d4ed8" strokeWidth={3} strokeLinecap="round" />
  </svg>
);

const VankilaIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#e2e8f0" />
    <rect x={16} y={22} width={32} height={26} rx={4} fill="#94a3b8" stroke="#1f2937" strokeWidth={2} />
    <path d="M22 22v26m6-26v26m6-26v26m6-26v26" stroke="#1f2937" strokeWidth={3} strokeLinecap="round" />
    <rect x={24} y={30} width={8} height={6} rx={2} fill="#f8fafc" />
  </svg>
);

const BordelliIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#ffe4e6" />
    <path
      d="M32 48s-12-7.4-12-16c0-4.4 3.2-7 6.6-7 2.4 0 4.6 1.4 5.4 3.4.8-2 3-3.4 5.4-3.4 3.4 0 6.6 2.6 6.6 7 0 8.6-12 16-12 16Z"
      fill="#fb7185"
      stroke="#be123c"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <circle cx={24} cy={22} r={3} fill="#fb7185" />
    <circle cx={40} cy={22} r={3} fill="#fb7185" />
  </svg>
);

const KampusIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#e0f2fe" />
    <path
      d="M12 24L32 14l20 10-20 10-20-10Z"
      fill="#38bdf8"
      stroke="#075985"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <rect x={18} y={32} width={28} height={14} rx={3} fill="#bae6fd" stroke="#075985" strokeWidth={2} />
    <path d="M32 24v22" stroke="#075985" strokeWidth={3} strokeLinecap="round" />
    <path d="M26 46h12" stroke="#075985" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const TehdasIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#f1f5f9" />
    <path
      d="M16 40l0-12 8 6v-6l8 6v-6l16 12v12H16V40Z"
      fill="#94a3b8"
      stroke="#1e293b"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <rect x={20} y={20} width={8} height={10} rx={2} fill="#cbd5f5" stroke="#1e293b" strokeWidth={2} />
    <path d="M24 20v-6" stroke="#1e293b" strokeWidth={3} strokeLinecap="round" />
    <path
      d="M24 12c0 2 4 2 4 4s-4 2-4 4"
      stroke="#64748b"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <rect x={24} y={42} width={6} height={6} rx={1} fill="#e2e8f0" />
    <rect x={34} y={42} width={6} height={6} rx={1} fill="#e2e8f0" />
    <rect x={44} y={42} width={6} height={6} rx={1} fill="#e2e8f0" />
  </svg>
);

const ParlamenttitaloIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#ede9fe" />
    <path
      d="M32 16c8 0 14 6 14 14v4h4v14H14V34h4v-4c0-8 6-14 14-14Z"
      fill="#ddd6fe"
      stroke="#4c1d95"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <rect x={24} y={34} width={16} height={12} rx={2} fill="#f5f3ff" stroke="#4c1d95" strokeWidth={2} />
    <path d="M32 12v6" stroke="#4c1d95" strokeWidth={3} strokeLinecap="round" />
    <circle cx={32} cy={12} r={3} fill="#4c1d95" />
  </svg>
);

const PlaceholderIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#e5e7eb" />
    <path
      d="M32 24c-4 0-7 2.6-7 6h4c0-1.4 1.2-2.5 3-2.5 1.6 0 3 1 3 2.6 0 1.2-.8 2.1-2 2.7-2.4 1.2-4 3-4 6v1h4v-1c0-1.2.8-2 2.4-2.8C37.4 35 39 32.8 39 30c0-3.8-3.2-6-7-6Z"
      fill="#374151"
    />
    <circle cx={32} cy={44} r={2} fill="#374151" />
  </svg>
);

const VihtaIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#dcfce7" />
    <path
      d="M30 46 20 36c-4-4-4-10 0-14s10-4 14 0l6 6"
      fill="#bbf7d0"
      stroke="#166534"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path
      d="M44 48 30 34"
      stroke="#166534"
      strokeWidth={3}
      strokeLinecap="round"
    />
    <path
      d="m18 28 8-2m-6 6 8-2m-6 6 8-2"
      stroke="#15803d"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </svg>
);

const KaljaIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fef9c3" />
    <rect x={20} y={20} width={20} height={28} rx={8} fill="#fde68a" stroke="#b45309" strokeWidth={2} />
    <rect x={36} y={24} width={8} height={18} rx={4} fill="#fde68a" stroke="#b45309" strokeWidth={2} />
    <path d="M24 24h12v14c0 4-2 8-6 8s-6-4-6-8V24Z" fill="#f59e0b" opacity={0.8} />
    <rect x={20} y={16} width={20} height={8} rx={4} fill="#fff7ed" stroke="#b45309" strokeWidth={2} />
  </svg>
);

const KossuIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fee2e2" />
    <path
      d="M26 14h12l-2 10v18c0 3.3-2.7 6-6 6s-6-2.7-6-6V24l-2-10h4Z"
      fill="#f87171"
      stroke="#7f1d1d"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <rect x={26} y={22} width={12} height={8} fill="#fee2e2" opacity={0.7} />
    <rect x={28} y={34} width={8} height={10} rx={3} fill="#fee2e2" stroke="#7f1d1d" strokeWidth={2} />
    <circle cx={32} cy={18} r={4} fill="#fef2f2" stroke="#7f1d1d" strokeWidth={2} />
  </svg>
);

const KiuluJaKauhaIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#ede9fe" />
    <path
      d="M20 42c0-8 4-14 12-14s12 6 12 14"
      fill="#c7d2fe"
    />
    <path
      d="M20 42c0-8 4-14 12-14s12 6 12 14"
      stroke="#3730a3"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <path d="M20 42h24l-2 6H22l-2-6Z" fill="#a5b4fc" stroke="#3730a3" strokeWidth={2} />
    <path d="M36 22l8-6" stroke="#3730a3" strokeWidth={3} strokeLinecap="round" />
    <circle cx={44} cy={16} r={4} fill="#c7d2fe" stroke="#3730a3" strokeWidth={2} />
  </svg>
);

const SaunalakkiIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fef3c7" />
    <path
      d="M32 18c-8 0-14 10-16 22h32c-2-12-8-22-16-22Z"
      fill="#fcd34d"
      stroke="#b45309"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path d="M28 14h8l2 6h-12l2-6Z" fill="#fde68a" stroke="#b45309" strokeWidth={2} />
    <path d="M20 40h24" stroke="#b45309" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const LampomittariIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fee2e2" />
    <rect x={28} y={14} width={8} height={28} rx={4} fill="#fecaca" stroke="#b91c1c" strokeWidth={2} />
    <rect x={26} y={24} width={12} height={20} rx={6} fill="#fef2f2" stroke="#b91c1c" strokeWidth={2} />
    <circle cx={32} cy={46} r={8} fill="#fca5a5" stroke="#b91c1c" strokeWidth={2} />
    <path d="M32 22v12" stroke="#b91c1c" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const BuranaIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#f8fafc" />
    <rect x={18} y={24} width={12} height={20} rx={6} fill="#bae6fd" stroke="#1d4ed8" strokeWidth={2} />
    <rect x={34} y={24} width={12} height={20} rx={6} fill="#fca5a5" stroke="#b91c1c" strokeWidth={2} />
    <rect x={16} y={32} width={32} height={6} rx={3} fill="#e2e8f0" />
  </svg>
);

const SaunatuoksuIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#f3e8ff" />
    <rect x={24} y={16} width={16} height={8} rx={3} fill="#c4b5fd" stroke="#6d28d9" strokeWidth={2} />
    <path
      d="M22 26c0-2.2 1.8-4 4-4h12c2.2 0 4 1.8 4 4v14c0 5.5-4.5 10-10 10s-10-4.5-10-10V26Z"
      fill="#ddd6fe"
      stroke="#6d28d9"
      strokeWidth={2}
    />
    <path d="M28 12c0 2-2 2-2 4s2 2 2 4" stroke="#7c3aed" strokeWidth={2} strokeLinecap="round" />
    <path d="M36 12c0 2-2 2-2 4s2 2 2 4" stroke="#7c3aed" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const SaunaklonkkuIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#cffafe" />
    <circle cx={32} cy={28} r={8} fill="#22d3ee" stroke="#0f766e" strokeWidth={2} />
    <path
      d="M24 46c0-4.4 3.6-8 8-8s8 3.6 8 8"
      fill="#a5f3fc"
      stroke="#0f766e"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <path d="M28 28h8" stroke="#0f766e" strokeWidth={2} strokeLinecap="round" />
    <circle cx={29} cy={26} r={1.5} fill="#0f766e" />
    <circle cx={35} cy={26} r={1.5} fill="#0f766e" />
  </svg>
);

const UraanikivetIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#ecfccb" />
    <path
      d="M20 46 26 26l12-4 6 18-8 10h-8l-8-4Z"
      fill="#bef264"
      stroke="#3f6212"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <path d="m32 22 6 4" stroke="#3f6212" strokeWidth={2} strokeLinecap="round" />
    <circle cx={26} cy={34} r={2} fill="#3f6212" />
    <circle cx={38} cy={38} r={2} fill="#3f6212" />
  </svg>
);

const KamehamehaIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#e0f2fe" />
    <circle cx={32} cy={34} r={12} fill="#38bdf8" stroke="#1d4ed8" strokeWidth={2} />
    <circle cx={32} cy={34} r={6} fill="#bfdbfe" />
    <path
      d="M18 28c4-6 9.4-10 14-10s10 4 14 10"
      stroke="#1d4ed8"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <path d="M32 16v6" stroke="#1d4ed8" strokeWidth={2} strokeLinecap="round" />
    <path d="M20 42c4 4 7 6 12 6s8-2 12-6" stroke="#1d4ed8" strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const HawkinginLoylygeneraattoriIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#f5f3ff" />
    <circle cx={32} cy={34} r={16} fill="#e0e7ff" stroke="#4c1d95" strokeWidth={2} />
    <circle cx={32} cy={34} r={8} fill="#c7d2fe" stroke="#4c1d95" strokeWidth={2} />
    <path
      d="M32 18v8m0 16v8m-16-16h8m16 0h8"
      stroke="#4c1d95"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <circle cx={32} cy={34} r={3} fill="#4c1d95" />
  </svg>
);

const TorchIcon: IconComponent = (props) => (
  <svg {...baseSvgProps} {...props}>
    <rect x={6} y={10} width={52} height={48} rx={12} fill="#fee2e2" />
    <path
      d="M32 14c-6 4-8 10-4 14 2 2 4 2 4 2s2 0 4-2c4-4 2-10-4-14Z"
      fill="#f97316"
      stroke="#7c2d12"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <rect x={28} y={30} width={8} height={16} rx={2} fill="#78350f" />
    <path d="M30 46h4l-2 6-2-6Z" fill="#92400e" />
  </svg>
);

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
} as const satisfies Record<string, IconComponent>;

export type IconKey = keyof typeof iconMap;
