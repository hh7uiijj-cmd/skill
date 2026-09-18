import { getDb } from './firebaseAdmin';

export interface SiteTheme {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  ink: string;
}

export const DEFAULT_THEME: SiteTheme = {
  primary: '#4a141c',
  accent: '#f2774f',
  background: '#fbeee7',
  surface: '#ffffff',
  ink: '#241012',
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const THEME_DOC_PATH = { collection: 'settings', id: 'theme' } as const;

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value);
}

/** Merges stored values over the defaults, dropping anything that isn't a valid #rrggbb color. */
function sanitizeTheme(data: Partial<Record<keyof SiteTheme, unknown>> | undefined): SiteTheme {
  const theme = { ...DEFAULT_THEME };
  if (!data) return theme;
  for (const key of Object.keys(DEFAULT_THEME) as (keyof SiteTheme)[]) {
    const value = data[key];
    if (isValidHexColor(value)) {
      theme[key] = value;
    }
  }
  return theme;
}

export async function getTheme(): Promise<SiteTheme> {
  try {
    const db = getDb();
    const doc = await db.collection(THEME_DOC_PATH.collection).doc(THEME_DOC_PATH.id).get();
    return sanitizeTheme(doc.exists ? doc.data() : undefined);
  } catch {
    // Firestore unreachable, or not configured yet — fall back to defaults
    // rather than breaking every page render.
    return { ...DEFAULT_THEME };
  }
}

export async function saveTheme(input: Partial<Record<keyof SiteTheme, unknown>>): Promise<SiteTheme> {
  const theme = sanitizeTheme(input);
  const db = getDb();
  await db.collection(THEME_DOC_PATH.collection).doc(THEME_DOC_PATH.id).set(theme);
  return theme;
}

export function themeToCssVariables(theme: SiteTheme): string {
  return `:root{--color-primary:${theme.primary};--color-accent:${theme.accent};--color-bg:${theme.background};--color-surface:${theme.surface};--color-ink:${theme.ink};}`;
}
