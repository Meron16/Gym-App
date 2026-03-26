import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../theme/tokens";
import { motion } from "../theme/motion";
import { api } from "../services/apiClient";
import type { BookingSlot } from "../types/app";

const STEPS = ["Date", "Time", "Review", "Done"] as const;

interface BookingScreenProps {
  gymId?: string;
  onDone?: () => void;
}

function toISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatSlotTime(iso: string) {
  const dt = new Date(iso);
  const hh = dt.getUTCHours();
  const mm = String(dt.getUTCMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${mm} ${ampm}`;
}

export function BookingScreen({ gymId, onDone }: BookingScreenProps) {
  const [step, setStep] = useState(0);
  const userId = "user_1"; // MVP placeholder until auth is wired
  const packageId = "weekly"; // MVP placeholder

  const [confirming, setConfirming] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const dateOptions = useMemo(() => {
    const today = new Date();
    // Next 5 days
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = toISODate(d);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      // Keep short label like "Wed 14" feel
      const compact = label.replace(/,?\s[A-Za-z]{3}\s/, " ");
      // If replace fails (different locales), fall back to weekday + day only
      const fallback = `${d.toLocaleDateString("en-US", { weekday: "short" })} ${d.getDate()}`;
      return { iso, label: compact || fallback };
    });
  }, []);

  const [dateIso, setDateIso] = useState(dateOptions[2]?.iso ?? dateOptions[0]?.iso);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    if (!gymId || !dateIso) return;
    let mounted = true;
    (async () => {
      try {
        setSlotsError(null);
        setLoadingSlots(true);
        const res = await api.getBookingAvailability({ gymId, date: dateIso });
        if (!mounted) return;
        setSlots(res.slots);
        // reset selection if current selection disappears
        setSelectedSlotId((prev) => {
          if (!prev) return res.slots.find((s) => s.isAvailable)?.slotId ?? null;
          return res.slots.some((s) => s.slotId === prev) ? prev : res.slots.find((s) => s.isAvailable)?.slotId ?? null;
        });
      } catch (e) {
        if (mounted) setSlotsError("Could not load availability.");
      } finally {
        if (mounted) setLoadingSlots(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [gymId, dateIso]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.slotId === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  );

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
      <Text style={styles.subtitle}>Minimal steps. Real slots. Instant confirmation.</Text>

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
              {dateOptions.map((d) => {
                const active = d.iso === dateIso;
                return (
                  <Pressable
                    key={d.iso}
                    onPress={() => setDateIso(d.iso)}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                  >
                    <Text style={[styles.dateText, active && styles.dateTextActive]}>{d.label}</Text>
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
            {!gymId ? (
              <Text style={styles.slotEmpty}>Missing gymId.</Text>
            ) : loadingSlots ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading slots…</Text>
              </View>
            ) : slotsError ? (
              <Text style={styles.slotEmpty}>{slotsError}</Text>
            ) : (
              <View style={styles.slotGrid}>
                {slots.map((s) => {
                  const active = s.slotId === selectedSlotId;
                  return (
                    <Pressable
                      key={s.slotId}
                      onPress={() => s.isAvailable && setSelectedSlotId(s.slotId)}
                      disabled={!s.isAvailable}
                      style={[styles.slot, active && styles.slotActive, !s.isAvailable && styles.slotDisabled]}
                    >
                      <Text style={[styles.slotText, active && styles.slotTextActive, !s.isAvailable && styles.slotTextDisabled]}>
                        {formatSlotTime(s.startTime)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <GlowButton
              label="Continue"
              onPress={next}
              disabled={!selectedSlotId || !selectedSlot?.isAvailable}
            />
          </GlassCard>
        )}

        {step === 2 && (
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking summary</Text>
            <Text style={styles.summaryBody}>
              {gymId ? gymId.replaceAll("-", " ") : "Gym"} •{" "}
              {dateOptions.find((d) => d.iso === dateIso)?.label ?? "—"} •{" "}
              {selectedSlot ? formatSlotTime(selectedSlot.startTime) : "—"}
            </Text>
            <Text style={styles.summaryMeta}>Elite pass • $45 • 1 session</Text>
            <GlowButton
              label={confirming ? "Confirming…" : "Confirm & pay"}
              onPress={async () => {
                if (!gymId || !selectedSlot) return;
                try {
                  setConfirmError(null);
                  setConfirming(true);
                  const created = await api.createBooking({
                    gymId,
                    slotId: selectedSlot.slotId,
                    userId,
                    packageId,
                  });
                  setBookingId(created.id);
                  transitionTo(3);
                } catch {
                  setConfirmError("Booking failed. Try a different slot.");
                } finally {
                  setConfirming(false);
                }
              }}
              disabled={!selectedSlot || confirming}
            />
            {confirmError ? <Text style={styles.slotEmpty}>{confirmError}</Text> : null}
          </GlassCard>
        )}

        {step === 3 && (
          <GlassCard style={styles.successCard}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>You&apos;re in</Text>
            <Text style={styles.successCopy}>
              {bookingId ? `Booking ${bookingId} locked.` : "Session locked."} We&apos;ll remind you 30 minutes before.
            </Text>
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
  slotDisabled: { opacity: 0.35 },
  slotTextDisabled: { color: colors.textMuted },
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
  slotEmpty: { color: colors.textMuted, fontWeight: "700", marginTop: 10 },
  loadingRow: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 8 },
  loadingText: { color: colors.textMuted, fontWeight: "700" },
});
