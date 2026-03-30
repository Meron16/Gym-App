import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActivityBarChart } from "../components/ActivityBarChart";
import { GlassCard } from "../components/GlassCard";
import { ProgressRing } from "../components/ProgressRing";
import { ScreenContainer } from "../components/ScreenContainer";
import { api } from "../services/apiClient";
import { getProfileId } from "../services/sessionStore";
import { colors } from "../theme/tokens";

export function ActivityScreen() {
  const [streak, setStreak] = useState(12);
  const [sessionsWeek, setSessionsWeek] = useState(4);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const id = (await getProfileId()) ?? "guest";
      try {
        const s = await api.getActivitySummary(id);
        if (!mounted) return;
        setStreak(s.streakDays);
        setSessionsWeek(s.sessionsThisWeek);
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const progress = useMemo(() => Math.min(0.98, sessionsWeek / 7), [sessionsWeek]);

  return (
    <ScreenContainer>
      <Text style={styles.title}>Weekly pulse</Text>
      <Text style={styles.subtitle}>
        Streak {streak} days · {sessionsWeek} sessions this week (from API when online).
      </Text>
      <GlassCard style={styles.ringCard}>
        <ProgressRing progress={progress} label={`${Math.round(progress * 100)}%`} sublabel="of weekly goal" />
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
