import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/tokens";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]} disabled={!onPress}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.cardSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  text: { color: colors.textMuted, fontWeight: "700", fontSize: 12 },
  textActive: { color: colors.activeChipText },
});
