import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeInitScript } from '@/components/ThemeInitScript';
import { SiteNav } from '@/components/SiteNav';
import './globals.css';
import Script from 'next/script';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Kanbai — Project Board',
  description: 'An AI-powered kanban board that turns a prompt into a full project backlog.',
};
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

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${inter.variable}`}>
      <body style={{ fontFamily: 'var(--font-body), sans-serif' }}>
        <ThemeInitScript />
        <ThemeProvider>
          <SiteNav />
          {children}
          {modal}
        </ThemeProvider>
      </body>
    </html>
  );
}