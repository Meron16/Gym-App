import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/tokens";

interface HomeScreenProps {
  onStartWorkout: () => void;
  onMembership: () => void;
}

export function HomeScreen({ onStartWorkout, onMembership }: HomeScreenProps) {
  return (
    <ScreenContainer>
      <Text style={styles.brand}>KINETIC</Text>
      <Text style={styles.headline}>Ready to push limits?</Text>
      <GlassCard style={styles.heroCard}>
        <Text style={styles.heroTop}>WEEKLY GOAL</Text>
        <Text style={styles.heroTitle}>12 DAY STREAK</Text>
        <GlowButton label="Start Workout" onPress={onStartWorkout} style={styles.heroBtn} />
        <GlowButton label="Membership & billing" variant="purple" onPress={onMembership} />
      </GlassCard>
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>8,234</Text>
          <Text style={styles.statLabel}>Daily Steps</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statValue}>72</Text>
          <Text style={styles.statLabel}>Resting BPM</Text>
        </GlassCard>
      </View>
      <GlassCard>
        <Text style={styles.sectionTitle}>Today&apos;s Focus</Text>
        <Text style={styles.focusTitle}>Upper Body Kinetics</Text>
        <Text style={styles.focusCopy}>Explosive concentric movements with strict form cues.</Text>
      </GlassCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brand: { color: colors.purple, fontWeight: "800", fontSize: 22 },
  headline: { color: colors.text, fontSize: 42, fontWeight: "900", textTransform: "uppercase" },
  heroCard: { backgroundColor: colors.heroBg },
  heroTop: { color: colors.heroSmallText, fontSize: 12, fontWeight: "700", letterSpacing: 1.1 },
  heroTitle: {
    color: colors.heroTitleText,
    fontSize: 44,
    fontWeight: "900",
    marginTop: 4,
    marginBottom: 14,
  },
  heroBtn: { marginBottom: 2 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1 },
  statValue: { color: colors.text, fontSize: 34, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 12, textTransform: "uppercase" },
  sectionTitle: { color: colors.textMuted, textTransform: "uppercase", fontSize: 12 },
  focusTitle: { color: colors.text, fontSize: 28, fontWeight: "800", marginTop: 8 },
  focusCopy: { color: colors.textMuted, marginTop: 6, lineHeight: 19 },
});
