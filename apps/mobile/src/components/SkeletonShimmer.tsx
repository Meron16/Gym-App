import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../theme/tokens";

interface SkeletonBoxProps {
  height: number;
  width?: number | `${number}%`;
  style?: ViewStyle;
  radius?: number;
}

export function SkeletonBox({ height, width = "100%", style, radius = 12 }: SkeletonBoxProps) {
  const useNativeDriver = Platform.OS !== "web";
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        {
          height,
          width: width as number | `${number}%`,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function GymListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.stack}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox height={22} width="70%" radius={8} />
          <SkeletonBox height={14} width="45%" radius={8} />
          <SkeletonBox height={8} width="100%" radius={6} />
          <SkeletonBox height={44} width="100%" radius={999} />
        </View>
      ))}
    </View>
  );
}

export function SlotsGridSkeleton() {
  return (
    <View style={styles.slotWrap}>
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonBox key={i} height={40} width="30%" radius={999} style={styles.slotItem} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.border },
  stack: { gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  slotWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotItem: { minWidth: "28%" },
});
