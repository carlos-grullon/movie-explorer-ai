import { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '../auth/AuthProvider';
import { favoritesList, tmdbPosterUrl, type Favorite } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Favorites'>;

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; favorites: Favorite[] }
  | { kind: 'error'; message: string };

export function FavoritesScreen({ navigation }: Props) {

  const { status, accessToken, login } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async () => {
    if (status !== 'signed_in' || !accessToken) {
      setState({ kind: 'ready', favorites: [] });
      return;
    }

    try {
      setState({ kind: 'loading' });
      const items = await favoritesList(accessToken);
      setState({ kind: 'ready', favorites: items });
    } catch (e: any) {
      setState({ kind: 'error', message: e?.message ?? 'Failed to load favorites' });
    }
  }, [status, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (status !== 'signed_in') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.muted}>Please login to view your favorites.</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={async () => {
            try {
              await login();
              await load();
            } catch (e: any) {
              Alert.alert('Auth', e?.message ?? 'Login failed');
            }
          }}
        >
          <Text style={styles.primaryButtonText}>Login</Text>
        </Pressable>
      </View>
    );
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
        <Text style={styles.title}>Couldn’t load favorites</Text>
        <Text style={styles.muted}>{state.message}</Text>
        <Pressable style={styles.primaryButton} onPress={load}>
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {state.favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.title}>No favorites yet</Text>
          <Text style={styles.muted}>Open a movie and tap Add to favorites.</Text>
        </View>
      ) : (
        state.favorites.map((f) => {
          const poster = tmdbPosterUrl(f.posterPath, 500);
          return (
            <Pressable
              key={f.id}
              onPress={() => navigation.navigate('MovieDetails', { movieId: f.tmdbMovieId })}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            >
              {poster ? (
                <Image source={{ uri: poster }} style={styles.poster} />
              ) : (
                <View style={styles.posterFallback} />
              )}
              <View style={styles.body}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {f.customTitle || f.title}
                </Text>
                <Text style={styles.rowMeta}>
                  {f.releaseDate || 'Release date n/a'}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}
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
  empty: {
    paddingVertical: 26,
    gap: 8,
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
  row: {
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
  body: {
    flex: 1,
  },
  rowTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  rowMeta: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
});
