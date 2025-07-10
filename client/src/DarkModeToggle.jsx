import React, { useEffect, useState } from 'react';

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const root = document.documentElement;

    if (
      storedTheme === 'dark' ||
      (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newMode = !isDark;
    setIsDark(newMode);

    if (newMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center shadow-inner hover:scale-105 transition-transform"
      title="Toggle Appearance"
    >
      <div className="relative w-6 h-6 rounded-full overflow-hidden shadow-sm">
        {/* Half circle background */}
        <div className="absolute inset-0 bg-white dark:bg-black" />
        <div className="absolute inset-0 w-1/2 bg-black dark:bg-white" />
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-black dark:bg-white transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </button>
  );
};

export default DarkModeToggle;
