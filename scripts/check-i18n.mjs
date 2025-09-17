import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const localesDir = resolve('src/i18n/locales');
const locales = readdirSync(localesDir);

const loadKeys = (filePath) => {
  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  return new Set(Object.keys(data));
};

const localeKeys = new Map();
for (const locale of locales) {
  const file = join(localesDir, locale, 'common.json');
  const keys = loadKeys(file);
  localeKeys.set(locale, keys);
}

const baseLocale = 'en';
const baseKeys = localeKeys.get(baseLocale);
if (!baseKeys) {
  console.error(`Base locale "${baseLocale}" not found`);
  process.exit(1);
}

let hasMismatch = false;
for (const [locale, keys] of localeKeys.entries()) {
  if (locale === baseLocale) continue;
  const missing = [...baseKeys].filter((key) => !keys.has(key));
  const extra = [...keys].filter((key) => !baseKeys.has(key));
  if (missing.length || extra.length) {
    hasMismatch = true;
    if (missing.length) {
      console.error(`Locale ${locale} is missing keys:\n  ${missing.join('\n  ')}`);
    }
    if (extra.length) {
      console.error(`Locale ${locale} has extra keys:\n  ${extra.join('\n  ')}`);
    }
  }
}

if (hasMismatch) {
  process.exit(1);
} else {
  console.log('All locale files have matching keys.');
}
