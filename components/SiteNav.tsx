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
          Burkart.dev
        </div>
        <div className="nav-links">
          <a href="https://paulburkart.ca">About</a>
          <a href="https://www.linkedin.com/in/paul-b-635257127/">Resume</a>
          <a href="mailto:paul@paulburkart.ca" className="nav-cta">
            Get in touch
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </div>
  );
}
