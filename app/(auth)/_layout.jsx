import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const AuthLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="login"
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
        <StatusBar backgroundColor="#161622" style="light" />
      </Stack>
    </>
  );
};

export default AuthLayout;
