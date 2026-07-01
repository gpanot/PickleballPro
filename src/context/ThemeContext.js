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
  bg: '#0F172A',
  bgSecondary: '#1E293B',
  bgCard: '#1E293B',
  bgInput: '#334155',
  bgSheet: '#1E293B',
  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  // Brand
  primary: '#818CF8',
  primaryLight: '#1E1B4B',
  primaryBorder: '#3730A3',
  // UI chrome
  border: '#334155',
  borderStrong: '#475569',
  // Status
  success: '#34D399',
  successLight: '#064E3B',
  error: '#F87171',
  errorLight: '#450A0A',
  warning: '#FBBF24',
  warningLight: '#451A03',
  // Tab bar
  tabBg: '#1E293B',
  tabBorder: '#334155',
  tabShadow: '#000000',
  // Header
  headerBg: '#0F172A',
  headerText: '#F1F5F9',
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
