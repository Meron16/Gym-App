import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { EmptyState } from "../components/EmptyState";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { SectionHeader } from "../components/SectionHeader";
import { track } from "../services/analytics";
import { api } from "../services/apiClient";
import type { Package } from "../types/app";
import { colors } from "../theme/tokens";

export function PlansScreen() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [activePackageId, setActivePackageId] = useState<string | undefined>();
  const [history, setHistory] = useState<
    { id: string; provider: string; amountCents: number; externalId?: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPackageId, setCheckoutPackageId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [mine, hist] = await Promise.all([
        api.getMyPackages().catch(() => api.getPackages()),
        api.getPaymentHistory().catch(() => []),
      ]);
      setPackages(mine.packages);
      setActivePackageId(mine.activePackageId);
      setHistory(hist);
      track("plans_view", { package_count: mine.packages.length });
    } catch {
      setError("Could not load plans. Sign in and check the API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openCheckout = async (packageId: string) => {
    try {
      setCheckoutPackageId(packageId);
      track("checkout_started", { package_id: packageId });
      const { checkoutUrl } = await api.createCheckoutSession(packageId);
      if (Platform.OS === "web") {
        await Linking.openURL(checkoutUrl);
      } else {
        await WebBrowser.openBrowserAsync(checkoutUrl, { enableBarCollapsing: true });
      }
      void load();
    } catch {
      Alert.alert("Checkout failed", "Could not start billing. For real Stripe, configure the API keys and Price IDs.");
    } finally {
      setCheckoutPackageId(null);
    }
  };

  return (
    <ScreenContainer scrollable>
      <Text style={styles.title}>Membership</Text>
      <Text style={styles.subtitle}>Subscribe to unlock booking with entitlements (when enabled on the API).</Text>

      {loading ? (
        <ActivityIndicator color={colors.lime} style={{ marginTop: 24 }} />
      ) : error ? (
        <GlassCard>
          <EmptyState title="Could not load" description={error} actionLabel="Retry" onAction={() => void load()} />
        </GlassCard>
      ) : (
        <>
          <SectionHeader title="Plans" />
          {packages.map((p) => {
            const active = p.id === activePackageId;
            const checkingOut = checkoutPackageId === p.id;
            return (
              <GlassCard key={p.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{p.name}</Text>
                  {active ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Current</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.planPrice}>{p.price}</Text>
                <Text style={styles.planBilling}>{p.billing}</Text>
                {p.highlights.map((h) => (
                  <Text key={h} style={styles.bullet}>
                    · {h}
                  </Text>
                ))}
                <Text style={styles.meta}>
                  Up to {p.bookingEntitlement.maxSessionsPerWeek} sessions / week (catalog entitlement)
                </Text>
                <GlowButton
                  label={
                    checkingOut ? "Opening checkout…" : active ? "Your current plan" : "Subscribe with Stripe"
                  }
                  variant="purple"
                  disabled={active || checkingOut}
                  onPress={() => void openCheckout(p.id)}
                />
              </GlassCard>
            );
          })}
          <SectionHeader title="Payment history" />
          {history.length === 0 ? (
            <GlassCard>
              <Text style={styles.emptyHist}>No payments yet. Completed Stripe checkouts appear here.</Text>
            </GlassCard>
          ) : (
            history.map((row) => (
              <GlassCard key={row.id} style={styles.histRow}>
                <Text style={styles.histAmount}>
                  ${(row.amountCents / 100).toFixed(2)} · {row.provider}
                </Text>
                <Text style={styles.histMeta}>{new Date(row.createdAt).toLocaleString()}</Text>
              </GlassCard>
            ))
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 32, fontWeight: "900", textTransform: "uppercase" },
  subtitle: { color: colors.textMuted, marginBottom: 8, lineHeight: 20 },
  planCard: { gap: 8 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planName: { color: colors.text, fontSize: 22, fontWeight: "800", flex: 1 },
  badge: {
    backgroundColor: colors.selectedCardBg,
    borderWidth: 1,
    borderColor: colors.lime,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: colors.lime, fontSize: 10, fontWeight: "800" },
  planPrice: { color: colors.lime, fontSize: 26, fontWeight: "900" },
  planBilling: { color: colors.textMuted, textTransform: "uppercase", fontSize: 11, fontWeight: "700" },
  bullet: { color: colors.textMuted, fontSize: 14 },
  meta: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  emptyHist: { color: colors.textMuted, fontWeight: "600" },
  histRow: { gap: 4 },
  histAmount: { color: colors.text, fontWeight: "800", fontSize: 16 },
  histMeta: { color: colors.textMuted, fontSize: 12 },
});
