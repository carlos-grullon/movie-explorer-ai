import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'auth0_access_token';
const ID_TOKEN_KEY = 'auth0_id_token';

export async function saveTokens(tokens: { accessToken: string; idToken?: string | null }) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.idToken) {
    await SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.idToken);
  } else {
    await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
  }
}

export async function loadTokens(): Promise<{ accessToken: string | null; idToken: string | null }> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const idToken = await SecureStore.getItemAsync(ID_TOKEN_KEY);
  return { accessToken, idToken };
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
}
