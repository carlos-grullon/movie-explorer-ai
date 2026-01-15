import request from 'supertest';

import { createApp } from '../src/server';

describe('TMDB router (mocked)', () => {
  beforeAll(() => {
    process.env.TMDB_MOCK = 'true';
    process.env.TMDB_API_KEY = '';
  });

  const setupApp = async () => createApp();

  it('search returns results by query', async () => {
    const app = await setupApp();

    const res = await request(app).get('/tmdb/search').query({ query: 'matrix' });

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'The Matrix' })])
    );
  });

  it('search filters by year when provided', async () => {
    const app = await setupApp();

    const res = await request(app).get('/tmdb/search').query({ query: 'matrix', year: 2010 });

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  it('search filters by genre ids', async () => {
    const app = await setupApp();

    const res = await request(app)
      .get('/tmdb/search')
      .query({ query: 'the', genreIds: '80' }); // Crime genre should include The Dark Knight

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'The Dark Knight' })])
    );
    expect(res.body.results).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Interstellar' })])
    );
  });

  it('search sorts results by most recent release_date', async () => {
    const app = await setupApp();

    const res = await request(app).get('/tmdb/search').query({ query: 'the' });

    expect(res.status).toBe(200);
    const dates = res.body.results.map((r: any) => r.release_date).filter(Boolean);
    for (let i = 1; i < dates.length; i++) {
      expect(Date.parse(dates[i - 1])).toBeGreaterThanOrEqual(Date.parse(dates[i]));
    }
  });

  it('discover respects year and genre filters', async () => {
    const app = await setupApp();

    const res = await request(app)
      .get('/tmdb/discover')
      .query({ year: 1999, genreIds: '28' }); // Action genre, 1999 -> The Matrix

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'The Matrix' })])
    );
  });

  it('genres endpoint returns available genres', async () => {
    const app = await setupApp();

    const res = await request(app).get('/tmdb/genres');

    expect(res.status).toBe(200);
    expect(res.body.genres).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Science Fiction' })])
    );
  });
});
