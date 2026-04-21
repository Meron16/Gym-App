import React, { useRef } from "react";
import {
  Animated,
  Platform,
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
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlowButton({
  label,
  onPress,
  variant = "lime",
  disabled,
  style,
}: GlowButtonProps) {
  const useNativeDriver = Platform.OS !== "web";
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: motion.pressInDuration,
      useNativeDriver,
    }).start();
  };

  const onPressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: motion.pressOutDuration,
      useNativeDriver,
    }).start();
  };

  const isLime = variant === "lime";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.base,
          isLime ? styles.lime : styles.purple,
          { transform: [{ scale }] },
          disabled && styles.disabled,
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
  disabled: {
    opacity: 0.45,
    ...(Platform.OS === "web" ? { boxShadow: "none" } : { shadowOpacity: 0 }),
  },
  lime: {
    backgroundColor: colors.lime,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 16px rgba(180,255,80,0.22)" }
      : {
          shadowColor: colors.lime,
          shadowOpacity: 0.22,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 2 },
        }),
  },
  purple: {
    backgroundColor: colors.purple,
    ...(Platform.OS === "web"
      ? { boxShadow: "0px 2px 14px rgba(102,67,166,0.22)" }
      : {
          shadowColor: colors.purpleDeep,
          shadowOpacity: 0.2,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 2 },
        }),
  },
  label: { fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  limeText: { color: colors.limeText },
  purpleText: { color: colors.purpleText },
});
