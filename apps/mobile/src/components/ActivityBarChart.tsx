import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";
import { motion } from "../theme/motion";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Relative heights 0–1 */
const VALUES = [0.45, 0.62, 0.88, 0.55, 0.72, 0.4, 0.5];

export function ActivityBarChart() {
  const anims = useRef(VALUES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      45,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: motion.cardDuration,
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [anims]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.legend}>
        <Text style={styles.dotLavender}>●</Text> Cardio{"   "}
        <Text style={styles.dotLime}>●</Text> Power
      </Text>
      <View style={styles.chart}>
        {VALUES.map((v, i) => {
          const height = anims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [4, 4 + v * 72],
          });
          return (
            <View key={DAYS[i]} style={styles.col}>
              <Animated.View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: i === 3 ? colors.lime : colors.purpleDeep,
                    opacity: i === 3 ? 1 : 0.75,
                  },
                ]}
              />
              <Text style={[styles.day, i === 3 && styles.dayActive]}>{DAYS[i]}</Text>
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
