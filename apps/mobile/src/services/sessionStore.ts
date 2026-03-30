import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "kinetic_access_token";
const PROFILE_ID_KEY = "kinetic_profile_id";

export async function setSession(accessToken: string, profileId: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(PROFILE_ID_KEY, profileId);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(PROFILE_ID_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getProfileId(): Promise<string | null> {
  return AsyncStorage.getItem(PROFILE_ID_KEY);
}
