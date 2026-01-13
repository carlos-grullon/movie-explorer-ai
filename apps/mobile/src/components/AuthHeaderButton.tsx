import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '../auth/AuthProvider';

export function AuthHeaderButton() {
  const { status, login, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const label = status === 'signed_in' ? 'Logout' : 'Login';

  async function onPress() {
    if (busy) return;
    setBusy(true);
    try {
      if (status === 'signed_in') {
        await logout();
      } else {
        await login();
      }
    } catch (e: any) {
      Alert.alert('Auth', e?.message ?? 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={busy || status === 'loading'}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, (busy || status === 'loading') && styles.disabled]}
    >
      {busy ? <ActivityIndicator /> : <Text style={styles.text}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
});
