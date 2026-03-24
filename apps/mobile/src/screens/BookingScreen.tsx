import React, { useCallback, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/tokens";
import { motion } from "../theme/motion";

const DATES = ["Wed 14", "Thu 15", "Fri 16", "Sat 17", "Sun 18"];
const SLOTS = ["6:30 AM", "7:30 AM", "9:00 AM", "5:30 PM", "7:00 PM"];

const STEPS = ["Date", "Time", "Review", "Done"] as const;

interface BookingScreenProps {
  onDone?: () => void;
}

export function BookingScreen({ onDone }: BookingScreenProps) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(DATES[2]);
  const [slot, setSlot] = useState(SLOTS[1]);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const transitionTo = useCallback(
    (nextStep: number) => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: motion.pageDuration * 0.55,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: motion.pageDuration * 0.55,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(nextStep);
        translateY.setValue(14);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: motion.pageDuration,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: motion.pageDuration,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [opacity, translateY],
  );

  const next = () => {
    if (step < STEPS.length - 1) transitionTo(step + 1);
  };

  const back = () => {
    if (step > 0 && step < 3) transitionTo(step - 1);
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Book your session</Text>
      <Text style={styles.subtitle}>Three calm steps. One confident finish.</Text>

      <View style={styles.stepRow}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]} />
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      {step > 0 && step < 3 ? (
        <Pressable onPress={back} hitSlop={12}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}

      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        {step === 0 && (
          <GlassCard>
            <Text style={styles.section}>Pick a day</Text>
            <View style={styles.dateRow}>
              {DATES.map((d) => {
                const active = d === date;
                return (
                  <Pressable key={d} onPress={() => setDate(d)} style={[styles.dateChip, active && styles.dateChipActive]}>
                    <Text style={[styles.dateText, active && styles.dateTextActive]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>
            <GlowButton label="Continue" onPress={next} />
          </GlassCard>
        )}

        {step === 1 && (
          <GlassCard>
            <Text style={styles.section}>Choose a time slot</Text>
            <View style={styles.slotGrid}>
              {SLOTS.map((s) => {
                const active = s === slot;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSlot(s)}
                    style={[styles.slot, active && styles.slotActive]}
                  >
                    <Text style={[styles.slotText, active && styles.slotTextActive]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
            <GlowButton label="Continue" onPress={next} />
          </GlassCard>
        )}

        {step === 2 && (
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking summary</Text>
            <Text style={styles.summaryBody}>
              Iron Sanctuary • {date} • {slot}
            </Text>
            <Text style={styles.summaryMeta}>Elite pass • $45 • 1 session</Text>
            <GlowButton label="Confirm & pay" onPress={next} />
          </GlassCard>
        )}

        {step === 3 && (
          <GlassCard style={styles.successCard}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>You&apos;re in</Text>
            <Text style={styles.successCopy}>Session locked. We&apos;ll remind you 30 minutes before.</Text>
            <GlowButton
              label="Back to browse"
              onPress={() => {
                onDone?.();
              }}
            />
          </GlassCard>
        )}
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 34, fontWeight: "900", textTransform: "uppercase" },
  subtitle: { color: colors.textMuted, marginBottom: 4 },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  stepItem: { alignItems: "center", gap: 6, flex: 1 },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.track,
  },
  stepDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.lime,
    shadowColor: colors.lime,
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  stepDotDone: { backgroundColor: colors.purple },
  stepLabel: { color: colors.textMuted, fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  stepLabelActive: { color: colors.lime },
  back: { color: colors.purple, fontWeight: "700", marginBottom: 4 },
  backSpacer: { height: 22 },
  section: { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 12 },
  dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  dateChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.cardSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: {
    backgroundColor: colors.selectedCardBg,
    borderColor: colors.selectedCardBorder,
  },
  dateText: { color: colors.textMuted, fontWeight: "600" },
  dateTextActive: { color: colors.lime },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  slot: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  slotActive: {
    backgroundColor: colors.selectedCardBg,
    borderColor: colors.selectedCardBorder,
  },
  slotText: { color: colors.textMuted, fontWeight: "600" },
  slotTextActive: { color: colors.lime },
  summaryCard: { gap: 10 },
  summaryTitle: { color: colors.textMuted, textTransform: "uppercase", fontSize: 12 },
  summaryBody: { color: colors.text, fontSize: 22, fontWeight: "800" },
  summaryMeta: { color: colors.textMuted, marginBottom: 6 },
  successCard: { alignItems: "center", gap: 12, paddingVertical: 28 },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.selectedCardBg,
    borderWidth: 2,
    borderColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.lime,
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  checkMark: { color: colors.lime, fontSize: 36, fontWeight: "800" },
  successTitle: { color: colors.text, fontSize: 28, fontWeight: "900", textTransform: "uppercase" },
  successCopy: { color: colors.textMuted, textAlign: "center", paddingHorizontal: 12, lineHeight: 20 },
});
