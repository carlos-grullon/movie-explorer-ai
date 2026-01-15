import { Auth0Client } from '@auth0/nextjs-auth0/server';

function readAmplifySecrets(): Record<string, string> {
  const raw = process.env.secrets;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function fromSecrets(key: string): string | undefined {
  const secrets = readAmplifySecrets();
  return secrets[key] || undefined;
}

const domain = process.env.AUTH0_DOMAIN || fromSecrets('AUTH0_DOMAIN');
const clientId = process.env.AUTH0_CLIENT_ID || fromSecrets('AUTH0_CLIENT_ID');
const clientSecret = process.env.AUTH0_CLIENT_SECRET || fromSecrets('AUTH0_CLIENT_SECRET');
const secret = process.env.AUTH0_SECRET || fromSecrets('AUTH0_SECRET');
const appBaseUrl = process.env.APP_BASE_URL || fromSecrets('APP_BASE_URL');
const audience = process.env.AUTH0_AUDIENCE || fromSecrets('AUTH0_AUDIENCE');

export const auth0 = new Auth0Client({
  domain,
  clientId,
  clientSecret,
  secret,
  appBaseUrl,
  authorizationParameters: {
    audience,
    scope: 'openid profile email',
  },
});
