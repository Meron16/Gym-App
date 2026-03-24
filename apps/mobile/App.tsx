import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { BottomNav } from "./src/components/BottomNav";
import { AnimatedScreen } from "./src/components/AnimatedScreen";
import { ActivityScreen } from "./src/screens/ActivityScreen";
import { BookingScreen } from "./src/screens/BookingScreen";
import { BrowseScreen } from "./src/screens/BrowseScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { SignupScreen } from "./src/screens/SignupScreen";
import { MainTab } from "./src/types/app";

const gyms = [
  {
    id: "iron-sanctuary",
    name: "Iron Sanctuary",
    location: "Bole, Addis Ababa",
    price: "$45",
    capacity: "82%" as const,
    tag: "Elite Status",
  },
  {
    id: "pulse-studio",
    name: "Pulse Studio",
    location: "Mexico Square, Addis",
    price: "$30",
    capacity: "35%" as const,
    tag: "Power Zone",
  },
];

type AuthMode = "login" | "signup";

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode | null>("login");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [tab, setTab] = useState<MainTab>("home");

  const enterApp = (fromSignup: boolean) => {
    setAuthMode(null);
    setNeedsOnboarding(fromSignup);
    setTab("home");
  };

  const finishOnboarding = () => {
    setNeedsOnboarding(false);
    setTab("home");
  };

  if (authMode === "login") {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen onLogin={() => enterApp(false)} onGoSignup={() => setAuthMode("signup")} />
      </>
    );
  }

  if (authMode === "signup") {
    return (
      <>
        <StatusBar style="light" />
        <SignupScreen onSignup={() => enterApp(true)} onGoLogin={() => setAuthMode("login")} />
      </>
    );
  }

  if (needsOnboarding) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onNext={finishOnboarding} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AnimatedScreen screenKey={tab}>
        {tab === "home" && <HomeScreen onStartWorkout={() => setTab("browse")} />}
        {tab === "browse" && <BrowseScreen gyms={gyms} onBook={() => setTab("booking")} />}
        {tab === "booking" && <BookingScreen onDone={() => setTab("browse")} />}
        {tab === "activity" && <ActivityScreen />}
      </AnimatedScreen>
      <BottomNav active={tab} onChange={setTab} />
    </>
  );
}
