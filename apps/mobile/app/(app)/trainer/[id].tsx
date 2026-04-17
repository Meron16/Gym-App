import React from "react";
import { useLocalSearchParams } from "expo-router";
import { TrainerDetailScreen } from "../../../src/screens/TrainerDetailScreen";

export default function TrainerDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trainerId = id ? String(id) : "";
  return <TrainerDetailScreen trainerId={trainerId} />;
}
