export function backendUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (rawBase) {
    const url = new URL(rawBase.includes('://') ? rawBase : `http://${rawBase}`);
    // strip trailing slash and optional /api
    url.pathname = url.pathname.replace(/\/$/, '').replace(/\/api$/, '');
    const base = url.toString().replace(/\/$/, '');
    return `${base}${normalizedPath}`;
  }

  // Default: use Next.js BFF routes (/api/*) in dev/test
  const pathWithApi = normalizedPath.startsWith('/api/') ? normalizedPath : `/api${normalizedPath}`;
  return pathWithApi;
}
