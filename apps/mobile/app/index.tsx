import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { getAccessToken } from "../src/services/sessionStore";

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
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
