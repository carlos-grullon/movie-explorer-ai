import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../auth/AuthProvider';
import type { RootStackParamList } from '../navigation/types';

export function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { status, user, login, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mounted, setMounted] = useState(false);

  const translateX = useRef(new Animated.Value(-320)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const label = status === 'signed_in' ? 'Logout' : 'Login';

  const who = useMemo(() => {
    if (status !== 'signed_in') return 'Not signed in';
    return user?.name || user?.email || 'Signed in';
  }, [status, user]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -320, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, opacity, translateX]);

  async function onAuthPress() {
    if (status === 'loading') return;
    try {
      if (status === 'signed_in') await logout();
      else await login();
      onClose();
    } catch (e: any) {
      Alert.alert('Auth', e?.message ?? 'Authentication failed');
    }
  }

  async function onFavoritesPress() {
    try {
      if (status !== 'signed_in') {
        await login();
      }
      navigation.navigate('Favorites');
      onClose();
    } catch (e: any) {
      Alert.alert('Auth', e?.message ?? 'Login required');
    }
  }

  if (!mounted) return null;

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="none">
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
          <View style={styles.header}>
            <Text style={styles.title}>Menu</Text>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <Text style={styles.closeTxt}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.sub}>{who}</Text>

          <View style={{ height: 16 }} />

          <Pressable onPress={onAuthPress} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.primaryTxt}>{label}</Text>
          </Pressable>

          <View style={{ height: 14 }} />

          <Pressable onPress={onFavoritesPress} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.secondaryTxt}>Favorites</Text>
          </Pressable>

          <View style={{ height: 10 }} />

          <Text style={styles.hint}>Next: Recommendations</Text>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    backgroundColor: '#0b0b0f',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 22,
  },
  sub: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryTxt: {
    color: 'white',
    fontWeight: '800',
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  secondaryTxt: {
    color: 'white',
    fontWeight: '800',
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});
