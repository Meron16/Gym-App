declare module "firebase/auth/react-native" {
  import type { FirebaseApp } from "firebase/app";
  import type { Auth, Persistence } from "firebase/auth";

  export function initializeAuth(app: FirebaseApp, options: { persistence: Persistence }): Auth;
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
