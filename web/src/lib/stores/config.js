import { writable } from 'svelte/store';

// Site configuration store
export const config = writable(null);

// Load configuration from JSON file
export async function loadConfig() {
  const response = await fetch('/config.json');
  const data = await response.json();
  config.set(data);
  return data;
}

// Apply theme CSS custom properties to document root
export function applyTheme(theme) {
  const root = document.documentElement;

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = `--color-${camelToKebab(key)}`;
    root.style.setProperty(cssVar, value);
  });

  // Fonts
  root.style.setProperty('--font-heading', theme.fonts.heading);
  root.style.setProperty('--font-body', theme.fonts.body);

  // Transitions
  Object.entries(theme.transitions).forEach(([key, value]) => {
    root.style.setProperty(`--transition-${key}`, `${value}s`);
  });
}

// Helper: camelCase to kebab-case
function camelToKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
