/** Map Firebase Auth error codes to short user-facing messages. */
export function mapFirebaseAuthMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "That email doesn’t look valid.";
    case "auth/user-disabled":
      return "This account is disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "An account already exists for this email.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Something went wrong. Try again.";
  }
}
