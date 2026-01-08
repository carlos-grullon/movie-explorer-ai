'use client';

export function AuthButtons({ isAuthed }: { isAuthed: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {isAuthed ? (
        <a
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          href="/auth/logout"
        >
          Logout
        </a>
      ) : (
        <a
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          href="/auth/login"
        >
          Login
        </a>
      )}
    </div>
  );
}
