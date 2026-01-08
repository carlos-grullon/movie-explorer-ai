import { auth0 } from '@/lib/auth0';

import Link from 'next/link';

import { AuthButtons } from './components/AuthButtons';
import { HomeBrowse } from './components/HomeBrowse';
import { ThemeToggle } from './components/ThemeToggle';

export default async function Home() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-r from-purple-600/20 to-white dark:to-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-base font-semibold text-foreground">Movie Explorer</div>
          <div className="flex items-center gap-3">
            <Link
              href="/favorites"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              Favorites
            </Link>
            <ThemeToggle />
            <AuthButtons isAuthed={Boolean(user)} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <HomeBrowse />
      </main>
    </div>
  );
}
