import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import AnnouncementCard from "../../components/AnnouncementCard";

// Sample function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const saveAnnouncements = async () => {
  const sampleAnnouncements = [
    {
      id: 1,
      title: "Holiday Notice",
      content: "School will be closed on Monday.",
      date: "2025-03-30",
    },
    {
      id: 2,
      title: "Exam Schedule",
      content: "Mid-term exams start next week.",
      date: "2025-04-05",
    },
  ];

  try {
    await AsyncStorage.setItem(
      "announcements",
      JSON.stringify(sampleAnnouncements)
    );
    console.log("Announcements saved successfully!");
  } catch (error) {
    console.error("Error saving announcements:", error);
  }
};

// Call this function once to store the data
saveAnnouncements();

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Load announcements from AsyncStorage (or API if needed)
  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const storedData = await AsyncStorage.getItem("announcements");
      const parsedData = storedData ? JSON.parse(storedData) : [];
      setAnnouncements(parsedData);
    } catch (error) {
      console.error("Error loading announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnnouncements().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="black" />
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>School Announcements</Text>
        <TouchableOpacity
          onPress={loadAnnouncements}
          style={styles.refreshButton}
        >
          <Icon name="refresh-cw" size={24} color="#17a2b8" />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#17a2b8" style={styles.loader} />
      ) : announcements.length === 0 ? (
        // Empty State
        <View style={styles.emptyState}>
          <Icon name="bell" size={40} color="#888" />
          <Text style={styles.emptyText}>No announcements available</Text>
        </View>
      ) : (
        // Announcements List
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <AnnouncementCard
              title={item.title}
              content={item.content}
              date={item.date}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", paddingTop: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    elevation: 3,
  },
  backButton: { padding: 5 },
  refreshButton: { padding: 5 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#666", marginTop: 10 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  cardText: { fontSize: 14, color: "#333", marginBottom: 10 },
  dateContainer: { flexDirection: "row", alignItems: "center" },
  dateText: { fontSize: 13, color: "#555", marginLeft: 5 },
});

export default Home;
