'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export function SiteNav() {
  const pathname = usePathname();
  if (pathname?.startsWith('/manage')) return null;

  return (
    <div className="wrap">
      <nav>
        <div className="logo">
          <span className="dot" />
          Kanbai
        </div>
        <div className="nav-links">
          <a href="#">About</a>
          <a href="#">Resume</a>
          <a href="#" className="nav-cta">
            Get in touch
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
}
