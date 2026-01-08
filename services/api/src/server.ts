import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { openApiSpec } from './swagger/openApiSpec';
import { errorMiddleware } from './middleware/errorMiddleware';
import { requireAuth } from './middleware/requireAuth';
import { favoritesRouter } from './routes/favoritesRouter';
import { recommendationsRouter } from './routes/recommendationsRouter';
import { tmdbRouter } from './routes/tmdbRouter';

export async function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use('/tmdb', tmdbRouter);
  app.use('/favorites', requireAuth(), favoritesRouter);
  app.use('/recommendations', requireAuth(), recommendationsRouter);

  app.use(errorMiddleware);

  return app;
}
