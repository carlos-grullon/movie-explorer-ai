export function backendUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const url = new URL(rawBase.includes('://') ? rawBase : `http://${rawBase}`);
  // strip any trailing /api or /api/... and trailing slash
  const cleanedPath = url.pathname.replace(/\/?api(?:\/.*)?$/, '').replace(/\/$/, '');
  const base = `${url.origin}${cleanedPath}`.replace(/\/$/, '');

  return `${base}${normalizedPath}`;
}
