#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dataPath = path.join(projectRoot, 'src/data/daily_tasks.json');
const outputDir = path.join(projectRoot, 'public/assets/daily-tasks');
const manifestPath = path.join(projectRoot, 'src/assets/dailyTaskIcons.ts');

const CATEGORY_STYLES = {
  actions: { accent: '#f97316', glyph: createFlameGlyph },
  economy: { accent: '#facc15', glyph: createCoinsGlyph },
  tech: { accent: '#38bdf8', glyph: createChipGlyph },
  milestone: { accent: '#a855f7', glyph: createFlagGlyph },
  skill: { accent: '#34d399', glyph: createTargetGlyph },
  prestige: { accent: '#fb7185', glyph: createCrownGlyph },
  progression: { accent: '#22d3ee', glyph: createArrowGlyph },
  time: { accent: '#60a5fa', glyph: createClockGlyph },
  default: { accent: '#94a3b8', glyph: createStarGlyph },
};

async function generate() {
  const raw = await readFile(dataPath, 'utf8');
  const parsed = JSON.parse(raw);
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  await mkdir(outputDir, { recursive: true });

  const expectedFiles = new Set(tasks.map((task) => `${task.id}.svg`));
  const existingFiles = await readdir(outputDir, { withFileTypes: true }).catch(() => []);
  for (const entry of existingFiles) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.svg')) continue;
    if (!expectedFiles.has(entry.name)) {
      await rm(path.join(outputDir, entry.name));
    }
  }

  const iconEntries = [];
  const seenIds = new Set();
  for (const task of tasks) {
    if (!task || typeof task !== 'object') continue;
    const id = String(task.id ?? '').trim();
    if (!id) continue;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    const category = typeof task.category === 'string' ? task.category : 'default';
    const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.default;
    const accent = style.accent;
    const hash = hashString(id);
    const gradientDark = mixColors(accent, '#0f172a', 0.58 + ((hash % 25) / 200));
    const gradientLight = mixColors(accent, '#f8fafc', 0.72 + ((hash % 35) / 200));
    const stripeColor = mixColors(accent, '#0f172a', 0.42 + ((hash % 40) / 200));
    const highlight = mixColors(accent, '#f8fafc', 0.85);
    const glyphColors = {
      primary: '#f8fafc',
      secondary: mixColors(accent, '#f8fafc', 0.75),
      tertiary: mixColors(accent, '#0f172a', 0.22),
      stroke: mixColors(accent, '#0f172a', 0.55),
      detail: mixColors(accent, '#0f172a', 0.75),
    };
    const rotation = (hash % 120) - 60;
    const safeId = id.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
    const gradientId = `grad-${safeId}`;
    const clipId = `clip-${safeId}`;
    const stripes = createStripes(stripeColor, rotation);
    const glyph = style.glyph(glyphColors);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg width="128" height="128" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">\n` +
      `  <defs>\n` +
      `    <linearGradient id="${gradientId}" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">\n` +
      `      <stop offset="0%" stop-color="${gradientLight}"/>\n` +
      `      <stop offset="100%" stop-color="${gradientDark}"/>\n` +
      `    </linearGradient>\n` +
      `    <clipPath id="${clipId}">\n` +
      `      <rect x="6" y="6" width="52" height="52" rx="14"/>\n` +
      `    </clipPath>\n` +
      `  </defs>\n` +
      `  <g clip-path="url(#${clipId})">\n` +
      `    <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#${gradientId})"/>\n` +
      `    ${stripes}\n` +
      `    <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#${gradientId})" fill-opacity="0.35"/>\n` +
      `  </g>\n` +
      `  <rect x="6" y="6" width="52" height="52" rx="14" stroke="${highlight}" stroke-width="1.25" fill="none"/>\n` +
      `  ${glyph}\n` +
      `</svg>\n`;
    const filePath = path.join(outputDir, `${id}.svg`);
    await writeFile(filePath, svg, 'utf8');
    iconEntries.push({ id, path: `assets/daily-tasks/${id}.svg` });
  }

  iconEntries.sort((a, b) => a.id.localeCompare(b.id));
  const manifest = createManifest(iconEntries);
  await writeFile(manifestPath, manifest, 'utf8');
}

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mixColors(colorA, colorB, ratio) {
  const t = Math.max(0, Math.min(1, Number(ratio) || 0));
  const { r: r1, g: g1, b: b1 } = toRgb(colorA);
  const { r: r2, g: g2, b: b2 } = toRgb(colorB);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value) {
  return value.toString(16).padStart(2, '0');
}

function toRgb(color) {
  let hex = String(color).trim();
  if (!hex.startsWith('#')) {
    throw new Error(`Unsupported color format: ${color}`);
  }
  hex = hex.slice(1);
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) {
    throw new Error(`Unsupported color format: ${color}`);
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
}

function createStripes(color, rotation) {
  const stripeWidth = 10;
  const spacing = 16;
  const stripes = [];
  for (let i = -8; i < 8; i += 1) {
    const x = i * spacing;
    stripes.push(
      `<rect x="${x}" y="-64" width="${stripeWidth}" height="192" fill="${color}" fill-opacity="0.22"/>`,
    );
  }
  return `<g transform="rotate(${rotation.toFixed(2)}, 32, 32)">${stripes.join('')}</g>`;
}

function createFlameGlyph(colors) {
  return `  <path d="M32 15c-5.4 6.7-11 13.9-11 22.5 0 7.4 5.6 13.5 11 13.5s11-6.1 11-13.5C43 28.9 37.4 21.7 32 15z" fill="${colors.primary}" stroke="${colors.stroke}" stroke-width="2.4" stroke-linejoin="round"/>\n` +
    `  <path d="M32 26c3.3 4.2 5.2 7.9 5.2 11.5 0 4-2.5 7-5.2 7s-5.2-3-5.2-7C26.8 33.9 28.7 30.2 32 26z" fill="${colors.secondary}" stroke="${colors.detail}" stroke-width="1.6" stroke-linejoin="round"/>`;
}

function createCoinsGlyph(colors) {
  return `  <circle cx="26" cy="31" r="9.5" fill="${colors.secondary}" stroke="${colors.stroke}" stroke-width="2"/>\n` +
    `  <circle cx="37.5" cy="35" r="9" fill="${colors.primary}" stroke="${colors.stroke}" stroke-width="2"/>\n` +
    `  <path d="M21.5 31h9m-6 4h7" stroke="${colors.detail}" stroke-width="1.8" stroke-linecap="round"/>`;
}

function createChipGlyph(colors) {
  return `  <rect x="22" y="22" width="20" height="20" rx="5" fill="${colors.primary}" stroke="${colors.stroke}" stroke-width="2.2"/>\n` +
    `  <rect x="27" y="27" width="10" height="10" rx="2" fill="${colors.secondary}"/>\n` +
    `  <path d="M32 18v4m0 24v4m-8-12h-4m28 0h-4m-3-9 2.8-2.8m-19.6 19.6L26 38m-2.8-12 2.8 2.8m16.8 16.8L38 38" stroke="${colors.detail}" stroke-width="1.6" stroke-linecap="round"/>`;
}

function createFlagGlyph(colors) {
  return `  <path d="M24 18v28" stroke="${colors.stroke}" stroke-width="2.6" stroke-linecap="round"/>\n` +
    `  <path d="M26.5 20.5h17l-6 6 6 6h-17z" fill="${colors.secondary}" stroke="${colors.detail}" stroke-width="1.8" stroke-linejoin="round"/>\n` +
    `  <circle cx="24" cy="46" r="3" fill="${colors.primary}" stroke="${colors.detail}" stroke-width="1.4"/>`;
}

function createTargetGlyph(colors) {
  return `  <circle cx="32" cy="30" r="12.5" fill="${colors.primary}" stroke="${colors.stroke}" stroke-width="2.4"/>\n` +
    `  <circle cx="32" cy="30" r="7.5" fill="${colors.secondary}" stroke="${colors.detail}" stroke-width="1.6"/>\n` +
    `  <circle cx="32" cy="30" r="3" fill="${colors.tertiary}"/>\n` +
    `  <path d="M32 19v4m0 14v4m-11-11h4m14 0h4" stroke="${colors.detail}" stroke-width="1.4" stroke-linecap="round"/>`;
}

function createCrownGlyph(colors) {
  return `  <path d="M22 40.5h20l-2 6H24z" fill="${colors.tertiary}" stroke="${colors.stroke}" stroke-width="2" stroke-linejoin="round"/>\n` +
    `  <path d="M22 26l5.5 6 4.5-9 4.5 9 5.5-6v10.5H22z" fill="${colors.primary}" stroke="${colors.stroke}" stroke-width="2" stroke-linejoin="round"/>\n` +
    `  <circle cx="32" cy="21" r="3" fill="${colors.secondary}" stroke="${colors.detail}" stroke-width="1.4"/>`;
}

function createArrowGlyph(colors) {
  return `  <path d="M22 40l10-11 6 6 12-14" fill="none" stroke="${colors.secondary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>\n` +
    `  <path d="M45 19v9h-9" fill="none" stroke="${colors.detail}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function createClockGlyph(colors) {
  return `  <circle cx="32" cy="30" r="12" fill="${colors.primary}" stroke="${colors.stroke}" stroke-width="2.2"/>\n` +
    `  <path d="M32 30l-1-6m1 6 5 3" stroke="${colors.detail}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>\n` +
    `  <circle cx="32" cy="30" r="2" fill="${colors.secondary}"/>`;
}

function createStarGlyph(colors) {
  return `  <path d="M32 18l4.4 9.2 10.1 1.5-7.3 7.1 1.7 10-9-4.8-9 4.8 1.7-10-7.3-7.1 10.1-1.5z" fill="${colors.primary}" stroke="${colors.stroke}" stroke-width="2" stroke-linejoin="round"/>`;
}

function createManifest(entries) {
  const lines = entries.map((entry) => `  "${entry.id}": "${entry.path}",`);
  return `// This file is auto-generated by scripts/generate-daily-task-icons.mjs.\n` +
    `// Do not edit this file manually.\n` +
    `export const dailyTaskIcons = {\n${lines.join('\n')}\n} satisfies Record<string, string>;\n\n` +
    `export type DailyTaskIconId = keyof typeof dailyTaskIcons;\n`;
}

try {
  await generate();
  console.log('Daily task icons generated.');
} catch (error) {
  console.error('Failed to generate daily task icons:', error);
  process.exitCode = 1;
}
