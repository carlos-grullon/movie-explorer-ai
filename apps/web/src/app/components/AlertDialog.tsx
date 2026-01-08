'use client';

import { useEffect } from 'react';

export function AlertDialog(props: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!props.open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') props.onCancel();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [props.open, props.onCancel]);

  if (!props.open) return null;

  const confirmLabel = props.confirmLabel ?? 'Confirm';
  const cancelLabel = props.cancelLabel ?? 'Cancel';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-black/40"
        onClick={props.onCancel}
        type="button"
      />

      <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg">
        <div className="text-base font-semibold text-foreground">{props.title}</div>
        {props.description ? <div className="mt-2 text-sm text-muted-foreground">{props.description}</div> : null}

        <div className="mt-5 flex justify-end gap-3">
          <button className="rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted" onClick={props.onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={
              props.destructive
                ? 'rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90'
                : 'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
            }
            onClick={props.onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
