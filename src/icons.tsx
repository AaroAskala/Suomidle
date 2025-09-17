import { memo, type ReactNode, type SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

const palette = {
  wood: '#d97706',
  darkWood: '#92400e',
  stone: '#9ca3af',
  roof: '#ef4444',
  glass: '#bae6fd',
  leaf: '#22c55e',
  leafShadow: '#15803d',
  foam: '#fef3c7',
  beer: '#f59e0b',
  bottle: '#38bdf8',
  bottleDark: '#0ea5e9',
  hat: '#facc15',
  ember: '#f97316',
  energy: '#a855f7',
  neon: '#f472b6',
  slate: '#475569',
  charcoal: '#1f2937',
  lime: '#84cc16',
  lava: '#fb7185',
  metal: '#94a3b8',
  copper: '#f97316',
  accent: '#fcd34d',
  aqua: '#22d3ee',
  crystal: '#4ade80',
};

type IconFactory = (props: IconProps) => JSX.Element;

const createIcon = (children: ReactNode): IconFactory =>
  memo((props: IconProps) => (
    <svg
      role="img"
      viewBox="0 0 64 64"
      width={64}
      height={64}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  ));

const SaunaIcon = createIcon(
  <>
    <rect x={10} y={26} width={44} height={28} rx={3} fill={palette.wood} stroke={palette.darkWood} strokeWidth={3} />
    <polygon points="8,26 32,12 56,26" fill={palette.roof} stroke={palette.darkWood} strokeWidth={3} />
    <rect x={44} y={18} width={6} height={10} fill={palette.darkWood} />
    <rect x={28} y={34} width={12} height={20} rx={2} fill={palette.charcoal} />
    <path d="M20 20c6 4 0 8 6 12" stroke={palette.accent} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M26 16c5 4-1 8 4 12" stroke={palette.accent} strokeWidth={3} strokeLinecap="round" fill="none" />
  </>
);

const KylakauppaIcon = createIcon(
  <>
    <rect x={8} y={28} width={48} height={26} rx={4} fill={palette.stone} stroke={palette.slate} strokeWidth={3} />
    <rect x={12} y={20} width={40} height={10} fill={palette.roof} />
    <path d="M12 20h40l-4 8H16z" fill={palette.ember} opacity={0.6} />
    <rect x={16} y={36} width={12} height={10} fill={palette.glass} stroke={palette.slate} strokeWidth={2} />
    <rect x={36} y={36} width={12} height={18} fill={palette.charcoal} rx={2} />
  </>
);

const AlkoIcon = createIcon(
  <>
    <path
      d="M30 10h4l2 12v24c0 4-4 8-8 8s-8-4-8-8V22l2-12h8z"
      fill={palette.bottle}
      stroke={palette.bottleDark}
      strokeWidth={3}
    />
    <rect x={26} y={12} width={12} height={6} fill={palette.bottleDark} />
    <circle cx={32} cy={32} r={8} fill={palette.accent} opacity={0.7} />
  </>
);

const EnsiapuIcon = createIcon(
  <>
    <rect x={12} y={18} width={40} height={32} rx={6} fill="#f87171" stroke="#b91c1c" strokeWidth={3} />
    <rect x={28} y={24} width={8} height={20} fill="#fff" />
    <rect x={22} y={30} width={20} height={8} fill="#fff" />
  </>
);

const BaariIcon = createIcon(
  <>
    <rect x={20} y={18} width={24} height={32} rx={12} fill={palette.beer} stroke={palette.copper} strokeWidth={3} />
    <rect x={20} y={18} width={24} height={8} rx={4} fill={palette.foam} />
    <path d="M44 24h6v18c0 4-3 7-7 7" stroke={palette.copper} strokeWidth={4} strokeLinecap="round" fill="none" />
    <circle cx={32} cy={38} r={6} fill={palette.foam} opacity={0.5} />
  </>
);

const CittariIcon = createIcon(
  <>
    <rect x={8} y={24} width={48} height={28} rx={4} fill={palette.slate} />
    <rect x={12} y={12} width={40} height={12} fill={palette.metal} />
    <g fill={palette.glass}>
      <rect x={14} y={30} width={8} height={8} />
      <rect x={26} y={30} width={8} height={8} />
      <rect x={38} y={30} width={8} height={8} />
      <rect x={14} y={40} width={8} height={8} />
      <rect x={26} y={40} width={8} height={8} />
      <rect x={38} y={40} width={8} height={8} />
    </g>
  </>
);

const SateriIcon = createIcon(
  <>
    <rect x={10} y={28} width={44} height={22} rx={4} fill="#fcd34d" stroke={palette.darkWood} strokeWidth={3} />
    <rect x={18} y={18} width={28} height={12} fill="#fde68a" stroke={palette.darkWood} strokeWidth={3} />
    <path d="M10 28h44" stroke={palette.darkWood} strokeWidth={3} />
    <rect x={24} y={34} width={16} height={16} fill={palette.glass} stroke={palette.darkWood} strokeWidth={3} />
  </>
);

const KasinoIcon = createIcon(
  <>
    <rect x={12} y={12} width={40} height={40} rx={6} fill={palette.neon} opacity={0.8} />
    <circle cx={32} cy={32} r={14} fill={palette.energy} stroke={palette.charcoal} strokeWidth={3} />
    <g fill={palette.charcoal}>
      <circle cx={32} cy={22} r={3} />
      <circle cx={22} cy={32} r={3} />
      <circle cx={42} cy={32} r={3} />
      <circle cx={32} cy={42} r={3} />
      <circle cx={26} cy={26} r={3} />
      <circle cx={38} cy={38} r={3} />
    </g>
  </>
);

const KirkkoIcon = createIcon(
  <>
    <polygon points="32,10 40,20 40,52 24,52 24,20" fill="#e5e7eb" stroke={palette.slate} strokeWidth={3} />
    <polygon points="16,26 48,26 48,52 16,52" fill="#cbd5f5" stroke={palette.slate} strokeWidth={3} />
    <rect x={28} y={32} width={8} height={16} fill={palette.glass} stroke={palette.slate} strokeWidth={2} />
    <path d="M32 10v-6" stroke={palette.slate} strokeWidth={3} strokeLinecap="round" />
    <path d="M28 8h8" stroke={palette.slate} strokeWidth={3} strokeLinecap="round" />
  </>
);

const VankilaIcon = createIcon(
  <>
    <rect x={12} y={18} width={40} height={32} rx={4} fill={palette.charcoal} />
    <rect x={16} y={22} width={32} height={24} fill={palette.slate} />
    <g stroke={palette.charcoal} strokeWidth={3}>
      <line x1={20} y1={22} x2={20} y2={46} />
      <line x1={28} y1={22} x2={28} y2={46} />
      <line x1={36} y1={22} x2={36} y2={46} />
      <line x1={44} y1={22} x2={44} y2={46} />
    </g>
  </>
);

const BordelliIcon = createIcon(
  <>
    <rect x={14} y={18} width={36} height={34} rx={6} fill={palette.neon} opacity={0.75} />
    <path
      d="M32 24c-5-6-14-2-14 6 0 8 14 14 14 14s14-6 14-14c0-8-9-12-14-6z"
      fill={palette.lava}
      stroke={palette.charcoal}
      strokeWidth={3}
    />
    <rect x={28} y={38} width={8} height={12} rx={1.5} fill={palette.charcoal} opacity={0.85} />
  </>
);

const KampusIcon = createIcon(
  <>
    <rect x={12} y={18} width={40} height={28} rx={4} fill="#bfdbfe" stroke={palette.slate} strokeWidth={3} />
    <rect x={20} y={14} width={24} height={10} fill="#93c5fd" stroke={palette.slate} strokeWidth={3} />
    <rect x={24} y={32} width={16} height={14} fill={palette.glass} stroke={palette.slate} strokeWidth={3} />
    <path d="M16 46h32" stroke={palette.slate} strokeWidth={3} />
  </>
);

const TehdasIcon = createIcon(
  <>
    <rect x={10} y={30} width={44} height={22} fill={palette.metal} stroke={palette.charcoal} strokeWidth={3} />
    <polygon points="10,30 26,20 26,30" fill={palette.charcoal} />
    <polygon points="26,30 42,20 42,30" fill={palette.charcoal} />
    <rect x={18} y={22} width={6} height={10} fill={palette.charcoal} />
    <rect x={34} y={18} width={6} height={14} fill={palette.charcoal} />
    <path d="M20 14c4 4 0 8 4 12" stroke={palette.stone} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M36 12c4 4 0 8 4 12" stroke={palette.stone} strokeWidth={3} strokeLinecap="round" fill="none" />
  </>
);

const ParlamenttitaloIcon = createIcon(
  <>
    <rect x={10} y={34} width={44} height={16} rx={3} fill="#e2e8f0" stroke={palette.slate} strokeWidth={3} />
    <rect x={18} y={28} width={28} height={6} fill="#cbd5f5" />
    <ellipse cx={32} cy={24} rx={12} ry={8} fill="#f1f5f9" stroke={palette.slate} strokeWidth={3} />
    <path d="M18 44h28" stroke={palette.slate} strokeWidth={3} />
    <rect x={30} y={14} width={4} height={10} fill={palette.slate} />
  </>
);

const VihtaIcon = createIcon(
  <>
    <path
      d="M32 42c4-10 2-20-6-26"
      stroke={palette.leafShadow}
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
    <g fill={palette.leaf}>
      <circle cx={26} cy={20} r={6} />
      <circle cx={20} cy={24} r={6} />
      <circle cx={30} cy={26} r={6} />
      <circle cx={22} cy={16} r={6} />
      <circle cx={34} cy={20} r={6} />
    </g>
    <rect x={30} y={42} width={4} height={12} rx={2} fill={palette.wood} />
  </>
);

const KaljaIcon = createIcon(
  <>
    <rect x={18} y={18} width={24} height={30} rx={10} fill={palette.beer} stroke={palette.copper} strokeWidth={3} />
    <rect x={18} y={18} width={24} height={8} rx={4} fill={palette.foam} />
    <path d="M42 26h6v14c0 4-3 7-7 7" stroke={palette.copper} strokeWidth={4} strokeLinecap="round" fill="none" />
    <rect x={24} y={30} width={12} height={10} rx={4} fill={palette.foam} opacity={0.4} />
  </>
);

const KossuIcon = createIcon(
  <>
    <path
      d="M26 10h12l2 12v20c0 6-5 10-8 10s-8-4-8-10V22l2-12z"
      fill="#f0f9ff"
      stroke={palette.bottleDark}
      strokeWidth={3}
    />
    <rect x={26} y={12} width={12} height={6} fill={palette.bottleDark} />
    <path d="M28 30h8" stroke={palette.bottleDark} strokeWidth={3} strokeLinecap="round" />
  </>
);

const KiuluJaKauhaIcon = createIcon(
  <>
    <ellipse cx={28} cy={40} rx={14} ry={10} fill={palette.wood} stroke={palette.darkWood} strokeWidth={3} />
    <ellipse cx={28} cy={36} rx={12} ry={6} fill={palette.foam} opacity={0.8} />
    <rect x={38} y={14} width={6} height={24} rx={3} fill={palette.darkWood} />
    <circle cx={41} cy={12} r={4} fill={palette.darkWood} />
  </>
);

const SaunalakkiIcon = createIcon(
  <>
    <path
      d="M32 16c-12 0-18 12-20 28h40c-2-16-8-28-20-28z"
      fill={palette.hat}
      stroke="#ca8a04"
      strokeWidth={3}
    />
    <circle cx={32} cy={18} r={4} fill={palette.accent} />
  </>
);

const LampomittariIcon = createIcon(
  <>
    <rect x={26} y={10} width={12} height={32} rx={6} fill="#f4f4f5" stroke={palette.slate} strokeWidth={3} />
    <rect x={30} y={14} width={4} height={24} fill={palette.ember} />
    <circle cx={32} cy={46} r={10} fill={palette.ember} stroke={palette.slate} strokeWidth={3} />
  </>
);

const BuranaIcon = createIcon(
  <>
    <rect x={14} y={20} width={36} height={24} rx={6} fill="#fee2e2" stroke="#fca5a5" strokeWidth={3} />
    <rect x={20} y={24} width={8} height={8} rx={3} fill="#fecaca" />
    <rect x={36} y={24} width={8} height={8} rx={3} fill="#fecaca" />
    <rect x={20} y={34} width={8} height={8} rx={3} fill="#fecaca" />
    <rect x={36} y={34} width={8} height={8} rx={3} fill="#fecaca" />
  </>
);

const SaunatuoksuIcon = createIcon(
  <>
    <path d="M26 12h12l2 12-8 30h-4l-8-30z" fill={palette.aqua} stroke={palette.bottleDark} strokeWidth={3} />
    <path d="M32 18v-6" stroke={palette.bottleDark} strokeWidth={3} strokeLinecap="round" />
    <path d="M28 28c4 4 0 8 4 12" stroke={palette.aqua} strokeWidth={3} strokeLinecap="round" fill="none" />
    <circle cx={32} cy={42} r={6} fill={palette.accent} opacity={0.6} />
  </>
);

const SaunaklonkkuIcon = createIcon(
  <>
    <rect x={12} y={28} width={40} height={12} rx={4} fill={palette.wood} stroke={palette.darkWood} strokeWidth={3} />
    <path d="M12 34h40" stroke={palette.darkWood} strokeWidth={3} strokeLinecap="round" />
    <circle cx={20} cy={34} r={2} fill={palette.darkWood} />
    <circle cx={32} cy={34} r={2} fill={palette.darkWood} />
    <circle cx={44} cy={34} r={2} fill={palette.darkWood} />
  </>
);

const UraanikivetIcon = createIcon(
  <>
    <path d="M18 38l6-18 12-8 10 16-4 18-16 4z" fill={palette.crystal} stroke="#166534" strokeWidth={3} />
    <circle cx={26} cy={28} r={4} fill="#bbf7d0" />
    <circle cx={38} cy={34} r={5} fill="#bbf7d0" />
    <circle cx={30} cy={40} r={6} fill="#bbf7d0" opacity={0.6} />
  </>
);

const KamehamehaIcon = createIcon(
  <>
    <circle cx={32} cy={32} r={14} fill={palette.energy} opacity={0.6} />
    <circle cx={32} cy={32} r={10} fill={palette.aqua} opacity={0.8} />
    <path
      d="M18 28c6-8 16-12 26-6"
      stroke={palette.energy}
      strokeWidth={4}
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M18 36c8 6 20 8 28 0"
      stroke={palette.neon}
      strokeWidth={4}
      strokeLinecap="round"
      fill="none"
    />
  </>
);

const HawkinginLoylygeneraattoriIcon = createIcon(
  <>
    <rect x={14} y={18} width={36} height={32} rx={6} fill={palette.charcoal} />
    <circle cx={32} cy={34} r={10} fill={palette.energy} stroke={palette.aqua} strokeWidth={3} />
    <circle cx={32} cy={34} r={6} fill={palette.aqua} opacity={0.8} />
    <path d="M20 20l4-8h16l4 8" stroke={palette.aqua} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M22 46h20" stroke={palette.aqua} strokeWidth={3} strokeLinecap="round" />
  </>
);

const TorchIcon = createIcon(
  <>
    <path d="M28 12c4 6 12 8 8 18s-16 10-16 0 4-12 8-18z" fill={palette.ember} stroke="#c2410c" strokeWidth={3} />
    <rect x={28} y={36} width={8} height={16} rx={2} fill={palette.darkWood} />
    <rect x={26} y={48} width={12} height={6} rx={2} fill={palette.darkWood} />
  </>
);

const DefaultIcon = createIcon(
  <>
    <circle cx={32} cy={32} r={20} fill={palette.glass} stroke={palette.slate} strokeWidth={3} />
    <path d="M22 32l8 8 12-16" stroke={palette.slate} strokeWidth={4} strokeLinecap="round" fill="none" />
  </>
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
  default: DefaultIcon,
} as const;

export type IconKey = Exclude<keyof typeof iconMap, 'default'>;

export const getIconComponent = (key?: string) => {
  if (!key) return iconMap.default;
  const icon = iconMap[key as keyof typeof iconMap];
  return icon ?? iconMap.default;
};
