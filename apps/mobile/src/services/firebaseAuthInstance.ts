import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";
import { getFirebaseApp } from "./firebaseApp";

let cachedAuth: Auth | undefined;

/**
 * Native (iOS/Android): AsyncStorage-backed auth persistence.
 * Web uses firebaseAuthInstance.web.ts — Metro never bundles firebase/auth/react-native there.
 */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  try {
    cachedAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}
