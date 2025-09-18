export const SUPPORTED_LANGS = ["fi", "en", "sv"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: SupportedLang = "en";
export const NAMESPACE = "common" as const;
