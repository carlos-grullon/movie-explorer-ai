import dotenv from 'dotenv';

dotenv.config();

import { createApp } from './server';

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

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
