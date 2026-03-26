import React, { useEffect, useRef } from "react";
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../../src/theme/tokens";
import { motion } from "../../src/theme/motion";

const introBg = require("../../assets/Background Image with Tonal Overlay.png");

export default function Intro() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: motion.pageDuration + 60, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: motion.pageDuration + 60, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  return (
    <View style={styles.safe}>
      <ImageBackground
        source={introBg}
        resizeMode="cover"
        style={styles.bgImage}
        imageStyle={styles.bgImageStyle}
      >
        <View style={styles.bgTint} />
        {/* Keep overlays subtle so the background stays 100% visible */}
      </ImageBackground>

      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View style={[styles.wrap, { opacity: fade, transform: [{ translateY: lift }] }]}>
        <Text style={styles.brand}>KINETIC</Text>
        <Text style={styles.hero}>
          Evolve beyond{"\n"}
          <Text style={styles.heroAccent}>limits</Text>
        </Text>
        <Text style={styles.copy}>
          Book elite gyms, track your pulse, and build a streak — with clean control and premium motion.
        </Text>

        <View style={styles.ctaRow}>
          <Pressable style={styles.primary} onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.primaryText}>Get started</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.secondaryText}>Log in</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Ethiopian-first fitness. Global-level polish.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16,
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgImageStyle: {
    opacity: 1,
    // Zoom out (less scale) while keeping the top portion visible behind the title.
    transform: [{ translateY: -220 }, { scale: 0.88 }],
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    // Very light tint for readability without hiding the image.
    backgroundColor: "#090A110E",
  },
  glowTop: {
    position: "absolute",
    top: -120,
    left: -70,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.glowTop,
  },
  glowBottom: {
    position: "absolute",
    bottom: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.glowBottom,
  },
  wrap: { gap: 14, paddingBottom: 26 },
  brand: { color: colors.purple, fontSize: 28, fontWeight: "800", letterSpacing: 1.2 },
  hero: { color: colors.text, fontSize: 54, fontWeight: "900", textTransform: "uppercase", lineHeight: 56 },
  heroAccent: { color: colors.lime },
  copy: { color: colors.textMuted, fontSize: 15, lineHeight: 21, maxWidth: 340 },
  ctaRow: { gap: 10, marginTop: 10 },
  primary: {
    backgroundColor: colors.lime,
    borderRadius: 999,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: colors.limeText, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  secondary: {
    backgroundColor: colors.cardSoft,
    borderRadius: 999,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { color: colors.text, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  footer: { color: colors.textMuted, fontSize: 12, marginTop: 8 },
});

