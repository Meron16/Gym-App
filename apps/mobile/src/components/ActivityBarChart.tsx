import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";
import { motion } from "../theme/motion";

const DEFAULT_VALUES = [0.45, 0.62, 0.88, 0.55, 0.72, 0.4, 0.5];
const DEFAULT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ActivityBarChartProps {
  /** Length 7, heights 0–1 */
  values?: number[];
  /** Length 7 day labels */
  labels?: string[];
}

export function ActivityBarChart({ values, labels }: ActivityBarChartProps) {
  const v = useMemo(() => {
    const raw = values?.length === 7 ? values : DEFAULT_VALUES;
    const max = Math.max(0.08, ...raw);
    return raw.map((x) => Math.min(1, x / max));
  }, [values]);

  const dayLabels = labels?.length === 7 ? labels : DEFAULT_LABELS;

  const anims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;
  const animVersion = useMemo(() => v.join(","), [v]);

  useEffect(() => {
    anims.forEach((a) => a.setValue(0));
    Animated.stagger(
      45,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: motion.cardDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [animVersion, anims]);

  const peak = v.indexOf(Math.max(...v));

  return (
    <View style={styles.wrap}>
      <Text style={styles.legend}>
        <Text style={styles.dotLavender}>●</Text> Logged sessions{"   "}
        <Text style={styles.dotLime}>●</Text> Peak day
      </Text>
      <View style={styles.chart}>
        {v.map((height, i) => {
          const animH = anims[i]!;
          const barHeight = animH.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 4 + height * 72],
          });
          const isPeak = i === peak;
          return (
            <View key={`${dayLabels[i]}-${i}`} style={styles.col}>
              <Animated.View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isPeak ? colors.lime : colors.purpleDeep,
                    opacity: isPeak ? 1 : 0.78,
                  },
                ]}
              />
              <Text style={[styles.day, isPeak && styles.dayActive]}>{dayLabels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  legend: { color: colors.textMuted, fontSize: 12 },
  dotLavender: { color: colors.purple },
  dotLime: { color: colors.lime },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 100,
    paddingTop: 8,
  },
  col: { flex: 1, alignItems: "center", gap: 6 },
  bar: {
    width: "68%",
    maxWidth: 22,
    borderRadius: 6,
    minHeight: 4,
  },
  day: { color: colors.textMuted, fontSize: 10, fontWeight: "600" },
  dayActive: { color: colors.lime, fontWeight: "800" },
});
