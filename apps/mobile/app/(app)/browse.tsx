import React from "react";
import { useRouter } from "expo-router";
import { BrowseScreen } from "../../src/screens/BrowseScreen";

export default function Browse() {
  const router = useRouter();
  return <BrowseScreen />;
}

