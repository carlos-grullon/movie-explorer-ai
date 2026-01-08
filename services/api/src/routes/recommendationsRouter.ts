import { Router } from 'express';
import { z } from 'zod';

import { RecommendationService } from '../services/recommendationService';

export const recommendationsRouter = Router();

const service = new RecommendationService();

recommendationsRouter.get('/:movieId', async (req, res, next) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    const result = await service.getRecommendations(movieId);
    (res.locals as any).recommendationsSource = result.source;
    res.json({ recommendations: result.recommendations, source: result.source });
  } catch (e) {
    next(e);
  }
});
