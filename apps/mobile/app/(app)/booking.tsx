import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookingScreen } from "../../src/screens/BookingScreen";

export default function Booking() {
  const router = useRouter();
  const params = useLocalSearchParams<{ gymId?: string }>();
  return (
    <BookingScreen
      gymId={params.gymId ? String(params.gymId) : undefined}
      onDone={() => router.replace("/(app)/browse")}
    />
  );
}

