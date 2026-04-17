import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SkeletonBox } from "../components/SkeletonShimmer";
import type { TrainerDetail } from "../types/app";
import { api } from "../services/apiClient";
import { colors } from "../theme/tokens";

interface TrainerDetailScreenProps {
  trainerId: string;
}

export function TrainerDetailScreen({ trainerId }: TrainerDetailScreenProps) {
  const router = useRouter();
  const [trainer, setTrainer] = useState<TrainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!trainerId) return;
    try {
      setError(null);
      setLoading(true);
      const t = await api.getTrainer(trainerId);
      setTrainer(t);
    } catch {
      setError("Could not load this coach.");
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenContainer scrollable>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      {loading ? (
        <GlassCard>
          <SkeletonBox height={28} width="70%" radius={10} />
          <SkeletonBox height={14} width="50%" radius={8} />
          <SkeletonBox height={120} width="100%" radius={16} />
        </GlassCard>
      ) : error || !trainer ? (
        <GlassCard>
          <EmptyState title="Coach unavailable" description={error ?? "—"} actionLabel="Retry" onAction={() => void load()} />
        </GlassCard>
      ) : (
        <>
          <GlassCard style={styles.hero}>
            <View style={styles.heroRow}>
              {trainer.photoUrl ? (
                <Image source={{ uri: trainer.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPh]}>
                  <Text style={styles.avatarTxt}>{trainer.name.slice(0, 1)}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{trainer.name}</Text>
                <Text style={styles.gym}>
                  {trainer.gymName} · {trainer.gymLocation}
                </Text>
                <Text style={styles.tag}>{trainer.tagline}</Text>
              </View>
            </View>
            <View style={styles.expRow}>
              {trainer.expertise.map((e) => (
                <View key={e} style={styles.expChip}>
                  <Text style={styles.expText}>{e}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.section}>Typical week</Text>
            {trainer.availability.map((row) => (
              <Text key={row.day} style={styles.availLine}>
                <Text style={styles.day}>{row.day}</Text> · {(row.slots ?? []).join(", ")}
              </Text>
            ))}
          </GlassCard>
          <GlowButton
            label="Book a session"
            onPress={() =>
              router.push(`/(app)/trainer-book/${encodeURIComponent(trainer.id)}`)
            }
          />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.purple, fontWeight: "700", marginBottom: 12 },
  hero: { gap: 10 },
  heroRow: { flexDirection: "row", gap: 14 },
  avatar: { width: 88, height: 88, borderRadius: 20 },
  avatarPh: {
    backgroundColor: colors.cardSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarTxt: { color: colors.lime, fontSize: 32, fontWeight: "900" },
  name: { color: colors.text, fontSize: 26, fontWeight: "900" },
  gym: { color: colors.textMuted, fontSize: 13 },
  tag: { color: colors.textMuted, marginTop: 4, lineHeight: 20 },
  expRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  expChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expText: { color: colors.purple, fontSize: 12, fontWeight: "700" },
  section: { color: colors.textMuted, textTransform: "uppercase", fontSize: 12, marginTop: 8 },
  availLine: { color: colors.textMuted, fontSize: 13 },
  day: { color: colors.lime, fontWeight: "800" },
});
