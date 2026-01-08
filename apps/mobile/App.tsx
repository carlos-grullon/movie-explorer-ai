import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './src/navigation/types';
import { BrowseScreen } from './src/screens/BrowseScreen';
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
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0b0b0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#0b0b0f' },
        }}
      >
        <Stack.Screen name="Browse" component={BrowseScreen} options={{ title: 'Trending' }} />
        <Stack.Screen name="MovieDetails" component={MovieDetailsScreen} options={{ title: 'Movie' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
