import React, { useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { GymItem } from "../types/app";
import { colors } from "../theme/tokens";

interface GymMapProps {
  gyms: GymItem[];
  selectedGymId: string | null;
  userLocation?: { lat: number; lng: number } | null;
  onSelectGym: (id: string) => void;
}

export function GymMap({ gyms, selectedGymId, userLocation, onSelectGym }: GymMapProps) {
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
  const mapCenter =
    userLocation ?? (gyms[0] ? { lat: gyms[0].lat, lng: gyms[0].lng } : { lat: 8.9806, lng: 38.7578 });

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        latitudeDelta: 0.18,
        longitudeDelta: 0.18,
      }}
    >
      {userLocation ? (
        <Marker
          key="you"
          coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
          pinColor={colors.lime}
          title="You are here"
        />
      ) : null}
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

