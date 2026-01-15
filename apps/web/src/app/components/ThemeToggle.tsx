'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = (localStorage.getItem('theme') as Theme | null) ?? null;
    const domTheme: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    return saved === 'dark' ? 'dark' : saved === 'light' ? 'light' : domTheme;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted"
      onClick={() => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        localStorage.setItem('theme', next);
        applyTheme(next);
      }}
      type="button"
    >
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  );
}
