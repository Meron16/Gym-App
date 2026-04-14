import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";



let cachedApp: FirebaseApp | undefined;



function readFirebaseOptions(): FirebaseOptions | null {

  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;

  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {

    return null;

  }

  return {

    apiKey,

    authDomain,

    projectId,

    appId,

    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,

  };

}



/** True when client web config is present (Auth can initialize). */

export function isFirebaseClientConfigured(): boolean {

  return readFirebaseOptions() !== null;

}



export function getFirebaseApp(): FirebaseApp {

  if (cachedApp) return cachedApp;

  const options = readFirebaseOptions();

  if (!options) {

    throw new Error("Firebase client is not configured. Set EXPO_PUBLIC_FIREBASE_* in apps/mobile/.env");

  }

  cachedApp = getApps().length > 0 ? getApps()[0]! : initializeApp(options);

  return cachedApp;

}

