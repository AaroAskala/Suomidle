const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hashString = (value: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash >>> 0;
};

const createRng = (seedValue: string) => {
  let state = hashString(seedValue) || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

interface HslColor {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

const hslToHex = ({ h, s, l }: HslColor) => {
  const hue = (h % 360) / 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const hueToRgb = (t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };
  const r = Math.round(hueToRgb(hue + 1 / 3) * 255);
  const g = Math.round(hueToRgb(hue) * 255);
  const b = Math.round(hueToRgb(hue - 1 / 3) * 255);
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rotateHue = (color: HslColor, rotation: number): HslColor => ({
  h: (color.h + rotation + 360) % 360,
  s: color.s,
  l: color.l,
});

const adjustLightness = (color: HslColor, delta: number): HslColor => ({
  h: color.h,
  s: color.s,
  l: clamp(color.l + delta, 4, 96),
});

const adjustSaturation = (color: HslColor, delta: number): HslColor => ({
  h: color.h,
  s: clamp(color.s + delta, 0, 100),
  l: color.l,
});

const createPalette = (seed: string) => {
  const rng = createRng(seed);
  const base: HslColor = {
    h: rng() * 360,
    s: 58 + rng() * 18,
    l: 42 + rng() * 18,
  };
  const accent = rotateHue(base, 25 + rng() * 50);
  const highlight = rotateHue(base, -45 - rng() * 40);
  return {
    base,
    accent: adjustLightness(adjustSaturation(accent, 6), 6),
    highlight: adjustLightness(adjustSaturation(highlight, -4), 12),
    shadow: adjustLightness(base, -18),
  };
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const svgToDataUri = (svg: string) => {
  const encoded = encodeURIComponent(svg)
    .replace(/%0A/g, '')
    .replace(/%09/g, '');
  return `data:image/svg+xml,${encoded}`;
};

const createBackgroundShapes = (seed: string, width: number, height: number, palette: ReturnType<typeof createPalette>) => {
  const rng = createRng(`${seed}:shapes`);
  const shapes: string[] = [];
  const count = 6;
  for (let i = 0; i < count; i += 1) {
    const cx = rng() * width;
    const cy = rng() * height;
    const rx = 220 + rng() * 320;
    const ry = rx * (0.35 + rng() * 0.45);
    const rotation = rng() * 360;
    const opacity = 0.08 + rng() * 0.18;
    const color = i % 2 === 0 ? rotateHue(palette.base, rng() * 50 - 25) : rotateHue(palette.accent, rng() * 60 - 30);
    shapes.push(
      `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${hslToHex(color)}" opacity="${opacity.toFixed(3)}" transform="rotate(${rotation.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" />`,
    );
  }
  const waveRng = createRng(`${seed}:wave`);
  const waveAmplitude = 80 + waveRng() * 120;
  const baseY = waveRng() * height * 0.25 + height * 0.55;
  const segments = 5;
  let wavePath = `M 0 ${baseY.toFixed(1)}`;
  for (let i = 1; i <= segments; i += 1) {
    const progress = i / segments;
    const x = width * progress;
    const controlX1 = width * (progress - 0.5 / segments);
    const controlY1 = baseY - waveAmplitude * (0.4 + waveRng() * 0.4);
    const controlX2 = width * (progress - 0.2 / segments);
    const controlY2 = baseY + waveAmplitude * (0.3 + waveRng() * 0.5);
    const endY = baseY + waveAmplitude * (waveRng() - 0.5);
    wavePath += ` C ${controlX1.toFixed(1)} ${controlY1.toFixed(1)}, ${controlX2.toFixed(1)} ${controlY2.toFixed(1)}, ${x.toFixed(
      1,
    )} ${endY.toFixed(1)}`;
  }
  wavePath += ` L ${width.toFixed(1)} ${height.toFixed(1)} L 0 ${height.toFixed(1)} Z`;
  const waveColor = hslToHex(adjustLightness(palette.highlight, 10));
  shapes.push(`<path d="${wavePath}" fill="${waveColor}" opacity="0.12" />`);
  return shapes.join('');
};

export const generateTierBackground = (name: string, tierLevel: number) => {
  const trimmed = name.trim();
  const label = trimmed.length > 0 ? trimmed : `Sauna ${tierLevel}`;
  const seed = `${label}:${tierLevel}`;
  const palette = createPalette(seed);
  const baseColor = hslToHex(adjustLightness(palette.base, -6));
  const gradientId = `grad-${hashString(`${seed}:grad`).toString(16)}`;
  const glowId = `glow-${hashString(`${seed}:glow`).toString(16)}`;
  const highlightId = `hl-${hashString(`${seed}:hl`).toString(16)}`;
  const width = 1600;
  const height = 900;
  const rng = createRng(`${seed}:main`);
  const gradientRotation = Math.round(rng() * 360);
  const gradientStops = [
    `<stop offset="0%" stop-color="${hslToHex(palette.shadow)}" />`,
    `<stop offset="50%" stop-color="${hslToHex(palette.base)}" />`,
    `<stop offset="100%" stop-color="${hslToHex(palette.accent)}" />`,
  ].join('');
  const shapes = createBackgroundShapes(seed, width, height, palette);
  const displayLabel = escapeXml(label.toUpperCase());
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">` +
    `<defs>` +
    `<linearGradient id="${gradientId}" gradientUnits="objectBoundingBox" gradientTransform="rotate(${gradientRotation} 0.5 0.5)">${gradientStops}</linearGradient>` +
    `<radialGradient id="${glowId}" cx="${(0.25 + rng() * 0.5).toFixed(3)}" cy="${(0.3 + rng() * 0.4).toFixed(3)}" r="0.9">` +
    `<stop offset="0%" stop-color="${hslToHex(adjustLightness(palette.highlight, 12))}" stop-opacity="0.8" />` +
    `<stop offset="100%" stop-color="${hslToHex(adjustLightness(palette.highlight, 18))}" stop-opacity="0" />` +
    `</radialGradient>` +
    `<linearGradient id="${highlightId}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />` +
    `<stop offset="100%" stop-color="#ffffff" stop-opacity="0" />` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="100%" height="100%" fill="${baseColor}" />` +
    `<rect width="100%" height="100%" fill="url(#${gradientId})" />` +
    `<rect width="100%" height="100%" fill="url(#${glowId})" />` +
    shapes +
    `<rect width="100%" height="100%" fill="url(#${highlightId})" opacity="0.35" />` +
    `<g opacity="0.12">` +
    `<text x="50%" y="88%" text-anchor="middle" font-family="'Inter', 'Nunito', 'Poppins', 'Segoe UI', sans-serif" font-size="132" letter-spacing="14">${displayLabel}</text>` +
    `</g>` +
    `</svg>`;
  return svgToDataUri(svg);
};

const createCategoryShape = (
  category: string,
  palette: ReturnType<typeof createPalette>,
  rng: () => number,
): string => {
  const stroke = hslToHex(adjustLightness(palette.shadow, -4));
  const fill = hslToHex(palette.highlight);
  switch (category) {
    case 'actions':
      return `<path d="M32 70 L32 50 L54 50 L54 36 L92 60 L54 84 L54 70 Z" fill="${fill}" stroke="${stroke}" stroke-width="6" stroke-linejoin="round" />`;
    case 'economy':
      return [
        `<rect x="26" y="60" width="16" height="30" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="4" />`,
        `<rect x="48" y="48" width="18" height="42" rx="4" fill="${hslToHex(adjustLightness(palette.highlight, -4))}" stroke="${stroke}" stroke-width="4" />`,
        `<rect x="72" y="34" width="20" height="56" rx="4" fill="${hslToHex(adjustLightness(palette.highlight, 4))}" stroke="${stroke}" stroke-width="4" />`,
      ].join('');
    case 'tech': {
      const nodeColor = hslToHex(adjustLightness(palette.accent, 10));
      return (
        `<path d="M60 26 L88 42 L88 78 L60 94 L32 78 L32 42 Z" fill="${fill}" stroke="${stroke}" stroke-width="6" stroke-linejoin="round" />` +
        `<circle cx="60" cy="60" r="12" fill="${nodeColor}" />` +
        `<circle cx="78" cy="52" r="6" fill="${nodeColor}" />` +
        `<circle cx="42" cy="70" r="6" fill="${nodeColor}" />` +
        `<path d="M60 60 L78 52" stroke="${stroke}" stroke-width="4" stroke-linecap="round" />` +
        `<path d="M60 60 L42 70" stroke="${stroke}" stroke-width="4" stroke-linecap="round" />`
      );
    }
    case 'milestone':
      return `<path d="M60 24 L70 48 L96 50 L76 66 L84 92 L60 78 L36 92 L44 66 L24 50 L50 48 Z" fill="${fill}" stroke="${stroke}" stroke-width="6" stroke-linejoin="round" />`;
    case 'skill': {
      const inner = hslToHex(adjustLightness(palette.highlight, -6));
      const accent = hslToHex(adjustLightness(palette.accent, 8));
      return (
        `<circle cx="60" cy="60" r="34" fill="${fill}" stroke="${stroke}" stroke-width="6" />` +
        `<circle cx="60" cy="60" r="22" fill="${accent}" opacity="0.8" />` +
        `<circle cx="60" cy="60" r="10" fill="${inner}" />` +
        `<path d="M60 28 L60 44" stroke="${stroke}" stroke-width="6" stroke-linecap="round" />` +
        `<path d="M60 92 L60 76" stroke="${stroke}" stroke-width="6" stroke-linecap="round" />` +
        `<path d="M28 60 L44 60" stroke="${stroke}" stroke-width="6" stroke-linecap="round" />` +
        `<path d="M92 60 L76 60" stroke="${stroke}" stroke-width="6" stroke-linecap="round" />`
      );
    }
    case 'prestige':
      return (
        `<path d="M60 24 C74 40 90 52 88 72 C86 86 74 96 60 104 C46 96 34 86 32 72 C30 52 46 40 60 24 Z" fill="${fill}" stroke="${stroke}" stroke-width="6" stroke-linejoin="round" />` +
        `<path d="M60 34 C68 46 78 54 76 70 C74 80 68 86 60 90 C52 86 46 80 44 70 C42 54 52 46 60 34 Z" fill="${hslToHex(adjustLightness(palette.accent, 12))}" opacity="0.85" />`
      );
    default: {
      const angle = rng() * 360;
      return `<polygon points="60,24 92,60 60,96 28,60" fill="${fill}" stroke="${stroke}" stroke-width="6" transform="rotate(${angle.toFixed(1)} 60 60)" />`;
    }
  }
};

export const generateDailyTaskBadge = (id: string, title: string, category: string) => {
  const label = title.trim().length > 0 ? title.trim() : id;
  const seed = `${category}:${id}:${label}`;
  const palette = createPalette(seed);
  const rng = createRng(`${seed}:badge`);
  const gradientId = `task-grad-${hashString(`${seed}:grad`).toString(16)}`;
  const glowId = `task-glow-${hashString(`${seed}:glow`).toString(16)}`;
  const width = 120;
  const height = 120;
  const gradientRotation = Math.round(rng() * 360);
  const gradientStops = [
    `<stop offset="0%" stop-color="${hslToHex(adjustLightness(palette.shadow, 4))}" />`,
    `<stop offset="100%" stop-color="${hslToHex(adjustLightness(palette.base, 8))}" />`,
  ].join('');
  const sparks = Array.from({ length: 5 }, () => {
    const x = 20 + rng() * 80;
    const y = 18 + rng() * 70;
    const size = 4 + rng() * 6;
    const opacity = 0.3 + rng() * 0.4;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(size / 2).toFixed(1)}" fill="${hslToHex(adjustLightness(palette.highlight, 16))}" opacity="${opacity.toFixed(2)}" />`;
  }).join('');
  const baseColor = hslToHex(adjustLightness(palette.base, -4));
  const svg =
    `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">` +
    `<defs>` +
    `<linearGradient id="${gradientId}" gradientUnits="objectBoundingBox" gradientTransform="rotate(${gradientRotation} 0.5 0.5)">${gradientStops}</linearGradient>` +
    `<radialGradient id="${glowId}" cx="0.5" cy="0.5" r="0.75">` +
    `<stop offset="0%" stop-color="${hslToHex(adjustLightness(palette.highlight, 20))}" stop-opacity="0.85" />` +
    `<stop offset="100%" stop-color="${hslToHex(adjustLightness(palette.highlight, 20))}" stop-opacity="0" />` +
    `</radialGradient>` +
    `</defs>` +
    `<rect width="100%" height="100%" rx="24" fill="${baseColor}" />` +
    `<rect width="100%" height="100%" rx="24" fill="url(#${gradientId})" />` +
    `<rect width="100%" height="100%" rx="24" fill="url(#${glowId})" opacity="0.65" />` +
    `<g opacity="0.6">${sparks}</g>` +
    `<g>${createCategoryShape(category, palette, rng)}</g>` +
    `<text x="50%" y="108" text-anchor="middle" font-family="'Inter','Nunito','Poppins','Segoe UI',sans-serif" font-size="14" fill="${hslToHex(adjustLightness(palette.highlight, 26))}" opacity="0.75">${escapeXml(label)}</text>` +
    `</svg>`;
  return svgToDataUri(svg);
};
