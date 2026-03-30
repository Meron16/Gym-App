import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";
import { GlowButton } from "./GlowButton";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.cta}>
          <GlowButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, paddingVertical: 8 },
  title: { color: colors.text, fontSize: 18, fontWeight: "800" },
  desc: { color: colors.textMuted, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  cta: { marginTop: 4 },
});
