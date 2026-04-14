import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { isFirebaseClientConfigured } from "./firebaseApp";
import { getFirebaseAuth } from "./firebaseAuthInstance";

export async function firebaseSignInWithEmailPassword(email: string, password: string): Promise<string> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user.getIdToken();
}

export async function firebaseSignUpWithEmailPassword(
  email: string,
  password: string,
  displayName?: string,
): Promise<string> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred.user.getIdToken();
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function firebaseSignOut(): Promise<void> {
  if (!isFirebaseClientConfigured()) return;
  try {
    await signOut(getFirebaseAuth());
  } catch {
    /* already signed out or not initialized */
  }
}
