import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme/tokens";
import { motion } from "../theme/motion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 160;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

interface ProgressRingProps {
  /** 0–1 */
  progress: number;
  label: string;
  sublabel?: string;
}

export function ProgressRing({ progress, label, sublabel }: ProgressRingProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(1, Math.max(0, progress)),
      duration: motion.cardDuration + 200,
      useNativeDriver: false,
    }).start();
  }, [anim, progress]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [C, 0],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.ringRotate}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={colors.track}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={colors.lime}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${C} ${C}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  ringRotate: {
    position: "absolute",
    transform: [{ rotate: "-90deg" }],
  },
  center: { alignItems: "center", gap: 2 },
  label: { color: colors.text, fontSize: 28, fontWeight: "800" },
  sublabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
