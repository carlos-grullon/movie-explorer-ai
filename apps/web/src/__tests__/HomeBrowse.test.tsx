import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import { HomeBrowse } from '../app/components/HomeBrowse';
import { renderWithQueryClient, screen } from '../test/testUtils';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const sampleResults = {
  page: 1,
  total_pages: 1,
  total_results: 2,
  results: [
    {
      id: 1,
      title: 'Sample Movie',
      overview: 'A sample movie overview',
      poster_path: null,
      release_date: '2020-01-01',
      genre_ids: [28, 18],
    },
    {
      id: 2,
      title: 'Another Movie',
      overview: 'Another overview',
      poster_path: null,
      release_date: '2019-05-05',
      genre_ids: [18],
    },
  ],
};

const sampleGenres = {
  genres: [
    { id: 28, name: 'Action' },
    { id: 18, name: 'Drama' },
  ],
};

describe('HomeBrowse', () => {
  it('shows trending by default and switches to search on submit', async () => {
    server.use(
      http.get('/api/tmdb/trending', () => HttpResponse.json(sampleResults)),
      http.get('/api/tmdb/genres', () => HttpResponse.json(sampleGenres)),
      http.get('/api/tmdb/search', () => HttpResponse.json(sampleResults))
    );

    renderWithQueryClient(<HomeBrowse />);

    expect(await screen.findByText('2 results')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/search by title/i);
    await userEvent.type(input, 'matrix');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText('Sample Movie')).toBeInTheDocument();
  });

  it('aplica filtros de año y género en discover', async () => {
    server.use(
      http.get('/api/tmdb/trending', () => HttpResponse.json(sampleResults)),
      http.get('/api/tmdb/genres', () => HttpResponse.json(sampleGenres)),
      http.get('/api/tmdb/discover', ({ request }) => {
        const url = new URL(request.url);
        const year = url.searchParams.get('year');
        const genres = url.searchParams.get('genres');
        if (year === '2020' && genres === '28') {
          return HttpResponse.json(sampleResults);
        }
        return new HttpResponse(null, { status: 400 });
      })
    );

    renderWithQueryClient(<HomeBrowse />);

    await userEvent.click(await screen.findByRole('button', { name: /genres:/i }));
    await userEvent.click(screen.getByLabelText('Action'));
    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    await userEvent.selectOptions(screen.getByLabelText(/year/i), '2020');

    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(await screen.findByText('Sample Movie')).toBeInTheDocument();
  });
});
