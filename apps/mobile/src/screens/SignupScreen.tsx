import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { GlowButton } from "../components/GlowButton";
import { InputField } from "../components/InputField";
import { ScreenContainer } from "../components/ScreenContainer";
import { api } from "../services/apiClient";
import { mapFirebaseAuthMessage } from "../services/authErrors";
import { isFirebaseClientConfigured } from "../services/firebaseApp";
import { firebaseSignUpWithEmailPassword } from "../services/firebaseAuth";
import { clearSession, setSession } from "../services/sessionStore";
import { colors } from "../theme/tokens";

interface SignupScreenProps {
  onSignup: () => void;
  onGoLogin: () => void;
}

export function SignupScreen({ onSignup, onGoLogin }: SignupScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useFirebase = isFirebaseClientConfigured();

  const handleCreate = async () => {
    setError(null);
    if (!agreed) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await clearSession();
      if (useFirebase) {
        const idToken = await firebaseSignUpWithEmailPassword(email, password, fullName);
        const res = await api.authFirebaseLogin(idToken);
        await setSession(res.accessToken, res.profile.id);
      } else {
        const res = await api.register({
          email: email.trim(),
          password,
          fullName: fullName.trim() || undefined,
          phone: phone.replace(/\D/g, "") || undefined,
        });
        await setSession(res.accessToken, res.profile.id);
      }
      onSignup();
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (useFirebase && err.code?.startsWith("auth/")) {
        setError(mapFirebaseAuthMessage(err.code));
      } else if (e instanceof Error) {
        const raw = (e.message ?? "").replace(/^API \d+: /, "");
        const lower = raw.toLowerCase();
        if (
          lower.includes("already exists") ||
          lower.includes("already in use") ||
          lower.includes("email-already")
        ) {
          setError("This email already has an account. Use Log in below.");
        } else {
          setError(raw || "Could not create account.");
        }
      } else {
        setError("Could not create account. Is the API running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer padForTabBar={false}>
      <Text style={styles.brand}>KINETIC</Text>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start your elite fitness journey today.</Text>
      <View style={styles.panel}>
        <InputField
          label="Full Name"
          placeholder="John Doe"
          value={fullName}
          onChangeText={setFullName}
        />
        <InputField
          label="Email Address"
          placeholder="athlete@kinetic.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <InputField
          label="Mobile Number"
          placeholder="251912345678 (digits only)"
          keyboardType="number-pad"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 20))}
        />
        <InputField
          label="Create Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {!useFirebase ? (
          <Text style={styles.hint}>
            Account is created on the API database (email + password). Add Firebase client env vars to use Firebase
            sign-up instead.
          </Text>
        ) : null}
        <Pressable style={styles.termsRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.radio, agreed && styles.radioOn]} />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.link}>Terms</Text> and{" "}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </Pressable>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        <GlowButton
          label={loading ? "Creating…" : "Create Account"}
          variant="purple"
          onPress={() => void handleCreate()}
          disabled={loading}
        />
        {loading ? <ActivityIndicator color={colors.lime} /> : null}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.socialRow}>
          <Pressable style={styles.socialBtn} onPress={() => Alert.alert("Coming soon", "Google sign-up is next.")}>
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
          <Pressable style={styles.socialBtn} onPress={() => Alert.alert("Coming soon", "Apple sign-up is next.")}>
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={onGoLogin} style={styles.footer}>
        <Text style={styles.footerMuted}>Already have an account? </Text>
        <Text style={styles.footerLime}>Log in</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brand: { color: colors.purple, fontSize: 26, fontWeight: "800", textAlign: "center" },
  title: { color: colors.text, fontSize: 32, fontWeight: "800", marginTop: 8 },
  subtitle: { color: colors.textMuted, marginBottom: 4 },
  panel: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
  },
  hint: { color: colors.textMuted, fontSize: 12 },
  termsRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginVertical: 4 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 2,
  },
  radioOn: { borderColor: colors.lime, backgroundColor: colors.lime },
  termsText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  link: { color: colors.purple, fontWeight: "700" },
  err: { color: colors.purple, fontWeight: "700", fontSize: 13 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 11, textTransform: "uppercase" },
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
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  footerMuted: { color: colors.textMuted },
  footerLime: { color: colors.lime, fontWeight: "800" },
});
