import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TrainerBookScreen } from "../../../src/screens/TrainerBookScreen";
import { api } from "../../../src/services/apiClient";

export default function TrainerBookRoute() {
  const router = useRouter();
  const { trainerId } = useLocalSearchParams<{ trainerId: string }>();
  const id = trainerId ? String(trainerId) : "";
  const [name, setName] = useState<string | undefined>();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    void (async () => {
      try {
        const t = await api.getTrainer(id);
        if (mounted) setName(t.name);
      } catch {
        /* optional label */
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <TrainerBookScreen
      trainerId={id}
      trainerName={name}
      onDone={() => router.replace("/(app)/(tabs)/trainers")}
    />
  );
}
