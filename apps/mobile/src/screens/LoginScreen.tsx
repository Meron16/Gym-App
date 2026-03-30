import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { GlowButton } from "../components/GlowButton";
import { InputField } from "../components/InputField";
import { ScreenContainer } from "../components/ScreenContainer";
import { api } from "../services/apiClient";
import { setSession } from "../services/sessionStore";
import { colors } from "../theme/tokens";

interface LoginScreenProps {
  onLogin: () => void;
  onGoSignup: () => void;
}

export function LoginScreen({ onLogin, onGoSignup }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const devIdToken = process.env.EXPO_PUBLIC_DEV_FIREBASE_ID_TOKEN ?? "dev";

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.authFirebaseLogin(devIdToken);
      await setSession(res.accessToken, res.profile.id);
      onLogin();
    } catch {
      setError("Could not sign in. Start the API (apps/api) and check EXPO_PUBLIC_API_URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer padForTabBar={false}>
      <View style={styles.brandWrap}>
        <Text style={styles.brand}>KINETIC</Text>
        <Text style={styles.tagline}>Push beyond limits</Text>
      </View>
      <View style={styles.panel}>
        <InputField label="Athlete Email" placeholder="champion@kinetic.fit" keyboardType="email-address" />
        <InputField label="Access Key" placeholder="••••••••" secureTextEntry />
        <Pressable hitSlop={8}>
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>
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
          <Pressable style={styles.socialBtn}>
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
          <Pressable style={styles.socialBtn}>
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
