"use client";

import { useSyncExternalStore } from "react";
import { currentTheme, setTheme, subscribeToTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

/**
 * Switches between light and dark. The server can't know the theme (it's set
 * in the browser before paint), so the first render uses a neutral label and
 * the real state follows straight after hydration.
 */
export function ThemeToggle({ className = "", withLabel = false }: { className?: string; withLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, () => null);
  const next = theme === "dark" ? "light" : "dark";
  const label = theme ? `Switch to ${next} mode` : "Switch colour theme";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={withLabel ? undefined : label}
      className={className}
    >
      {/* Shows the theme you'd switch to. */}
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      {withLabel && <span className="label-caps">{theme ? `${next === "dark" ? "Dark" : "Light"} mode` : "Theme"}</span>}
    </button>
  );
}
