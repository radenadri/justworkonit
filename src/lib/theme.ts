export const THEME_STORAGE_KEY = "jw-theme";
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const validThemes = new Set<ThemeMode>(["light", "dark", "system"]);

export function getStoredTheme(storage: Pick<Storage, "getItem"> | null): ThemeMode | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(THEME_STORAGE_KEY);
    return validThemes.has(value as ThemeMode) ? (value as ThemeMode) : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(media: Pick<MediaQueryList, "matches"> | null): ResolvedTheme {
  return media?.matches ? "dark" : "light";
}

export function resolveTheme(mode: ThemeMode, system: ResolvedTheme): ResolvedTheme {
  return mode === "system" ? system : mode;
}

export function getInitialTheme(
  storage: Pick<Storage, "getItem"> | null,
  media: Pick<MediaQueryList, "matches"> | null
) {
  const stored = getStoredTheme(storage);
  const mode: ThemeMode = stored ?? "system";
  const resolved = resolveTheme(mode, getSystemTheme(media));
  return { mode, resolved };
}
