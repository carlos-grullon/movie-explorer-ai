import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { loginWithAuth0, parseJwtUser, type AuthUser } from './auth0';
import { clearTokens, loadTokens, saveTokens } from './tokenStore';

type AuthState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; accessToken: string; user: AuthUser | null };

type AuthContextValue = {
  status: AuthState['status'];
  accessToken: string | null;
  user: AuthUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = await loadTokens();
      if (cancelled) return;
      if (tokens.accessToken) {
        setState({
          status: 'signed_in',
          accessToken: tokens.accessToken,
          user: parseJwtUser(tokens.idToken),
        });
      } else {
        setState({ status: 'signed_out' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      status: state.status,
      accessToken: state.status === 'signed_in' ? state.accessToken : null,
      user: state.status === 'signed_in' ? state.user : null,
      login: async () => {
        const tokens = await loginWithAuth0();
        await saveTokens({ accessToken: tokens.accessToken, idToken: tokens.idToken });
        setState({
          status: 'signed_in',
          accessToken: tokens.accessToken,
          user: parseJwtUser(tokens.idToken),
        });
      },
      logout: async () => {
        await clearTokens();
        setState({ status: 'signed_out' });
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
