export type MockMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  genres: Array<{ id: number; name: string }>;
};

export const MOCK_MOVIES: MockMovie[] = [
  {
    id: 603,
    title: 'The Matrix',
    overview:
      'A computer hacker learns about the true nature of his reality and his role in the war against its controllers.',
    poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    release_date: '1999-03-30',
    genres: [
      { id: 28, name: 'Action' },
      { id: 878, name: 'Science Fiction' },
    ],
  },
  {
    id: 157336,
    title: 'Interstellar',
    overview:
      'A team of explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    release_date: '2014-11-05',
    genres: [
      { id: 12, name: 'Adventure' },
      { id: 18, name: 'Drama' },
      { id: 878, name: 'Science Fiction' },
    ],
  },
  {
    id: 27205,
    title: 'Inception',
    overview: 'A thief who steals corporate secrets through dream-sharing technology is given an impossible task.',
    poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    release_date: '2010-07-16',
    genres: [
      { id: 28, name: 'Action' },
      { id: 878, name: 'Science Fiction' },
      { id: 53, name: 'Thriller' },
    ],
  },
  {
    id: 155,
    title: 'The Dark Knight',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and Harvey Dent...',
    poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    release_date: '2008-07-18',
    genres: [
      { id: 18, name: 'Drama' },
      { id: 28, name: 'Action' },
      { id: 80, name: 'Crime' },
    ],
  },
];
