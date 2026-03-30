import React from "react";
import { useRouter } from "expo-router";
import { LoginScreen } from "../../src/screens/LoginScreen";

export default function Login() {
  const router = useRouter();
  return (
    <LoginScreen
      onLogin={() => router.replace("/(app)/(tabs)/home")}
      onGoSignup={() => router.push("/(auth)/signup")}
    />
  );
}

