import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@n8n_theme_preference';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async (): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeModeState(stored as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = useCallback(async (mode: ThemeMode): Promise<void> => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      throw error;
    }
  }, []);

  const toggleTheme = useCallback(async (): Promise<void> => {
    const nextMode: ThemeMode = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    await setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const value: ThemeContextValue = {
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeMode(): ThemeMode {
  const { themeMode } = useTheme();
  return themeMode;
}

export function useIsDark(): boolean {
  const { isDark } = useTheme();
  return isDark;
}
