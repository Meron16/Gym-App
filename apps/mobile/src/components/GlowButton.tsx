import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { colors, radius } from "../theme/tokens";
import { motion } from "../theme/motion";

interface GlowButtonProps {
  label: string;
  onPress: () => void;
  variant?: "lime" | "purple";
  style?: StyleProp<ViewStyle>;
}

export function GlowButton({
  label,
  onPress,
  variant = "lime",
  style,
}: GlowButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: motion.pressInDuration,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: motion.pressOutDuration,
      useNativeDriver: true,
    }).start();
  };

  const isLime = variant === "lime";

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.base,
          isLime ? styles.lime : styles.purple,
          { transform: [{ scale }] },
          style,
        ]}
      >
        <Text style={[styles.label, isLime ? styles.limeText : styles.purpleText]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  lime: {
    backgroundColor: colors.lime,
    shadowColor: colors.lime,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 2 },
  },
  purple: {
    backgroundColor: colors.purple,
    shadowColor: colors.purpleDeep,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 2 },
  },
  label: { fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  limeText: { color: colors.limeText },
  purpleText: { color: colors.purpleText },
});
