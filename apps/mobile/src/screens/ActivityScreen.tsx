import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ActivityBarChart } from "../components/ActivityBarChart";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { ProgressRing } from "../components/ProgressRing";
import { ScreenContainer } from "../components/ScreenContainer";
import { api } from "../services/apiClient";
import { getAccessToken } from "../services/sessionStore";
import type { ActivitySummary } from "../types/app";
import { colors } from "../theme/tokens";

export function ActivityScreen() {
  const [data, setData] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [logging, setLogging] = useState(false);

  const load = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setAuthRequired(true);
      setData(null);
      setLoading(false);
      return;
    }
    try {
      setAuthRequired(false);
      setLoading(true);
      const s = await api.getActivitySummary();
      setData(s);
    } catch {
      setAuthRequired(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const progress = useMemo(() => {
    if (!data) return 0;
    return Math.min(0.98, data.sessionsThisWeek / 7);
  }, [data]);

  const chartValues = useMemo(() => {
    if (!data?.weeklyBars?.length) return undefined;
    return data.weeklyBars;
  }, [data]);

  const chartLabels = useMemo(() => {
    if (!data?.weeklyLabels?.length) return undefined;
    return data.weeklyLabels;
  }, [data]);

  const logQuickWorkout = () => {
    void (async () => {
      try {
        setLogging(true);
        await api.logWorkout({ kind: "strength", durationMinutes: 42 });
        await load();
      } catch {
        Alert.alert("Could not log", "Sign in and ensure the API is reachable.");
      } finally {
        setLogging(false);
      }
    })();
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Pulse</Text>
      <Text style={styles.subtitle}>
        Streaks, volume, and energy — wired to your account when you&apos;re signed in.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.lime} style={{ marginTop: 24 }} />
      ) : authRequired ? (
        <GlassCard>
          <Text style={styles.muted}>
            Sign in to load your streak, weekly chart, and leaderboard from the API.
          </Text>
          <GlowButton label="Retry" variant="purple" onPress={() => void load()} />
        </GlassCard>
      ) : data ? (
        <>
          <GlassCard style={styles.ringCard}>
            <View style={styles.streakRow}>
              <Text style={styles.streakLabel}>Streak</Text>
              <Text style={styles.streakValue}>{data.streakDays} days</Text>
            </View>
            <ProgressRing
              progress={progress}
              label={`${Math.round(progress * 100)}%`}
              sublabel="weekly session goal"
            />
            <View style={styles.ringMeta}>
              <Text style={styles.metaLabel}>Workouts logged</Text>
              <Text style={styles.metaValue}>{data.totalWorkouts}</Text>
            </View>
            <Text style={styles.metaHint}>
              Gym sessions this week: {data.gymSessionsThisWeek} · Logged workouts: {data.sessionsThisWeek}
            </Text>
          </GlassCard>

          <View style={styles.actions}>
            <GlowButton
              label={logging ? "Logging…" : "Log a workout"}
              onPress={logQuickWorkout}
              disabled={logging}
            />
          </View>

          <View style={styles.grid}>
            <GlassCard style={styles.statTile}>
              <Text style={styles.statIcon}>♥</Text>
              <Text style={styles.statValue}>{data.stats.avgHeartRate}</Text>
              <Text style={styles.statLabel}>Avg BPM (est.)</Text>
            </GlassCard>
            <GlassCard style={styles.statTile}>
              <Text style={styles.statIcon}>👟</Text>
              <Text style={styles.statValue}>{data.stats.stepsEstimate.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Steps (est.)</Text>
            </GlassCard>
            <GlassCard style={styles.statTile}>
              <Text style={styles.statIcon}>☾</Text>
              <Text style={styles.statValue}>{data.stats.sleepHours.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>Sleep (est.)</Text>
            </GlassCard>
            <GlassCard style={styles.statTile}>
              <Text style={styles.statIcon}>💧</Text>
              <Text style={styles.statValue}>{data.stats.hydrationLiters.toFixed(1)}L</Text>
              <Text style={styles.statLabel}>Hydration (est.)</Text>
            </GlassCard>
          </View>

          <GlassCard>
            <Text style={styles.sectionTitle}>Badges</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
              {data.badges.map((b) => (
                <View key={b} style={styles.badge}>
                  <Text style={styles.badgeText}>{b}</Text>
                </View>
              ))}
            </ScrollView>
          </GlassCard>

          <GlassCard>
            <Text style={styles.sectionTitle}>Leaderboard preview</Text>
            {data.leaderboardPreview.map((row) => (
              <View key={row.rank} style={styles.lbRow}>
                <Text style={styles.lbRank}>#{row.rank}</Text>
                <Text style={styles.lbName}>{row.name}</Text>
                <Text style={styles.lbPts}>{row.points} pts</Text>
              </View>
            ))}
          </GlassCard>

          <GlassCard>
            <Text style={styles.sectionTitle}>Last 7 days</Text>
            <ActivityBarChart values={chartValues} labels={chartLabels} />
          </GlassCard>

          <GlassCard>
            <Text style={styles.sectionTitle}>Wearables</Text>
            <Text style={styles.muted}>
              Apple Health / Google Fit connection is stubbed for now — your manual logs still power streaks and
              charts.
            </Text>
            <Pressable onPress={() => Alert.alert("Coming soon", "Device sync lands after MVP hardening.")}>
              <Text style={styles.link}>Learn more</Text>
            </Pressable>
          </GlassCard>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 34, fontWeight: "900", textTransform: "uppercase" },
  subtitle: { color: colors.textMuted, marginBottom: 4, lineHeight: 20 },
  ringCard: { alignItems: "center", paddingVertical: 20, gap: 12 },
  streakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 8,
  },
  streakLabel: { color: colors.textMuted, fontSize: 12, textTransform: "uppercase", fontWeight: "700" },
  streakValue: { color: colors.lime, fontSize: 18, fontWeight: "900" },
  ringMeta: { alignItems: "center", gap: 4 },
  metaLabel: { color: colors.textMuted, fontSize: 12, textTransform: "uppercase" },
  metaValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  metaHint: { color: colors.textMuted, fontSize: 11, textAlign: "center" },
  actions: { marginBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statTile: { width: "47%", flexGrow: 1, minWidth: "45%", gap: 4 },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 11, textTransform: "uppercase" },
  sectionTitle: { color: colors.text, fontWeight: "800", fontSize: 16, marginBottom: 10 },
  badgeRow: { gap: 10, paddingVertical: 4 },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { color: colors.lime, fontWeight: "800", fontSize: 12 },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  lbRank: { color: colors.textMuted, width: 36, fontWeight: "700" },
  lbName: { color: colors.text, flex: 1, fontWeight: "700" },
  lbPts: { color: colors.purple, fontWeight: "800" },
  muted: { color: colors.textMuted, lineHeight: 20, marginBottom: 10 },
  link: { color: colors.purple, fontWeight: "800" },
});
