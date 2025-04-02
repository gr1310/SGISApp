import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";
import { router } from "expo-router";

export default function ProfileScreen({ route }) {
  const navigation = useNavigation();
  const { email } = useUser() || "user@example.com"; // Default email

  return (
    <View style={styles.container}>
      {/* Profile Avatar */}
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle" size={100} color="#007bff" />
      </View>

      {/* Email Display */}
      <Text style={styles.email}>{email}</Text>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          console.log("Logout pressed");
          router.replace("/");
        }}
      >
        <Text style={styles.logoutText}>Log Out</Text>
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
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "#007bff",
    borderRadius: 20,
    padding: 8,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  email: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
