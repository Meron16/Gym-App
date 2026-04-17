import React from "react";
import { useRouter } from "expo-router";
import { HomeScreen } from "../../../src/screens/HomeScreen";

export default function Home() {
  const router = useRouter();
  return (
    <HomeScreen
      onStartWorkout={() => router.push("/(app)/(tabs)/browse")}
      onMembership={() => router.push("/(app)/(tabs)/plans")}
      onTrainers={() => router.push("/(app)/(tabs)/trainers")}
    />
  );
}
