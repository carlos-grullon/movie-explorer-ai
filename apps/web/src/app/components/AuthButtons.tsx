'use client';

import Link from 'next/link';

import { useEffect, useRef, useState } from 'react';

function firstInitial(name: string | null | undefined): string {
  const v = (name || '').trim();
  if (!v) return 'U';
  return v[0]?.toUpperCase() || 'U';
}

export function AuthButtons({
  isAuthed,
  displayName,
  pictureUrl,
}: {
  isAuthed: boolean;
  displayName?: string | null;
  pictureUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [renderMenu, setRenderMenu] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [imageErrorUrl, setImageErrorUrl] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  function openMenu() {
    setRenderMenu(true);
    setOpen(true);
    requestAnimationFrame(() => setAnimateIn(true));
  }

  function closeMenu() {
    setOpen(false);
    setAnimateIn(false);
    setTimeout(() => setRenderMenu(false), 140);
  }

  useEffect(() => {
    if (!open) return;

    function onDocMouseDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      closeMenu();
    }

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex items-center gap-3">
      {isAuthed ? (
        <>
          <button
            type="button"
            onClick={() => (open ? closeMenu() : openMenu())}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-purple-600 text-base font-semibold text-white shadow-sm ring-1 ring-purple-600/30 hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            {pictureUrl && imageErrorUrl !== pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pictureUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageErrorUrl(pictureUrl)}
              />
            ) : (
              firstInitial(displayName)
            )}
          </button>

          {renderMenu ? (
            <div
              role="menu"
              className={`absolute right-0 top-full z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-md border border-border bg-background shadow-lg ring-1 ring-black/5 transition-all duration-150 ease-out ${
                animateIn ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-[0.98]'
              }`}
            >
              <div className="px-3 py-2 text-xs text-muted-foreground">{displayName || 'Signed in'}</div>
              <div className="h-px bg-border" />
              <Link
                role="menuitem"
                className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus:bg-muted focus:outline-none"
                href="/auth/logout"
              >
                Log out
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <Link
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          href="/auth/login"
        >
          Login
        </Link>
      )}
    </div>
  );
}
