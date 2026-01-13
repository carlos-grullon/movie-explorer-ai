import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';

import { AuthProvider } from './src/auth/AuthProvider';
import type { RootStackParamList } from './src/navigation/types';
import { MenuButton } from './src/components/MenuButton';
import { SideMenu } from './src/components/SideMenu';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { MovieDetailsScreen } from './src/screens/MovieDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0b0b0f',
    card: '#0b0b0f',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.10)',
  },
};

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" backgroundColor="#0b0b0f" />
          <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#0b0b0f' },
              headerTintColor: '#fff',
              headerShadowVisible: false,
              contentStyle: { backgroundColor: '#0b0b0f' },
              headerTitleStyle: { color: '#fff' },
              headerTitleAlign: 'left',
              headerRight: () => <MenuButton onPress={() => setMenuOpen(true)} />,
            }}
          >
            <Stack.Screen
              name="Browse"
              component={BrowseScreen}
              options={{
                title: 'Trending',
                headerTitle: 'Trending',
                headerShown: true,
                headerTitleStyle: { color: '#fff' },
              }}
            />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favorites' }} />
            <Stack.Screen name="MovieDetails" component={MovieDetailsScreen} options={{ title: 'Movie' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
