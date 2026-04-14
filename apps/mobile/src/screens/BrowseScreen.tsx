import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { EmptyState } from "../components/EmptyState";
import { FilterChip } from "../components/FilterChip";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { GymMap } from "../components/GymMap";
import { GymListSkeleton } from "../components/SkeletonShimmer";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { GymItem } from "../types/app";
import { colors } from "../theme/tokens";
import { api } from "../services/apiClient";

type FacilityFilter = "all" | "crossfit" | "strength";

export function BrowseScreen() {
  const router = useRouter();
  const [gyms, setGyms] = useState<GymItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [facility, setFacility] = useState<FacilityFilter>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("Nearest venues by your current location");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (perm.status !== "granted") {
          setLocationLabel("Location not granted - showing all venues");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!mounted) return;
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel("Nearest venues around you");
      } catch {
        if (mounted) setLocationLabel("Could not read location - showing all venues");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const facilityParam =
        facility === "crossfit" ? "crossfit" : facility === "strength" ? "strength" : undefined;
      const data = await api.getGyms({
        q: "",
        facility: facilityParam,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radiusKm: userLocation ? 30 : undefined,
      });
      setGyms(data);
    } catch {
      setError("Could not load gyms. Check API + database connection.");
    } finally {
      setLoading(false);
    }
  }, [facility, userLocation]);

  useEffect(() => {
    void load();
  }, [load]);

  const empty = useMemo(() => !loading && !error && gyms.length === 0, [loading, error, gyms.length]);

  const openGym = (id: string) => {
    router.push(`/(app)/gym/${encodeURIComponent(id)}`);
  };

  return (
    <ScreenContainer>
      <SectionHeader
        title="Discover"
        subtitle={locationLabel}
        right={
          <Pressable
            onPress={() => setShowMap((v) => !v)}
            style={[styles.mapToggle, showMap && styles.mapToggleActive]}
          >
            <Text style={[styles.mapToggleText, showMap && styles.mapToggleTextActive]}>
              {showMap ? "Map" : "Map off"}
            </Text>
          </Pressable>
        }
      />
      <Text style={styles.heading}>Find your peak power</Text>

      <View style={styles.chips}>
        <FilterChip label="All" active={facility === "all"} onPress={() => setFacility("all")} />
        <FilterChip
          label="Crossfit"
          active={facility === "crossfit"}
          onPress={() => setFacility("crossfit")}
        />
        <FilterChip
          label="Strength"
          active={facility === "strength"}
          onPress={() => setFacility("strength")}
        />
      </View>

      {showMap ? (
        <View style={styles.mapWrap}>
          <GymMap
            gyms={gyms}
            selectedGymId={selectedGymId}
            userLocation={userLocation}
            onSelectGym={(id) => {
              setSelectedGymId(id);
              openGym(id);
            }}
          />
        </View>
      ) : null}

      <SectionHeader title="Nearby venues" />

      {loading ? (
        <GymListSkeleton count={4} />
      ) : error ? (
        <GlassCard>
          <EmptyState
            title="Something went wrong"
            description={error}
            actionLabel="Retry"
            onAction={() => void load()}
          />
        </GlassCard>
      ) : empty ? (
        <GlassCard>
          <EmptyState
            title="No matches"
            description="Try another filter."
            actionLabel="Reset filters"
            onAction={() => setFacility("all")}
          />
        </GlassCard>
      ) : (
        gyms.map((gym) => (
          <GlassCard key={gym.id} style={styles.gymCard}>
            <Pressable onPress={() => openGym(gym.id)}>
              <View style={styles.row}>
                <Text style={styles.gymName}>{gym.name}</Text>
                <Text style={styles.price}>{gym.priceFrom}</Text>
              </View>
              <Text style={styles.meta}>{gym.location}</Text>
              <Text style={styles.tag}>{gym.tag}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: gym.capacityPercent }]} />
              </View>
            </Pressable>
            <GlowButton label="View gym" onPress={() => openGym(gym.id)} />
          </GlassCard>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 28, fontWeight: "900", textTransform: "uppercase" },
  chips: { flexDirection: "row", gap: 8, marginBottom: 2, flexWrap: "wrap" },
  gymCard: { gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gymName: { color: colors.text, fontSize: 22, fontWeight: "700", flex: 1, paddingRight: 8 },
  price: { color: colors.lime, fontSize: 24, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: 12 },
  tag: { color: colors.purple, fontSize: 11, textTransform: "uppercase", fontWeight: "700" },
  track: { backgroundColor: colors.track, borderRadius: 8, height: 6 },
  fill: { backgroundColor: colors.lime, borderRadius: 8, height: 6 },
  mapWrap: {
    height: 190,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSoft,
  },
  mapToggle: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mapToggleActive: {
    borderColor: colors.lime,
  },
  mapToggleText: { color: colors.textMuted, fontWeight: "800", textTransform: "uppercase", fontSize: 10 },
  mapToggleTextActive: { color: colors.lime },
});
