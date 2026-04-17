/**
 * Apple Design System Theme Configuration
 * Based on design.txt specifications
 */

import { setCssVar, Dark } from 'quasar';
import type { ThemeMode } from '../types/settings';

/** Apple Design System Color Palette */
export const APPLE_COLORS = {
  // Apple Blue (Primary)
  appleBlue: '#0071e3',
  appleBlueHover: '#0077f5',

  // Links
  linkBlueLight: '#0066cc',
  linkBlueDark: '#2997ff',

  // Backgrounds
  pureBlack: '#000000',
  lightGray: '#f5f5f7',
  nearBlack: '#1d1d1f',
  white: '#ffffff',

  // Dark surfaces
  darkSurface1: '#272729',
  darkSurface2: '#262628',
  darkSurface3: '#28282a',

  // Text colors
  textWhite: '#ffffff',
  textBlack: '#1d1d1f',
  textWhite80: 'rgba(255, 255, 255, 0.8)',
  textBlack80: 'rgba(0, 0, 0, 0.8)',
  textWhite48: 'rgba(255, 255, 255, 0.48)',
  textBlack48: 'rgba(0, 0, 0, 0.48)',

  // Button states
  buttonActive: '#ededf2',
  buttonFilter: '#fafafc',

  // Overlays
  overlay: 'rgba(210, 210, 215, 0.64)',
  overlayWhite32: 'rgba(255, 255, 255, 0.32)',
  overlayBlack04: 'rgba(0, 0, 0, 0.04)',
} as const;

/** Apply complete Apple theme */
export function applyAppleTheme(isDark: boolean) {
  const c = APPLE_COLORS;

  // Set Quasar CSS variables
  setCssVar('primary', c.appleBlue);
  setCssVar('secondary', isDark ? c.linkBlueDark : c.linkBlueLight);
  setCssVar('accent', '#e8b339');
  setCssVar('positive', '#21ba45');
  setCssVar('negative', '#c10015');
  setCssVar('info', '#31ccec');
  setCssVar('warning', '#f2c037');

  // Set theme-specific colors
  if (isDark) {
    setCssVar('dark', c.pureBlack);
    setCssVar('dark-page', c.pureBlack);

    // Set custom CSS properties for dark theme
    document.documentElement.style.setProperty('--itimo-bg-primary', c.pureBlack);
    document.documentElement.style.setProperty('--itimo-bg-secondary', c.darkSurface1);
    document.documentElement.style.setProperty('--itimo-bg-tertiary', c.darkSurface2);
    document.documentElement.style.setProperty('--itimo-text-primary', c.textWhite);
    document.documentElement.style.setProperty('--itimo-text-secondary', c.textWhite80);
    document.documentElement.style.setProperty('--itimo-text-tertiary', c.textWhite48);
    document.documentElement.style.setProperty('--itimo-link', c.linkBlueDark);
    document.documentElement.style.setProperty('--itimo-surface', 'rgba(255, 255, 255, 0.055)');
    document.documentElement.style.setProperty(
      '--itimo-surface-border',
      'rgba(255, 255, 255, 0.09)',
    );
    document.documentElement.style.setProperty('--itimo-glass', 'rgba(0, 0, 0, 0.8)');
    document.documentElement.style.setProperty(
      '--itimo-shadow-card',
      'rgba(0, 0, 0, 0.4) 0px 8px 32px 0px',
    );
    document.documentElement.style.setProperty(
      '--itimo-shadow-elevated',
      '0 12px 40px rgba(0, 0, 0, 0.5)',
    );
  } else {
    setCssVar('dark', c.nearBlack);
    setCssVar('dark-page', c.nearBlack);

    // Set custom CSS properties for light theme
    document.documentElement.style.setProperty('--itimo-bg-primary', c.lightGray);
    document.documentElement.style.setProperty('--itimo-bg-secondary', c.white);
    document.documentElement.style.setProperty('--itimo-bg-tertiary', '#fafafc');
    document.documentElement.style.setProperty('--itimo-text-primary', c.textBlack);
    document.documentElement.style.setProperty('--itimo-text-secondary', c.textBlack80);
    document.documentElement.style.setProperty('--itimo-text-tertiary', c.textBlack48);
    document.documentElement.style.setProperty('--itimo-link', c.linkBlueLight);
    document.documentElement.style.setProperty('--itimo-surface', 'rgba(255, 255, 255, 0.8)');
    document.documentElement.style.setProperty('--itimo-surface-border', 'rgba(0, 0, 0, 0.08)');
    document.documentElement.style.setProperty('--itimo-glass', 'rgba(255, 255, 255, 0.9)');
    document.documentElement.style.setProperty(
      '--itimo-shadow-card',
      'rgba(0, 0, 0, 0.1) 0px 4px 20px 0px',
    );
    document.documentElement.style.setProperty(
      '--itimo-shadow-elevated',
      '0 8px 24px rgba(0, 0, 0, 0.12)',
    );
  }

  // Common properties
  document.documentElement.style.setProperty('--itimo-brand', c.appleBlue);
  document.documentElement.style.setProperty('--itimo-brand-hover', c.appleBlueHover);
  document.documentElement.style.setProperty('--itimo-focus-ring', `2px solid ${c.appleBlue}`);
}

/** Get effective theme mode */
export function getEffectiveTheme(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  // auto: follow system
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

/** Apply theme and sync HTML classes */
export function syncTheme(mode: ThemeMode) {
  const isDark = getEffectiveTheme(mode);
  const html = document.documentElement;

  // Apply theme
  applyAppleTheme(isDark);

  // Sync HTML classes
  html.classList.toggle('itimo-light', !isDark);
  html.classList.toggle('itimo-dark', isDark);

  // Sync Quasar dark mode
  Dark.set(isDark);

  return isDark;
}

/** Setup theme change listener for auto mode */
export function setupThemeListener(callback: () => void) {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', callback);
    return () => mq.removeEventListener('change', callback);
  }
  return () => {};
}
