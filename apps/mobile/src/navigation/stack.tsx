import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';
import { BrowseScreen } from '../screens/BrowseScreen';
import { MovieDetailsScreen } from '../screens/MovieDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  return (
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
  );
}
