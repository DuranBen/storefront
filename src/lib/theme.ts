// Light / dark theme: `data-theme` on <html>. A saved choice wins; otherwise
// the system setting. Client-safe: no server imports.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "theme:change";

/**
 * Runs in <head> before the first paint, so pages never flash the wrong
 * theme. Kept tiny and self-contained (it's inlined as a string).
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}})()`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null; // storage blocked: fall back to the system setting
  }
}

/** Apply and remember a theme chosen by the visitor. */
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/**
 * Notify on theme changes: a toggle here or in another tab, or the system
 * setting changing while the visitor hasn't chosen one.
 */
export function subscribeToTheme(onChange: () => void) {
  const system = matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (savedTheme()) return;
    document.documentElement.dataset.theme = system.matches ? "dark" : "light";
    onChange();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY) return;
    document.documentElement.dataset.theme =
      savedTheme() ?? (system.matches ? "dark" : "light");
    onChange();
  };
  system.addEventListener("change", onSystem);
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    system.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}
