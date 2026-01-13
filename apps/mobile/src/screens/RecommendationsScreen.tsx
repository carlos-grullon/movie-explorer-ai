import { useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../auth/AuthProvider';
import {
  recommendationsGet,
  tmdbMovieDetails,
  tmdbPosterUrl,
  type Recommendation,
  type TmdbMovieDetails,
} from '../api/client';
import { loadTokens } from '../auth/tokenStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Recommendations'>;

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; movie: TmdbMovieDetails; items: Recommendation[]; source: 'openai' | 'tmdb' | null };

export function RecommendationsScreen({ route, navigation }: Props) {
  const { movieId } = route.params;
  const { status, accessToken, login } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const title = useMemo(() => {
    if (state.kind !== 'ready') return 'Recommendations';
    return `Because you watched ${state.movie.title}`;
  }, [state]);

  useEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setState({ kind: 'loading' });

        if (status !== 'signed_in' || !accessToken) {
          await login();
          if (cancelled) return;
        }

        const token = accessToken || (await loadTokens()).accessToken;
        if (!token) throw new Error('Not authenticated');

        const [movie, recs] = await Promise.all([tmdbMovieDetails(movieId), recommendationsGet(token, movieId)]);

        const items = Array.isArray(recs?.recommendations) ? recs.recommendations : [];
        if (!cancelled) {
          setState({
            kind: 'ready',
            movie,
            items,
            source: recs?.source ?? null,
          });
        }
      } catch (e: any) {
        if (!cancelled) setState({ kind: 'error', message: e?.message ?? 'Failed to load recommendations' });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [movieId, status, accessToken, login]);

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
        <Text style={styles.title}>Couldn’t load recommendations</Text>
        <Text style={styles.muted}>{state.message}</Text>
      </View>
    );
  }

  const badge = state.source === 'openai' ? 'AI' : state.source === 'tmdb' ? 'TMDb fallback' : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommendations</Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      <Text style={styles.sub}>Up to 5 similar movies.</Text>

      <View style={{ height: 10 }} />

      {state.items.length === 0 ? (
        <Text style={styles.muted}>No recommendations yet.</Text>
      ) : (
        state.items.map((r, idx) => {
          const titleText = `${r.title}${r.year ? ` (${r.year})` : ''}`;
          const disabled = !r.tmdbMovieId;
          return (
            <Pressable
              key={`${r.tmdbMovieId ?? r.title}-${idx}`}
              disabled={disabled}
              onPress={() => {
                if (!r.tmdbMovieId) return;
                navigation.navigate('MovieDetails', { movieId: r.tmdbMovieId });
              }}
              style={({ pressed }) => [styles.card, pressed && !disabled && { opacity: 0.85 }, disabled && { opacity: 0.6 }]}
            >
              <RecPoster tmdbMovieId={r.tmdbMovieId} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {titleText}
                </Text>
                {r.reason ? (
                  <Text style={styles.reason} numberOfLines={3}>
                    {r.reason}
                  </Text>
                ) : null}
                {disabled ? <Text style={styles.smallMuted}>No TMDb match</Text> : null}
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function RecPoster(props: { tmdbMovieId: number | null }) {
  const [posterPath, setPosterPath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!props.tmdbMovieId) return;
      try {
        const movie = await tmdbMovieDetails(props.tmdbMovieId);
        if (!cancelled) setPosterPath(movie.poster_path ?? null);
      } catch {
        if (!cancelled) setPosterPath(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.tmdbMovieId]);

  const poster = tmdbPosterUrl(posterPath, 500);
  if (!poster) return <View style={styles.posterFallback} />;
  return <Image source={{ uri: poster }} style={styles.poster} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  content: {
    padding: 16,
    gap: 12,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  sub: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  badge: {
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
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  poster: {
    width: 52,
    height: 78,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  posterFallback: {
    width: 52,
    height: 78,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  reason: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  smallMuted: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '700',
  },
});
