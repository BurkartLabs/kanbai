'use client';

import Link from 'next/link';

export const ZOOM_ORIGIN_KEY = 'kanbai:zoom-origin';

export type ZoomOrigin = {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
};

export function ProgressCardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="progress-card"
      onClick={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
        const origin: ZoomOrigin = {
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
          radius,
        };
        try {
          sessionStorage.setItem(ZOOM_ORIGIN_KEY, JSON.stringify(origin));
        } catch {
          //    :)
        }
      }}
    >
      {children}
    </Link>
  );
}
