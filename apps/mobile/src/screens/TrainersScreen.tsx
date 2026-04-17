import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { GlassCard } from "../components/GlassCard";
import { GymListSkeleton } from "../components/SkeletonShimmer";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import type { TrainerSummary } from "../types/app";
import { api } from "../services/apiClient";
import { colors } from "../theme/tokens";

export function TrainersScreen() {
  const router = useRouter();
  const [trainers, setTrainers] = useState<TrainerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gymFilter, setGymFilter] = useState<string | "all">("all");

  const gymIds = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of trainers) {
      if (!m.has(t.gymId)) m.set(t.gymId, t.gymName);
    }
    return [...m.entries()];
  }, [trainers]);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.getTrainers();
      setTrainers(data);
    } catch {
      setError("Could not load trainers. Check API and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (gymFilter === "all") return trainers;
    return trainers.filter((t) => t.gymId === gymFilter);
  }, [trainers, gymFilter]);

  return (
    <ScreenContainer scrollable>
      <SectionHeader title="Coaches" subtitle="Expertise · availability · book a 1:1 slot" />
      <Text style={styles.heading}>Train with the best</Text>

      {gymIds.length > 1 ? (
        <View style={styles.chips}>
          <FilterChip label="All gyms" active={gymFilter === "all"} onPress={() => setGymFilter("all")} />
          {gymIds.map(([id, name]) => (
            <FilterChip
              key={id}
              label={name}
              active={gymFilter === id}
              onPress={() => setGymFilter(id)}
            />
          ))}
        </View>
      ) : null}

      {loading ? (
        <GymListSkeleton count={3} />
      ) : error ? (
        <GlassCard>
          <EmptyState title="Coaches unavailable" description={error} actionLabel="Retry" onAction={() => void load()} />
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard>
          <EmptyState
            title="No coaches yet"
            description="Operators can add trainers from the admin dashboard."
            actionLabel="Refresh"
            onAction={() => void load()}
          />
        </GlassCard>
      ) : (
        filtered.map((t) => (
          <GlassCard key={t.id} style={styles.card}>
            <Pressable onPress={() => router.push(`/(app)/trainer/${encodeURIComponent(t.id)}`)}>
              <View style={styles.row}>
                {t.photoUrl ? (
                  <Image source={{ uri: t.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPh]}>
                    <Text style={styles.avatarTxt}>{t.name.slice(0, 1)}</Text>
                  </View>
                )}
                <View style={styles.meta}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.gym}>
                    {t.gymName} · {t.gymLocation}
                  </Text>
                  <Text style={styles.tag}>{t.tagline}</Text>
                  <View style={styles.expRow}>
                    {t.expertise.slice(0, 3).map((e) => (
                      <View key={e} style={styles.expChip}>
                        <Text style={styles.expText}>{e}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.avail}>{t.availabilitySummary}</Text>
                </View>
              </View>
            </Pressable>
          </GlassCard>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 26, fontWeight: "900", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  card: { padding: 0, overflow: "hidden" },
  row: { flexDirection: "row", gap: 14, padding: 14 },
  avatar: { width: 72, height: 72, borderRadius: 16 },
  avatarPh: {
    backgroundColor: colors.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarTxt: { color: colors.lime, fontSize: 28, fontWeight: "900" },
  meta: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: 20, fontWeight: "900" },
  gym: { color: colors.textMuted, fontSize: 12 },
  tag: { color: colors.textMuted, fontSize: 13 },
  expRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  expChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expText: { color: colors.purple, fontSize: 11, fontWeight: "700" },
  avail: { color: colors.lime, fontSize: 11, fontWeight: "600", marginTop: 4 },
});
