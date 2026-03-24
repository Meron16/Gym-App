import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GlowButton } from "../components/GlowButton";
import { InputField } from "../components/InputField";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/tokens";

interface SignupScreenProps {
  onSignup: () => void;
  onGoLogin: () => void;
}

export function SignupScreen({ onSignup, onGoLogin }: SignupScreenProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <ScreenContainer padForTabBar={false}>
      <Text style={styles.brand}>KINETIC</Text>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start your elite fitness journey today.</Text>
      <View style={styles.panel}>
        <InputField label="Full Name" placeholder="John Doe" />
        <InputField label="Email Address" placeholder="athlete@kinetic.com" keyboardType="email-address" />
        <InputField label="Mobile Number" placeholder="+251 9XX XXX XXX" keyboardType="phone-pad" />
        <InputField label="Create Password" placeholder="••••••••" secureTextEntry />
        <Pressable style={styles.termsRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.radio, agreed && styles.radioOn]} />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.link}>Terms</Text> and{" "}
            <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </Pressable>
        <GlowButton label="Create Account" variant="purple" onPress={onSignup} />
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or continue with</Text>
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
