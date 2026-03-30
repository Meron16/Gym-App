import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../components/GlassCard";
import { PrimaryCtaSticky } from "../components/PrimaryCtaSticky";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { SkeletonBox } from "../components/SkeletonShimmer";
import { api } from "../services/apiClient";
import type { GymDetail } from "../types/app";
import { colors } from "../theme/tokens";

interface GymDetailScreenProps {
  gymId: string;
  onBack: () => void;
  onBook: () => void;
}

export function GymDetailScreen({ gymId, onBack, onBook }: GymDetailScreenProps) {
  const [detail, setDetail] = useState<GymDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gymId) {
      setLoading(false);
      setError("Missing gym.");
      setDetail(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const d = await api.getGym(gymId);
        if (mounted) setDetail(d);
      } catch {
        if (mounted) setError("Could not load this gym.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [gymId]);

  return (
    <ScreenContainer
      padForTabBar={false}
      scrollable={false}
      footer={<PrimaryCtaSticky label="Book session" onPress={onBook} disabled={!detail} />}
    >
      <Pressable onPress={onBack} hitSlop={12}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      {loading ? (
        <GlassCard style={styles.heroCard}>
          <SkeletonBox height={28} width="75%" radius={10} />
          <SkeletonBox height={14} width="50%" radius={8} />
          <SkeletonBox height={8} width="100%" radius={6} />
        </GlassCard>
      ) : error ? (
        <GlassCard>
          <Text style={styles.error}>{error}</Text>
        </GlassCard>
      ) : detail ? (
        <>
          <GlassCard style={styles.heroCard}>
            <Text style={styles.name}>{detail.name}</Text>
            <Text style={styles.meta}>{detail.address}</Text>
            <Text style={styles.tag}>{detail.tag}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: detail.capacityPercent }]} />
            </View>
            <Text style={styles.capacityLabel}>Live capacity · {detail.capacityPercent}</Text>
          </GlassCard>

          <SectionHeader title="Hours" />
          <GlassCard>
            {detail.operatingHours.map((h) => (
              <View key={h.day} style={styles.hourRow}>
                <Text style={styles.day}>{h.day}</Text>
                <Text style={styles.hours}>
                  {h.open} – {h.close}
                </Text>
              </View>
            ))}
          </GlassCard>

          <SectionHeader title="Amenities" />
          <GlassCard>
            <View style={styles.amenityWrap}>
              {detail.amenities.map((a) => (
                <View key={a} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.purple, fontWeight: "700", marginBottom: 4 },
  heroCard: { gap: 10 },
  name: { color: colors.text, fontSize: 28, fontWeight: "900", textTransform: "uppercase" },
  meta: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  tag: { color: colors.purple, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  track: { backgroundColor: colors.track, borderRadius: 8, height: 6, marginTop: 4 },
  fill: { backgroundColor: colors.lime, borderRadius: 8, height: 6 },
  capacityLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  day: { color: colors.text, fontWeight: "700" },
  hours: { color: colors.textMuted, fontWeight: "600" },
  amenityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    backgroundColor: colors.cardSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amenityText: { color: colors.lime, fontSize: 12, fontWeight: "700" },
  error: { color: colors.purple, fontWeight: "700" },
});
