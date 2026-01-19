import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { AuthProvider } from './src/auth/AuthProvider';
import type { RootStackParamList } from './src/navigation/types';
import { MenuButton } from './src/components/MenuButton';
import { SideMenu } from './src/components/SideMenu';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { MovieDetailsScreen } from './src/screens/MovieDetailsScreen';
import { RecommendationsScreen } from './src/screens/RecommendationsScreen';

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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0b0f' }} edges={['top']}>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" backgroundColor="#0b0b0f" translucent={false} />
            <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
            <Stack.Navigator
              screenOptions={{
                headerShown: true,
                headerTitle: 'Movie Explorer AI',
                headerStyle: { backgroundColor: '#0b0b0f' },
                headerTintColor: '#fff',
                headerShadowVisible: false,
                contentStyle: { backgroundColor: '#0b0b0f' },
                headerTitleStyle: { color: '#fff' },
                headerTitleAlign: 'left',
                headerRight: () => <MenuButton onPress={() => setMenuOpen(true)} />,
              }}
            >
              <Stack.Screen name="Browse" component={BrowseScreen} />
              <Stack.Screen name="Favorites" component={FavoritesScreen} />
              <Stack.Screen name="MovieDetails" component={MovieDetailsScreen} />
              <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
