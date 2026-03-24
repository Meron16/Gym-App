import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MainTab } from "../types/app";
import { colors } from "../theme/tokens";

interface BottomNavProps {
  active: MainTab;
  onChange: (next: MainTab) => void;
}

const items: MainTab[] = ["home", "browse", "booking", "activity"];

const labels: Record<MainTab, string> = {
  home: "HOME",
  browse: "BROWSE",
  booking: "BOOK",
  activity: "PULSE",
};

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <Pressable key={item} onPress={() => onChange(item)} hitSlop={8}>
          <Text style={[styles.item, active === item && styles.itemActive]}>{labels[item]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 64,
    backgroundColor: colors.bottomNav,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },
  item: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  itemActive: {
    color: colors.lime,
    textShadowColor: "#B8D73B44",
    textShadowRadius: 8,
  },
});
