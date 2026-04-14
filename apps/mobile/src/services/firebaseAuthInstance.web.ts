import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./firebaseApp";

let cachedAuth: Auth | undefined;

/** Web: IndexedDB / local persistence via default getAuth (no react-native entry). */
export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}
