import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = ((...args) => {
      try {
        return originalPushState(...args);
      } catch (error) {
        const url = args[2];
        if (typeof url === "string") {
          window.location.assign(url);
          return;
        }
        throw error;
      }
    }) as History["pushState"];

    window.history.replaceState = ((...args) => {
      try {
        return originalReplaceState(...args);
      } catch (error) {
        const url = args[2];
        if (typeof url === "string") {
          window.location.replace(url);
          return;
        }
        throw error;
      }
    }) as History["replaceState"];

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />
    </>
  );
}

