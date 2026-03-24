import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActivityBarChart } from "../components/ActivityBarChart";
import { GlassCard } from "../components/GlassCard";
import { ProgressRing } from "../components/ProgressRing";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/tokens";

export function ActivityScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Weekly pulse</Text>
      <Text style={styles.subtitle}>Activity density and daily goals at a glance.</Text>
      <GlassCard style={styles.ringCard}>
        <ProgressRing progress={0.78} label="78%" sublabel="of weekly goal" />
        <View style={styles.ringMeta}>
          <Text style={styles.metaLabel}>Total energy</Text>
          <Text style={styles.metaValue}>12,480 kcal</Text>
        </View>
      </GlassCard>
      <View style={styles.grid}>
        <GlassCard style={styles.statTile}>
          <Text style={styles.statIcon}>♥</Text>
          <Text style={styles.statValue}>72</Text>
          <Text style={styles.statLabel}>Avg heart rate</Text>
        </GlassCard>
        <GlassCard style={styles.statTile}>
          <Text style={styles.statIcon}>👟</Text>
          <Text style={styles.statValue}>9,241</Text>
          <Text style={styles.statLabel}>Total steps</Text>
        </GlassCard>
        <GlassCard style={styles.statTile}>
          <Text style={styles.statIcon}>☾</Text>
          <Text style={styles.statValue}>7h 45m</Text>
          <Text style={styles.statLabel}>Sleep</Text>
        </GlassCard>
        <GlassCard style={styles.statTile}>
          <Text style={styles.statIcon}>💧</Text>
          <Text style={styles.statValue}>2.4L</Text>
          <Text style={styles.statLabel}>Hydration</Text>
        </GlassCard>
      </View>
      <GlassCard>
        <Text style={styles.sectionTitle}>This week</Text>
        <ActivityBarChart />
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 34, fontWeight: "900", textTransform: "uppercase" },
  subtitle: { color: colors.textMuted, marginBottom: 4 },
  ringCard: { alignItems: "center", paddingVertical: 20, gap: 16 },
  ringMeta: { alignItems: "center", gap: 4 },
  metaLabel: { color: colors.textMuted, fontSize: 12, textTransform: "uppercase" },
  metaValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: { width: "47%", flexGrow: 1, minWidth: "45%", gap: 4 },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 26, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 11, textTransform: "uppercase" },
  sectionTitle: { color: colors.text, fontWeight: "800", fontSize: 16, marginBottom: 8 },
});
