import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const AuthLayout = () => {
  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen
          name="google-signin"
          options={{
            headerTintColor: "#000",
            hheaderBackTitleVisible: false,
            headerTitle: "",
          }}
        />

        <Stack.Screen
          name="sign-up"
          options={{
            headerTintColor: "#000",
            hheaderBackTitleVisible: false,
            headerTitle: "",
          }}
        />
      </Stack>
    </>
  );
};

export default AuthLayout;
