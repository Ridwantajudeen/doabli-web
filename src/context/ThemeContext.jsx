import { createContext, useContext, useState, useEffect } from 'react';
import { Colors } from '../constants/colors';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  // Check system preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const stored = localStorage.getItem('theme');
    if (stored) {
      setIsDark(stored === 'dark');
    } else {
      setIsDark(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  const theme = isDark ? Colors.dark : Colors.light;
  
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.background);
    root.style.setProperty('--nav', theme.navBackground);
    root.style.setProperty('--surface', theme.uiBackground);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--title', theme.title);
    root.style.setProperty('--brand', Colors.primary);
    root.style.setProperty('--danger', Colors.warning);
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [theme, isDark]);

  const value = {
    isDark,
    toggleTheme,
    theme,
    Colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
