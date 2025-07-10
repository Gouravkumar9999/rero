import React, { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    (localStorage.getItem("theme") === "dark") ||
    (localStorage.getItem("theme") !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      className="ml-4 px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 transition"
      onClick={() => setDark(d => !d)}
      aria-label="Toggle dark mode"
      title="Toggle dark/light mode"
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}