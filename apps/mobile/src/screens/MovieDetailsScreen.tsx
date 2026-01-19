import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import {
  ApiError,
  favoritesAdd,
  favoritesList,
  favoritesRemove,
  recommendationsGet,
  tmdbMovieDetails,
  tmdbPosterUrl,
  type Favorite,
  type Recommendation,
  type TmdbMovieDetails,
} from '../api/client';
import { useAuth } from '../auth/AuthProvider';
import { loadTokens } from '../auth/tokenStore';

type Props = NativeStackScreenProps<RootStackParamList, 'MovieDetails'>;

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; movie: TmdbMovieDetails };

export function MovieDetailsScreen({ route, navigation }: Props) {
  const { movieId } = route.params;
  const [state, setState] = useState<State>({ kind: 'loading' });
  const { status, accessToken, login } = useAuth();
  const [favorite, setFavorite] = useState<Favorite | null>(null);
  const [favBusy, setFavBusy] = useState(false);

  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const [recsSource, setRecsSource] = useState<'openai' | 'tmdb' | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRecsLoading(true);
      setRecsError(null);
      setRecsSource(null);
      setRecs([]);
      try {
        if (status !== 'signed_in') {
          if (!cancelled) {
            setRecsLoading(false);
            setRecsError('Debes iniciar sesión para ver recomendaciones.');
          }
          return;
        }
        const token = accessToken || (await loadTokens()).accessToken;
        if (!token) throw new Error('Debes iniciar sesión para ver recomendaciones.');

        const json = await recommendationsGet(token, movieId);
        const items = Array.isArray(json?.recommendations) ? json.recommendations.slice(0, 5) : [];
        if (cancelled) return;
        setRecs(items);
        setRecsSource(json?.source ?? null);
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setRecsError(e.message);
          return;
        }
        const message = e instanceof Error ? e.message : 'Failed to load recommendations';
        setRecsError(message);
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [movieId, status, accessToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (status !== 'signed_in' || !accessToken) {
        setFavorite(null);
        return;
      }
      try {
        const items = await favoritesList(accessToken);
        if (cancelled) return;
        const hit = items.find((f) => f.tmdbMovieId === movieId) ?? null;
        setFavorite(hit);
      } catch {
        if (!cancelled) setFavorite(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, accessToken, movieId]);

  async function onToggleFavorite(movie: TmdbMovieDetails) {
    if (favBusy) return;
    setFavBusy(true);
    try {
      if (status !== 'signed_in' || !accessToken) {
        Alert.alert('Favoritos', 'Debes iniciar sesión para agregar o eliminar favoritos.', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar sesión',
            onPress: async () => {
              try {
                await login();
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : 'Login failed';
                Alert.alert('Auth', message);
              }
            },
          },
        ]);
        return;
      }

      if (favorite) {
        await favoritesRemove(accessToken, favorite.id);
        setFavorite(null);
      } else {
        const created = await favoritesAdd(accessToken, {
          tmdbMovieId: movie.id,
          title: movie.title,
          releaseDate: movie.release_date,
          posterPath: movie.poster_path,
        });
        setFavorite(created);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update favorites';
      Alert.alert('Favoritos', message);
    } finally {
      setFavBusy(false);
    }
  }

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

      <View style={{ height: 16 }} />

      <Pressable
        onPress={() => onToggleFavorite(movie)}
        style={({ pressed }) => [styles.favBtn, pressed && { opacity: 0.85 }, favBusy && { opacity: 0.6 }]}
        disabled={favBusy}
      >
        <Text style={styles.favTxt}>{favorite ? 'Remove from favorites' : 'Add to favorites'}</Text>
      </Pressable>

      <View style={{ height: 22 }} />

      <View style={styles.recsHeader}>
        <Text style={styles.recsTitle}>Recommendations</Text>
        {recsSource ? (
          <Text style={styles.recsBadge}>{recsSource === 'openai' ? 'AI' : 'TMDb fallback'}</Text>
        ) : null}
      </View>
      <Text style={styles.recsSub}>Up to 5 similar movies.</Text>

      <View style={{ height: 12 }} />

      {recsLoading ? <Text style={styles.recsMuted}>Loading…</Text> : null}
      {!recsLoading && recsError ? (
        <Pressable
          onPress={async () => {
            try {
              await login();
            } catch (e: any) {
              Alert.alert('Auth', e?.message ?? 'Login failed');
            }
          }}
          disabled={status === 'signed_in'}
        >
          <Text style={styles.recsError}>{recsError}</Text>
        </Pressable>
      ) : null}
      {!recsLoading && !recsError && recs.length === 0 ? (
        <Text style={styles.recsMuted}>No recommendations yet.</Text>
      ) : null}

      {recs.map((r, idx) => {
        const titleText = `${r.title}${r.year ? ` (${r.year})` : ''}`;
        const disabled = !r.tmdbMovieId;
        const poster = tmdbPosterUrl(r.posterPath ?? null, 500);
        return (
          <Pressable
            key={`${r.tmdbMovieId ?? r.title}-${idx}`}
            disabled={disabled}
            onPress={() => {
              if (!r.tmdbMovieId) return;
              navigation.push('MovieDetails', { movieId: r.tmdbMovieId });
            }}
            style={({ pressed }) => [styles.recsCard, pressed && !disabled && { opacity: 0.85 }, disabled && { opacity: 0.6 }]}
          >
            {poster ? <Image source={{ uri: poster }} style={styles.recsPoster} /> : <View style={styles.recsPosterFallback} />}
            <View style={styles.recsBody}>
              <Text style={styles.recsCardTitle} numberOfLines={2}>
                {titleText}
              </Text>
              {r.reason ? (
                <Text style={styles.recsReason} numberOfLines={3}>
                  {r.reason}
                </Text>
              ) : null}
              {disabled ? <Text style={styles.recsSmallMuted}>No TMDb match</Text> : null}
            </View>
          </Pressable>
        );
      })}

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
  favBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  favTxt: {
    color: 'white',
    fontWeight: '800',
  },
  recsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  recsSub: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  recsBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
  },
  recsMuted: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  recsError: {
    color: 'rgba(255,120,120,0.95)',
    fontSize: 12,
    fontWeight: '700',
  },
  recsCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 10,
  },
  recsPoster: {
    width: 52,
    height: 78,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  recsPosterFallback: {
    width: 52,
    height: 78,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  recsBody: {
    flex: 1,
  },
  recsCardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  recsReason: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  recsSmallMuted: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
  },
});
