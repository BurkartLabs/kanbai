'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ZOOM_ORIGIN_KEY, type ZoomOrigin } from './ProgressCardLink';

const OPEN_MS = 380;
const CLOSE_MS = 300;
const OPEN_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CLOSE_EASE = 'cubic-bezier(0.5, 0, 0.75, 0)';

type Rect = { left: number; top: number; width: number; height: number };

function zoomToOrigin(origin: ZoomOrigin, rest: Rect) {
  return `translate(${origin.x - rest.left}px, ${origin.y - rest.top}px) scale(${
    origin.w / rest.width
  }, ${origin.h / rest.height})`;
}

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<ZoomOrigin | null>(null);
  const restRef = useRef<Rect | null>(null);
  const radiusRef = useRef('0px');
  const [closing, setClosing] = useState(false);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    let origin: ZoomOrigin | null = null;
    try {
      const raw = sessionStorage.getItem(ZOOM_ORIGIN_KEY);
      if (raw) origin = JSON.parse(raw) as ZoomOrigin;
      sessionStorage.removeItem(ZOOM_ORIGIN_KEY);
    } catch {
        //    :)
    }
    originRef.current = origin;

    const r = panel.getBoundingClientRect();
    const rest: Rect = { left: r.left, top: r.top, width: r.width, height: r.height };
    restRef.current = rest;
    radiusRef.current = getComputedStyle(panel).borderTopLeftRadius;

    const canZoom = origin && origin.w > 0 && origin.h > 0 && rest.width > 0 && rest.height > 0;

    if (canZoom) {
      panel.style.transformOrigin = '0 0';
      panel.style.transform = zoomToOrigin(origin!, rest);
      panel.style.borderRadius = `${origin!.radius}px`;
      panel.style.opacity = '0.6';
    } else {
      panel.style.transformOrigin = '50% 50%';
      panel.style.transform = 'scale(0.98)';
      panel.style.opacity = '0';
    }

    void panel.getBoundingClientRect();

    const raf = requestAnimationFrame(() => {
      panel.style.transition = `transform ${OPEN_MS}ms ${OPEN_EASE}, border-radius ${OPEN_MS}ms ${OPEN_EASE}, opacity ${Math.round(
        OPEN_MS * 0.7
      )}ms ease-out`;
      panel.style.transform = 'translate(0px, 0px) scale(1, 1)';
      panel.style.borderRadius = radiusRef.current;
      panel.style.opacity = '1';
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const panel = panelRef.current;
      if (!panel || closing) return;
      const r = panel.getBoundingClientRect();
      restRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [closing]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const close = useCallback(() => {
    if (closing) return;
    const panel = panelRef.current;
    if (!panel) {
      router.back();
      return;
    }
    setClosing(true);

    const origin = originRef.current;
    const rest = restRef.current;

    panel.style.transition = `transform ${CLOSE_MS}ms ${CLOSE_EASE}, border-radius ${CLOSE_MS}ms ${CLOSE_EASE}, opacity ${CLOSE_MS}ms ease-in`;
    if (origin && origin.w > 0 && origin.h > 0 && rest && rest.width > 0 && rest.height > 0) {
      panel.style.transformOrigin = '0 0';
      panel.style.transform = zoomToOrigin(origin, rest);
      panel.style.borderRadius = `${origin.radius}px`;
      panel.style.opacity = '0';
    } else {
      panel.style.transform = 'scale(0.98)';
      panel.style.opacity = '0';
    }

    window.setTimeout(() => router.back(), CLOSE_MS);
  }, [router, closing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div
      className={`board-overlay${closing ? ' is-closing' : ''}`}
      onClick={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) close();
      }}
    >
      <div className="board-overlay-inner">
        <div className="board-panel" ref={panelRef} role="dialog" aria-modal="true">
          <button type="button" className="board-close" aria-label="Close board" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
