import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { clearSession, getAccessToken } from "../src/services/sessionStore";

/**
 * Default: always land on intro (login/signup) and clear any stale JWT so runs feel fresh.
 * Set EXPO_PUBLIC_RESTORE_SESSION=true to skip intro when a token exists (stay logged in).
 */
export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const restoreSession = process.env.EXPO_PUBLIC_RESTORE_SESSION === "true";
      if (!restoreSession) {
        await clearSession();
        if (!mounted) return;
        setTarget("/(auth)/intro");
        return;
      }
      const token = await getAccessToken();
      if (!mounted) return;
      setTarget(token ? "/(app)/(tabs)/home" : "/(auth)/intro");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!target) return null;
  return <Redirect href={target as never} />;
}
