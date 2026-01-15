import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { decode as atob } from 'base-64';

WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
};

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

export function auth0Domain(): string {
  return getRequiredEnv('EXPO_PUBLIC_AUTH0_DOMAIN');
}

export function auth0Audience(): string {
  return getRequiredEnv('EXPO_PUBLIC_AUTH0_AUDIENCE');
}

export function auth0ClientId(): string {
  return getRequiredEnv('EXPO_PUBLIC_AUTH0_CLIENT_ID');
}

function auth0UseProxy(): boolean {
  const v = process.env.EXPO_PUBLIC_AUTH0_USE_PROXY;
  if (!v) return true;
  return v === 'true';
}

export function auth0RedirectUri(): string {
  if (auth0UseProxy()) {
    return ((AuthSession as any).makeRedirectUri({ useProxy: true }) as string) ?? '';
  }
  const scheme = process.env.EXPO_PUBLIC_AUTH0_SCHEME || 'movie-explorer-ai';
  return AuthSession.makeRedirectUri({ scheme, path: 'auth-callback' });
}

export async function auth0Discovery() {
  const domain = auth0Domain();
  return await AuthSession.fetchDiscoveryAsync(`https://${domain}`);
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return atob(padded);
}

export function parseJwtUser(idToken: string | null | undefined): AuthUser | null {
  if (!idToken) return null;
  const parts = idToken.split('.');
  if (parts.length < 2) return null;
  try {
    const json = JSON.parse(base64UrlDecode(parts[1]));
    return {
      sub: typeof json?.sub === 'string' ? json.sub : undefined,
      name: typeof json?.name === 'string' ? json.name : undefined,
      email: typeof json?.email === 'string' ? json.email : undefined,
      picture: typeof json?.picture === 'string' ? json.picture : undefined,
    };
  } catch {
    return null;
  }
}

export async function loginWithAuth0(): Promise<{ accessToken: string; idToken?: string }> {
  const discovery = await auth0Discovery();
  const clientId = auth0ClientId();
  const redirectUri = auth0RedirectUri();

  const req = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      audience: auth0Audience(),
    },
  });

  await req.makeAuthUrlAsync(discovery);

  const result = await req.promptAsync(discovery, { useProxy: auth0UseProxy() } as any);
  if (result.type !== 'success') {
    throw new Error(result.type === 'dismiss' ? 'Login cancelled' : 'Login failed');
  }

  const tokenRes = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: req.codeVerifier ?? '',
      },
    },
    discovery
  );

  if (!tokenRes.accessToken) {
    throw new Error('No access token returned');
  }

  return {
    accessToken: tokenRes.accessToken,
    idToken: typeof tokenRes.idToken === 'string' ? tokenRes.idToken : undefined,
  };
}
