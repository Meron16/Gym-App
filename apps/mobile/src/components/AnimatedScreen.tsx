import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { motion } from "../theme/motion";

interface AnimatedScreenProps {
  screenKey: string;
  children: React.ReactNode;
}

export function AnimatedScreen({ screenKey, children }: AnimatedScreenProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    fade.setValue(0);
    shift.setValue(12);
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: motion.pageDuration,
        useNativeDriver: true,
      }),
      Animated.timing(shift, {
        toValue: 0,
        duration: motion.pageDuration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, shift, screenKey]);

  return (
    <Animated.View style={[styles.base, { opacity: fade, transform: [{ translateY: shift }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
});
