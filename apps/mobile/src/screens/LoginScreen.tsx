import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { GlowButton } from "../components/GlowButton";
import { InputField } from "../components/InputField";
import { ScreenContainer } from "../components/ScreenContainer";
import { api } from "../services/apiClient";
import { mapFirebaseAuthMessage } from "../services/authErrors";
import { isFirebaseClientConfigured } from "../services/firebaseApp";
import { firebaseSendPasswordReset, firebaseSignInWithEmailPassword } from "../services/firebaseAuth";
import { clearSession, setSession } from "../services/sessionStore";
import { colors } from "../theme/tokens";

interface LoginScreenProps {
  onLogin: () => void;
  onGoSignup: () => void;
}

export function LoginScreen({ onLogin, onGoSignup }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const devIdToken = process.env.EXPO_PUBLIC_DEV_FIREBASE_ID_TOKEN ?? "dev";
  const useFirebase = isFirebaseClientConfigured();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await clearSession();
      if (useFirebase) {
        if (!email.trim() || !password) {
          setError("Enter email and password.");
          return;
        }
        const idToken = await firebaseSignInWithEmailPassword(email, password);
        const res = await api.authFirebaseLogin(idToken);
        await setSession(res.accessToken, res.profile.id);
        onLogin();
        return;
      }

      if (email.trim() && password) {
        const res = await api.login({ email: email.trim(), password });
        await setSession(res.accessToken, res.profile.id);
        onLogin();
        return;
      }

      const res = await api.authFirebaseLogin(devIdToken);
      await setSession(res.accessToken, res.profile.id);
      onLogin();
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (useFirebase && err.code?.startsWith("auth/")) {
        setError(mapFirebaseAuthMessage(err.code));
      } else if (e instanceof Error) {
        setError((e.message ?? "").replace(/^API \d+: /, "") || "Could not sign in.");
      } else {
        setError("Could not sign in. Start the API and set EXPO_PUBLIC_API_URL.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    if (!useFirebase) {
      Alert.alert("Password reset", "Configure Firebase in apps/mobile/.env to enable email reset.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Email required", "Enter your email above, then tap Forgot password?");
      return;
    }
    void (async () => {
      try {
        await firebaseSendPasswordReset(email);
        Alert.alert("Check your email", "We sent a reset link if an account exists for that address.");
      } catch (e) {
        const err = e as { code?: string };
        Alert.alert("Reset failed", err.code ? mapFirebaseAuthMessage(err.code) : "Try again later.");
      }
    })();
  };

  return (
    <ScreenContainer padForTabBar={false}>
      <View style={styles.brandWrap}>
        <Text style={styles.brand}>KINETIC</Text>
        <Text style={styles.tagline}>Push beyond limits</Text>
      </View>
      <View style={styles.panel}>
        <InputField
          label="Athlete Email"
          placeholder="champion@kinetic.fit"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <InputField
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable hitSlop={8} onPress={handleForgot}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>
        {!useFirebase ? (
          <Text style={styles.hint}>
            Sign in with the email and password you used at sign up (saved on the API). Leave both blank to use dev
            token login ({devIdToken}).
          </Text>
        ) : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}
        <GlowButton
          label={loading ? "Signing in…" : "Log In"}
          onPress={() => void handleLogin()}
          disabled={loading}
        />
        {loading ? <ActivityIndicator color={colors.lime} /> : null}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Connect with</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn} onPress={() => Alert.alert("Coming soon", "Google sign-in is next.")}>
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
          <Pressable style={styles.socialBtn} onPress={() => Alert.alert("Coming soon", "Apple sign-in is next.")}>
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={onGoSignup} style={styles.footer}>
        <Text style={styles.footerMuted}>New athlete? </Text>
        <Text style={styles.footerLime}>Create account</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandWrap: { alignItems: "center", marginTop: 8, marginBottom: 12 },
  brand: { color: colors.purple, fontSize: 38, fontWeight: "800", letterSpacing: 1 },
  tagline: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  forgot: { color: colors.purple, fontSize: 13, fontWeight: "600", alignSelf: "flex-end" },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  socialRow: { flexDirection: "row", gap: 10 },
  socialBtn: {
    flex: 1,
    backgroundColor: colors.cardSoft,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialText: { color: colors.text, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerMuted: { color: colors.textMuted },
  footerLime: { color: colors.lime, fontWeight: "800" },
  err: { color: colors.purple, fontWeight: "700", fontSize: 13 },
});
