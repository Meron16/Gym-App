import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GymDetailScreen } from "../../../src/screens/GymDetailScreen";

export default function GymDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const gymId = id ? String(id) : "";

  return (
    <GymDetailScreen
      gymId={gymId}
      onBack={() => router.back()}
      onBook={() => router.push(`/(app)/(tabs)/booking?gymId=${encodeURIComponent(gymId)}`)}
    />
  );
}
