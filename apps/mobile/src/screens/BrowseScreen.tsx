import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { GymItem } from "../types/app";
import { colors } from "../theme/tokens";

interface BrowseScreenProps {
  gyms: GymItem[];
  onBook: () => void;
}

export function BrowseScreen({ gyms, onBook }: BrowseScreenProps) {
  return (
    <ScreenContainer>
      <Text style={styles.heading}>Find your peak power</Text>
      <View style={styles.chips}>
        <Text style={styles.chipActive}>All Locations</Text>
        <Text style={styles.chip}>Crossfit</Text>
        <Text style={styles.chip}>Strength</Text>
      </View>
      {gyms.map((gym) => (
        <GlassCard key={gym.id} style={styles.gymCard}>
          <View style={styles.row}>
            <Text style={styles.gymName}>{gym.name}</Text>
            <Text style={styles.price}>{gym.price}</Text>
          </View>
          <Text style={styles.meta}>{gym.location}</Text>
          <Text style={styles.tag}>{gym.tag}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: gym.capacity }]} />
          </View>
          <GlowButton label="Book Session" onPress={onBook} />
        </GlassCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 46, fontWeight: "900", textTransform: "uppercase" },
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
});
