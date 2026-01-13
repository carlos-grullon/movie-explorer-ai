import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/types';
import { tmdbPosterUrl, tmdbSearch, tmdbTrending, type TmdbMovieListItem } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Browse'>;

type Mode = { type: 'trending' } | { type: 'search'; query: string };

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready';
      movies: TmdbMovieListItem[];
      page: number;
      totalPages: number | null;
      loadingMore: boolean;
      loadMoreError: string | null;
    };

export function BrowseScreen({ navigation }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>({ type: 'trending' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadFirstPage(nextMode: Mode = mode) {
    try {
      const data =
        nextMode.type === 'trending' ? await tmdbTrending(1) : await tmdbSearch(nextMode.query, 1);
      setState({
        kind: 'ready',
        movies: data.results || [],
        page: data.page || 1,
        totalPages: typeof data.total_pages === 'number' ? data.total_pages : null,
        loadingMore: false,
        loadMoreError: null,
      });
    } catch (e: any) {
      setState({ kind: 'error', message: e?.message ?? 'Failed to load trending movies' });
    }
  }

  async function loadNextPage() {
    if (state.kind !== 'ready') return;
    if (state.loadingMore) return;

    const nextPage = state.page + 1;
    if (state.totalPages !== null && nextPage > state.totalPages) return;

    setState({ ...state, loadingMore: true, loadMoreError: null });

    try {
      const data = mode.type === 'trending' ? await tmdbTrending(nextPage) : await tmdbSearch(mode.query, nextPage);
      setState((prev) => {
        if (prev.kind !== 'ready') return prev;
        const incoming = data.results || [];
        const dedup = new Map<number, TmdbMovieListItem>();
        for (const m of prev.movies) dedup.set(m.id, m);
        for (const m of incoming) dedup.set(m.id, m);

        return {
          ...prev,
          movies: Array.from(dedup.values()),
          page: data.page || nextPage,
          totalPages: typeof data.total_pages === 'number' ? data.total_pages : prev.totalPages,
          loadingMore: false,
          loadMoreError: null,
        };
      });
    } catch (e: any) {
      setState((prev) => {
        if (prev.kind !== 'ready') return prev;
        return {
          ...prev,
          loadingMore: false,
          loadMoreError: e?.message ?? 'Failed to load more movies',
        };
      });
    }
  }

  useEffect(() => {
    loadFirstPage();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = query.trim();
      const nextMode: Mode = q.length ? { type: 'search', query: q } : { type: 'trending' };
      setMode(nextMode);
      setState({ kind: 'loading' });
      loadFirstPage(nextMode);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function onRefresh() {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }

  const movies = state.kind === 'ready' ? state.movies : [];
  const loadingMore = state.kind === 'ready' ? state.loadingMore : false;
  const loadMoreError = state.kind === 'ready' ? state.loadMoreError : null;
  const noMore =
    state.kind === 'ready' && state.totalPages !== null ? state.page >= state.totalPages : false;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search movies…"
          placeholderTextColor="rgba(255,255,255,0.55)"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.searchInput}
          clearButtonMode="while-editing"
        />
        {query.length ? (
          <Pressable
            onPress={() => setQuery('')}
            style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.clearButtonText}>×</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={movies}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={() => {
          if (state.kind === 'loading') {
            return (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.muted}>
                  {mode.type === 'search' ? 'Searching…' : 'Loading trending movies…'}
                </Text>
              </View>
            );
          }

          if (state.kind === 'error') {
            return (
              <View style={styles.center}>
                <Text style={styles.title}>Couldn’t load movies</Text>
                <Text style={styles.muted}>{state.message}</Text>
                <Pressable style={styles.primaryButton} onPress={() => loadFirstPage()}>
                  <Text style={styles.primaryButtonText}>Retry</Text>
                </Pressable>
              </View>
            );
          }

          if (mode.type === 'search') {
            return (
              <View style={styles.empty}>
                <Text style={styles.title}>No results</Text>
                <Text style={styles.muted}>Try another search.</Text>
              </View>
            );
          }

          return null;
        }}
        onEndReachedThreshold={0.7}
        onEndReached={() => {
          loadNextPage();
        }}
        ListFooterComponent={() => {
          if (state.kind !== 'ready') return null;
          if (loadingMore) {
            return (
              <View style={styles.footer}>
                <ActivityIndicator />
                <Text style={styles.footerText}>Loading more…</Text>
              </View>
            );
          }

          if (loadMoreError) {
            return (
              <View style={styles.footer}>
                <Text style={styles.footerError}>{loadMoreError}</Text>
                <Pressable style={styles.secondaryButton} onPress={loadNextPage}>
                  <Text style={styles.secondaryButtonText}>Retry</Text>
                </Pressable>
              </View>
            );
          }

          if (noMore) {
            return (
              <View style={styles.footer}>
                <Text style={styles.footerText}>You’re all caught up.</Text>
              </View>
            );
          }

          return null;
        }}
        renderItem={({ item }) => {
          const poster = tmdbPosterUrl(item.poster_path, 500);
          return (
            <Pressable
              onPress={() => navigation.push('MovieDetails', { movieId: item.id })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              {poster ? <Image source={{ uri: poster }} style={styles.poster} /> : <View style={styles.posterFallback} />}
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.release_date || 'Release date n/a'}
                </Text>
                <Text style={styles.cardOverview} numberOfLines={3}>
                  {item.overview || 'No overview.'}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0f',
  },
  searchBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: 'white',
  },
  clearButton: {
    height: 42,
    width: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 18,
  },
  listContent: {
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
  secondaryButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardPressed: {
    opacity: 0.85,
  },
  poster: {
    width: 84,
    height: 126,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  posterFallback: {
    width: 84,
    height: 126,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontSize: 12,
  },
  cardOverview: {
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  empty: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  footerError: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textAlign: 'center',
  },
});
