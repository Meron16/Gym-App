import React from "react";
import { Tabs } from "expo-router";
import { colors } from "../../src/theme/tokens";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bottomNav,
          borderTopColor: colors.border,
          height: 64,
        },
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.4,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "HOME" }} />
      <Tabs.Screen name="browse" options={{ title: "BROWSE" }} />
      <Tabs.Screen name="booking" options={{ title: "BOOK" }} />
      <Tabs.Screen name="activity" options={{ title: "PULSE" }} />
    </Tabs>
  );
}

