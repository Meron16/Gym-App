import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/tokens";
import { GlowButton } from "./GlowButton";

interface PrimaryCtaStickyProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryCtaSticky({ label, onPress, disabled }: PrimaryCtaStickyProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <GlowButton label={label} onPress={onPress} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.bottomNav,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
