import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { warmFriendly, sportDark } from '../theme/logbookThemes';

const THEME_KEY = '@pickleHero_themeMode';

// ------------------------------------------------------------------
// Design tokens — light and dark palettes
// ------------------------------------------------------------------
const light = {
  // Backgrounds
  bg: '#FFFFFF',
  bgSecondary: '#F8FAFF',
  bgCard: '#FFFFFF',
  bgInput: '#F3F4F6',
  bgSheet: '#FFFFFF',
  // Text
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  // Brand
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  primaryBorder: '#C7D2FE',
  // UI chrome
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  // Tab bar
  tabBg: '#FFFFFF',
  tabBorder: 'transparent',
  tabShadow: '#000000',
  // Header
  headerBg: '#FFFFFF',
  headerText: '#1F2937',
};

const dark = {
  // Backgrounds
  bg: '#0C0C0C',
  bgSecondary: '#111111',
  bgCard: '#181818',
  bgInput: '#222222',
  bgSheet: '#181818',
  // Text
  text: '#FFFFFF',
  textSecondary: '#B8B8B8',
  textTertiary: '#9A9A9A',
  // Brand
  primary: '#C5F22A',
  primaryLight: '#C5F22A18',
  primaryBorder: '#C5F22A40',
  // UI chrome
  border: '#2A2A2A',
  borderStrong: '#3A3A3A',
  // Status
  success: '#34D399',
  successLight: '#064E3B',
  error: '#F87171',
  errorLight: '#450A0A',
  warning: '#FBBF24',
  warningLight: '#451A03',
  // Tab bar
  tabBg: '#111111',
  tabBorder: '#2A2A2A',
  tabShadow: '#000000',
  // Header
  headerBg: '#0C0C0C',
  headerText: '#FFFFFF',
};

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------
const ThemeContext = createContext({
  theme: light,
  isDark: false,
  themeMode: 'system',
  setThemeMode: () => {},
  logbookTheme: warmFriendly,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState('light'); // 'light' | 'dark'

  // Load persisted preference (migrate legacy 'system' → 'light')
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then(v => {
        if (v === 'dark' || v === 'light') setThemeModeState(v);
        else if (v === 'system') setThemeModeState('light');
      })
      .catch(() => {});
  }, []);

  const setThemeMode = (mode) => {
    if (mode !== 'light' && mode !== 'dark') return;
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  };

  const isDark = themeMode === 'dark';
  const theme = isDark ? dark : light;
  const logbookTheme = isDark ? sportDark : warmFriendly;

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode, logbookTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
