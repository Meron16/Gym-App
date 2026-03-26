import React from "react";
import { useRouter } from "expo-router";
import { SignupScreen } from "../../src/screens/SignupScreen";

export default function Signup() {
  const router = useRouter();
  return (
    <SignupScreen
      onSignup={() => router.replace("/(auth)/onboarding")}
      onGoLogin={() => router.push("/(auth)/login")}
    />
  );
}

