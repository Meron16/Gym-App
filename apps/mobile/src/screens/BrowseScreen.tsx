import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { GymMap } from "../components/GymMap";
import { ScreenContainer } from "../components/ScreenContainer";
import { GymItem } from "../types/app";
import { colors } from "../theme/tokens";

import { api } from "../services/apiClient";

export function BrowseScreen() {
  const router = useRouter();
  const [gyms, setGyms] = useState<GymItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await api.getGyms({ q: "", location: "Addis Ababa, Ethiopia" });
        if (mounted) setGyms(data);
      } catch (e) {
        if (mounted) setError("Could not load gyms. Try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const empty = useMemo(() => !loading && !error && gyms.length === 0, [loading, error, gyms.length]);

  return (
    <ScreenContainer>
      <View style={styles.topRow}>
        <Text style={styles.heading}>Find your peak power</Text>
        <Pressable
          onPress={() => setShowMap((v) => !v)}
          style={[styles.mapToggle, showMap && styles.mapToggleActive]}
        >
          <Text style={[styles.mapToggleText, showMap && styles.mapToggleTextActive]}>
            {showMap ? "List + Pins" : "List"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.chips}>
        <Text style={styles.chipActive}>All Locations</Text>
        <Text style={styles.chip}>Crossfit</Text>
        <Text style={styles.chip}>Strength</Text>
      </View>

      {showMap ? (
        <View style={styles.mapWrap}>
          <GymMap gyms={gyms} selectedGymId={selectedGymId} onSelectGym={setSelectedGymId} />
        </View>
      ) : null}

      {loading ? (
        <GlassCard>
          <Text style={styles.loadingText}>Loading gyms…</Text>
        </GlassCard>
      ) : error ? (
        <GlassCard>
          <Text style={styles.errorText}>{error}</Text>
        </GlassCard>
      ) : empty ? (
        <GlassCard>
          <Text style={styles.mutedText}>No gyms found. Adjust your search.</Text>
        </GlassCard>
      ) : (
        gyms.map((gym) => (
          <GlassCard key={gym.id} style={styles.gymCard}>
            <View style={styles.row}>
              <Text style={styles.gymName}>{gym.name}</Text>
              <Text style={styles.price}>{gym.priceFrom}</Text>
            </View>
            <Text style={styles.meta}>{gym.location}</Text>
            <Text style={styles.tag}>{gym.tag}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: gym.capacityPercent }]} />
            </View>
            <GlowButton
              label="Book Session"
              onPress={() =>
                router.push(`/(app)/booking?gymId=${encodeURIComponent(gym.id)}`)
              }
            />
          </GlassCard>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  heading: { color: colors.text, fontSize: 34, fontWeight: "900", textTransform: "uppercase", flex: 1 },
  chips: { flexDirection: "row", gap: 8, marginBottom: 2 },
  chipActive: {
    backgroundColor: colors.purple,
    color: colors.activeChipText,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontWeight: "700",
  },
  chip: {
    backgroundColor: colors.cardSoft,
    color: colors.textMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gymCard: { gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gymName: { color: colors.text, fontSize: 25, fontWeight: "700" },
  price: { color: colors.lime, fontSize: 28, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 12 },
  tag: { color: colors.purple, fontSize: 11, textTransform: "uppercase", fontWeight: "700" },
  track: { backgroundColor: colors.track, borderRadius: 8, height: 6 },
  fill: { backgroundColor: colors.lime, borderRadius: 8, height: 6 },
  loadingText: { color: colors.textMuted, fontWeight: "700" },
  errorText: { color: colors.purple, fontWeight: "700" },
  mutedText: { color: colors.textMuted, fontWeight: "600" },
  mapWrap: {
    height: 190,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
  },
  mapToggle: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mapToggleActive: {
    borderColor: colors.lime,
  },
  mapToggleText: { color: colors.textMuted, fontWeight: "800", textTransform: "uppercase", fontSize: 10 },
  mapToggleTextActive: { color: colors.lime },
});
