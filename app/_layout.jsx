import { Stack } from "expo-router";
import React, { useState, useEffect } from "react";
import { useFonts } from "expo-font";
import SplashScreen from "../components/SplashScreen"; // Import your custom splash screen
import { UserProvider } from "../context/UserContext";

const RootLayout = () => {
  const [fontLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    if (error) throw error;

    if (fontLoaded) {
      const timer = setTimeout(() => {
        setSplashVisible(false);
      }, 900);

      return () => clearTimeout(timer);
    }
  }, [fontLoaded, error]);

  if (splashVisible) {
    return <SplashScreen />;
  }

  return (
    <UserProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </UserProvider>
  );
};
export default RootLayout;
