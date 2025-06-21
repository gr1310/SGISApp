import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Button, Card, Badge } from "react-native-paper";
import { SERVER_URL } from "../../constants/constants";
import { useUser } from "../../context/UserContext";
import { SafeAreaView } from "react-native-safe-area-context";

const ComplaintsScreen = () => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const { email } = useUser();
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const loading = complaintsLoading || tagsLoading;
  useEffect(() => {
    fetchComplaints();
    fetchTags();
  }, []);

  const fetchComplaints = async () => {
    try {
      setComplaintsLoading(true);
      const response = await fetch(`${SERVER_URL}/complaints`);
      const data = await response.json();
      console.log("Fetched Complaints:", data);
      setComplaints(data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      setTagsLoading(true);
      const response = await fetch(`${SERVER_URL}/tags`);
      const data = await response.json();
      const tags = Object.values(data).map((item) => item.tag);
      console.log("Fetched Tags:", tags);
      setTags(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setTagsLoading(false);
    }
  };

  const submitComplaint = async () => {
    setSubmitLoading(true);
    console.warn("Submitting complaint...");
    console.log(name);
    console.log(subject);
    console.log(description);
    if (!name || !subject || !description) {
      alert("All fields are required.");
      return;
    }

    const newComplaint = {
      student_name: name.trim(),
      subject: subject.trim(),
      description: description.trim(),
      email: email.trim(),
    };

    console.log("New Complaint:", newComplaint);

    try {
      const response = await fetch(`${SERVER_URL}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComplaint),
      });

      const data = await response.json();
      console.log("Complaint submitted:", data);
      setComplaints([data, ...complaints]);
      setName("");
      setSubject("");
      setDescription("");
    } catch (error) {
      console.error(error);
      alert("Failed to submit the complaint.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredComplaints = selectedTag
    ? complaints.filter((c) => c.tags && c.tags.includes(selectedTag))
    : complaints;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {submitLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      )}

      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.header}>Submit a Complaint</Text>

          <TextInput
            style={styles.input}
            placeholder="Your Name *"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Subject *"
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description *"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <Button
            mode="contained"
            icon="send"
            onPress={submitComplaint}
            style={styles.button}
          >
            Submit Complaint
          </Button>
        </View>

        <Button
          mode="outlined"
          icon="refresh"
          onPress={() => {
            fetchComplaints();
            fetchTags();
          }}
          style={{ borderRadius: 20 }}
          loading={loading}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>

        <Text style={styles.subHeader}>Top Tags</Text>
        <View style={styles.clusterContainer}>
          <Text
            style={[styles.token, selectedTag === null && styles.selectedToken]}
            onPress={() => setSelectedTag(null)}
          >
            All
          </Text>
          {tags &&
            tags.length > 0 &&
            tags[0] !== "" &&
            tags.map((tag, index) => (
              <Text
                key={index}
                style={[
                  styles.token,
                  selectedTag === tag && styles.selectedToken,
                ]}
                onPress={() => setSelectedTag(tag)}
              >
                {tag}
              </Text>
            ))}
        </View>

        <Text style={styles.subHeader}>Complaints</Text>
        {filteredComplaints.length === 0 ? (
          <Text style={styles.noComplaints}>No complaints found.</Text>
        ) : (
          filteredComplaints.map((complaint, index) => (
            <Card key={index} style={styles.card}>
              <Card.Title
                title={complaint.subject}
                subtitle={`By: ${complaint.student_name}`}
              />
              <Card.Content>
                <Text style={styles.description}>{complaint.description}</Text>
                {complaint.tags && (
                  <View style={styles.keywordContainer}>
                    {complaint.tags.map((keyword, idx) => (
                      <Badge key={idx} style={styles.keywordBadge}>
                        {keyword}
                      </Badge>
                    ))}
                  </View>
                )}
                <Text style={styles.date}>
                  Submitted on: {new Date(complaint.date).toLocaleString()}
                </Text>
              </Card.Content>
              <Card.Actions>
                <Badge style={styles.badge}>{complaint.status}</Badge>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#007bff",
    borderRadius: 10,
  },
  noComplaints: {
    textAlign: "center",
    color: "gray",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  description: {
    fontSize: 14,
    color: "#333",
  },
  date: {
    color: "gray",
    fontSize: 12,
    marginTop: 5,
  },
  badge: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginBottom: 10,
  },
  clusterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  token: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
    fontSize: 14,
    color: "#333",
  },
  selectedToken: {
    backgroundColor: "#007bff",
    color: "white",
  },
  keywordContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
    margin: 10,
  },
  keywordBadge: {
    backgroundColor: "#28a745",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // semi-transparent background
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});

export default ComplaintsScreen;
