import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { colors } from "../theme/tokens";

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Extra bottom padding when tab bar is visible */
  padForTabBar?: boolean;
}

export function ScreenContainer({ children, padForTabBar = true }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, !padForTabBar && styles.contentNoTab]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  contentNoTab: { paddingBottom: 32 },
  glowTop: {
    position: "absolute",
    top: -110,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.glowTop,
  },
  glowBottom: {
    position: "absolute",
    bottom: -110,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.glowBottom,
  },
});
