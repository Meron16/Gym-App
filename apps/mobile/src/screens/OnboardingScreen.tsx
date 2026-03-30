import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GlowButton } from "../components/GlowButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/tokens";

interface OnboardingScreenProps {
  onNext: () => void;
  onSkip?: () => void;
}

const goals = [
  "Build Muscle",
  "Cardio Peak",
  "Flexibility",
  "Weight Loss",
];

export function OnboardingScreen({ onNext, onSkip }: OnboardingScreenProps) {
  const [selected, setSelected] = useState<string[]>(["Build Muscle"]);

  const toggleGoal = (goal: string) => {
    setSelected((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  };

  return (
    <ScreenContainer padForTabBar={false}>
      {onSkip ? (
        <Pressable onPress={onSkip} hitSlop={12} style={styles.skipRow}>
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
      ) : null}
      <Text style={styles.step}>STEP 1 OF 4</Text>
      <Text style={styles.title}>What drives your daily motion?</Text>
      <Text style={styles.subtitle}>Pick up to two goals to personalize your training.</Text>
      {goals.map((goal) => {
        const active = selected.includes(goal);
        return (
          <Pressable
            key={goal}
            style={[styles.goalCard, active && styles.goalCardActive]}
            onPress={() => toggleGoal(goal)}
          >
            <View>
              <Text style={styles.goalTitle}>{goal}</Text>
              <Text style={styles.goalCopy}>Tailored plans and progression for this goal.</Text>
            </View>
            <Text style={[styles.goalTick, active && styles.goalTickActive]}>{active ? "●" : "○"}</Text>
          </Pressable>
        );
      })}
      <GlowButton label="Next Step" onPress={onNext} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  skipRow: { alignSelf: "flex-end", marginBottom: 8 },
  skip: { color: colors.textMuted, fontWeight: "700", fontSize: 13, textDecorationLine: "underline" },
  step: { color: colors.purple, letterSpacing: 2, fontSize: 12, fontWeight: "700" },
  title: { color: colors.text, fontSize: 37, fontWeight: "800", lineHeight: 42 },
  subtitle: { color: colors.textMuted, fontSize: 15, marginBottom: 6 },
  goalCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
    minHeight: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalCardActive: {
    backgroundColor: colors.selectedCardBg,
    borderColor: colors.selectedCardBorder,
  },
  goalTitle: { color: colors.text, fontSize: 22, fontWeight: "700" },
  goalCopy: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  goalTick: { color: colors.textMuted, fontSize: 18 },
  goalTickActive: { color: colors.lime },
});
