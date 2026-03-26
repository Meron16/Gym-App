import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { GymItem } from "../types/app";
import { colors } from "../theme/tokens";

interface GymMapProps {
  gyms: GymItem[];
  selectedGymId: string | null;
  onSelectGym: (id: string) => void;
}

export function GymMap({ gyms, selectedGymId, onSelectGym }: GymMapProps) {
  const MapImpl = useMemo(() => {
    if (Platform.OS === "web") return null;
    try {
      // Native-only import. This prevents web from crashing on module evaluation.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const maps = require("react-native-maps");
      return maps;
    } catch {
      return null;
    }
  }, []);

  if (Platform.OS === "web") {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Map preview isn’t shown on web. Open on phone to view pins.</Text>
      </View>
    );
  }

  if (!MapImpl) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Map is unavailable on this device.</Text>
      </View>
    );
  }

  const MapView = MapImpl.default;
  const Marker = MapImpl.Marker;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: 8.9806,
        longitude: 38.7578,
        latitudeDelta: 0.18,
        longitudeDelta: 0.18,
      }}
    >
      {gyms.map((gym) => (
        <Marker
          key={gym.id}
          coordinate={{ latitude: gym.lat, longitude: gym.lng }}
          pinColor={gym.id === selectedGymId ? colors.lime : colors.purpleDeep}
          onPress={() => onSelectGym(gym.id)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  fallback: { flex: 1, padding: 16, justifyContent: "center" },
  fallbackText: { color: colors.textMuted, fontWeight: "700" },
});

