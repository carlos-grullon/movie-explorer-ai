import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { tmdbMovieDetails, tmdbPosterUrl, type TmdbMovieDetails } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'MovieDetails'>;

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; movie: TmdbMovieDetails };

export function MovieDetailsScreen({ route, navigation }: Props) {
  const { movieId } = route.params;
  const [state, setState] = useState<State>({ kind: 'loading' });

  async function load() {
    try {
      const movie = await tmdbMovieDetails(movieId);
      setState({ kind: 'ready', movie });
      navigation.setOptions({ title: movie.title || 'Movie' });
    } catch (e: any) {
      setState({ kind: 'error', message: e?.message ?? 'Failed to load movie' });
    }
  }

  useEffect(() => {
    load();
  }, [movieId]);

  if (state.kind === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (state.kind === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Couldn’t load movie</Text>
        <Text style={styles.muted}>{state.message}</Text>
        <Pressable style={styles.primaryButton} onPress={load}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const movie = state.movie;
  const poster = tmdbPosterUrl(movie.poster_path, 780);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {poster ? <Image source={{ uri: poster }} style={styles.poster} /> : <View style={styles.posterFallback} />}
        <View style={styles.headerBody}>
          <Text style={styles.movieTitle}>{movie.title}</Text>
          <Text style={styles.meta}>
            {movie.release_date || 'Release date n/a'}
            {movie.genres?.length ? ` • ${movie.genres.map((g) => g.name).join(', ')}` : ''}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <Text style={styles.overview}>{movie.overview || 'No overview.'}</Text>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0f',
    padding: 24,
    gap: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  muted: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    gap: 14,
  },
  poster: {
    width: 130,
    height: 195,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  posterFallback: {
    width: 130,
    height: 195,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerBody: {
    flex: 1,
    justifyContent: 'center',
  },
  movieTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  meta: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTitle: {
    marginTop: 18,
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  overview: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 20,
  },
});
