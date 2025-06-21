import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function HomeScreen() {
  useEffect(() => {
    GoogleSignin.configure({
      iosClientId:
        "414385651586-1hpnh7mqunlki9gmeevunuobrg3r9tfo.apps.googleusercontent.com",
      webClientId:
        "414385651586-9m4gbrids3tin2ohci0r6rqc361eges4.apps.googleusercontent.com",
      profileImageSize: 120,
    });
  });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SGIS App</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("(auth)/google-signin")}
      >
        <Text style={styles.buttonText}>Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
