// components/ThemeInitScript.tsx
'use client';

import { useServerInsertedHTML } from 'next/navigation';

const noFlashScript = `
(function () {
  try {
    var stored = window.localStorage.getItem('kanbai-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export function ThemeInitScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
  ));
  return null;
}