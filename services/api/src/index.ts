import { createApp } from './server';

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

if (process.env.NODE_ENV !== 'production') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config();
  } catch {
    // ignore
  }
}

async function main() {
  const app = await createApp();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[api] fatal error', err);
  process.exit(1);
});
