import Link from 'next/link';

import { auth0 } from '@/lib/auth0';

import { AuthButtons } from '../components/AuthButtons';
import { FavoritesList } from '../components/FavoritesList';
import { ThemeToggle } from '../components/ThemeToggle';

export default async function FavoritesPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-r from-purple-600/20 to-white dark:to-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-base font-semibold text-foreground">
            Movie Explorer
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              Browse
            </Link>
            <ThemeToggle />
            <AuthButtons
              isAuthed={Boolean(user)}
              displayName={user?.name || user?.nickname || user?.email}
              pictureUrl={user?.picture}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Favorites</h1>
        </div>
        <FavoritesList />
      </main>
    </div>
  );
}
