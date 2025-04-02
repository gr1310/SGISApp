import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet } from "react-native";
import { Button, Card, Badge } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../../context/UserContext";
import { SERVER_URL } from "../../constants/constants";

const ComplaintsScreen = () => {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState([]);
  const { email } = useUser();

  useEffect(() => {
    fetch(`${SERVER_URL}/complaints/${email}`)
      .then((res) => res.json())
      .then((data) => setComplaints(data))
      .catch((err) => console.error(err));
  }, [email]);

  const loadComplaints = async () => {
    try {
      const storedComplaints = await AsyncStorage.getItem("complaints");
      if (storedComplaints) {
        setComplaints(JSON.parse(storedComplaints));
      }
    } catch (error) {
      console.error("Error loading complaints:", error);
    }
  };

  // const submitComplaint = async () => {
  //   if (!name || !subject || !description) {
  //     alert("All fields are required.");
  //     return;
  //   }

  //   const newComplaint = {
  //     studentName: name.trim(),
  //     subject: subject.trim(),
  //     description: description.trim(),
  //     status: "Submitted",
  //     date: new Date().toISOString(),
  //   };

  //   try {
  //     const updatedComplaints = [newComplaint, ...complaints]; // Add new complaint at the top
  //     await AsyncStorage.setItem(
  //       "complaints",
  //       JSON.stringify(updatedComplaints)
  //     );
  //     setComplaints(updatedComplaints);
  //     setName("");
  //     setSubject("");
  //     setDescription("");
  //   } catch (error) {
  //     alert("Failed to submit the complaint.");
  //   }
  // };

  const submitComplaint = async () => {
    if (!name || !email || !subject || !description) {
      alert("All fields are required.");
      return;
    }

    const newComplaint = {
      student_name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      description: description.trim(),
    };

    try {
      const response = await fetch(`${SERVER_URL}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newComplaint),
      });

      const data = await response.json();
      setComplaints([data, ...complaints]);
      setName("");
      setSubject("");
      setDescription("");
    } catch (error) {
      console.log(error);
      alert("Failed to submit the complaint.");
    }
  };

  return (
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

      <Text style={styles.subHeader}>Your Recent Complaints</Text>

      {complaints.length === 0 ? (
        <Text style={styles.noComplaints}>No complaints submitted yet.</Text>
      ) : (
        complaints.map((complaint, index) => (
          <Card key={index} style={styles.card}>
            <Card.Title
              title={complaint.subject}
              subtitle={`By: ${complaint.student_name}`}
            />
            <Card.Content>
              <Text style={styles.description}>{complaint.description}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
    paddingTop: 10,
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
  },
});

export default ComplaintsScreen;
