'use client';

import { useEffect } from 'react';

export function Dialog(props: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!props.open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') props.onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={props.onClose}
        type="button"
      />

      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-lg">
        <div className="text-base font-semibold text-foreground">{props.title}</div>
        {props.description ? <div className="mt-2 text-sm text-muted-foreground">{props.description}</div> : null}

        <div className="mt-4">{props.children}</div>

        {props.footer ? <div className="mt-5 flex justify-end gap-3">{props.footer}</div> : null}
      </div>
    </div>
  );
}
