import { createDrawerNavigator } from '@react-navigation/drawer';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { RootStackNavigator } from './stack';

export type RootDrawerParamList = {
  Home: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

function DrawerContent() {
  const { status, user, login, logout } = useAuth();

  return (
    <View style={styles.drawer}>
      <Text style={styles.drawerTitle}>Movie Explorer</Text>
      <Text style={styles.drawerSub}>
        {status === 'signed_in' ? user?.name || user?.email || 'Signed in' : 'Not signed in'}
      </Text>

      <View style={{ height: 14 }} />

      <Pressable
        onPress={async () => {
          if (status === 'signed_in') await logout();
          else await login();
        }}
        style={({ pressed }) => [styles.drawerButton, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.drawerButtonText}>{status === 'signed_in' ? 'Logout' : 'Login'}</Text>
      </Pressable>

      <View style={{ height: 10 }} />

      <Text style={styles.drawerHint}>
        (Favorites and Recommendations will appear here once Auth is fully wired in.)
      </Text>
    </View>
  );
}

export function RootDrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0b0b0f' },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff' },
        drawerStyle: { backgroundColor: '#0b0b0f' },
        drawerInactiveTintColor: 'rgba(255,255,255,0.8)',
        drawerActiveTintColor: '#fff',
      }}
      drawerContent={() => <DrawerContent />}
    >
      <Drawer.Screen name="Home" component={RootStackNavigator} options={{ title: 'Trending' }} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    backgroundColor: '#0b0b0f',
  },
  drawerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  drawerSub: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  drawerButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  drawerButtonText: {
    color: 'white',
    fontWeight: '800',
  },
  drawerHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
});
