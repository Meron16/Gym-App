import React from "react";
import { Stack } from "expo-router";

export default function AppStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#090A11" },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="gym/[id]" />
      <Stack.Screen name="trainer/[id]" />
      <Stack.Screen name="trainer-book/[trainerId]" />
    </Stack>
  );
}
