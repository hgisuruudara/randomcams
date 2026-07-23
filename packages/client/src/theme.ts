import { useEffect, useState } from 'react';

const STORAGE_KEY = 'randomcams_theme';

function getInitialIsDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

export function useTheme() {
  const [isDark, setIsDark] = useState(getInitialIsDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}
