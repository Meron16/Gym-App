import { getAuth, inMemoryPersistence, initializeAuth, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./firebaseApp";

let cachedAuth: Auth | undefined;

/**
 * Native (iOS/Android): uses in-memory persistence to stay compatible with Firebase v11+.
 * Web uses firebaseAuthInstance.web.ts.
 */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  try {
    cachedAuth = initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
  } catch {
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}
