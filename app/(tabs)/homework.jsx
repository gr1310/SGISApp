import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Card } from "react-native-paper";
import { useUser } from "../../context/UserContext";
import { SERVER_URL } from "../../constants/constants";
import { SafeAreaView } from "react-native-safe-area-context";

const showAlert = (title, message) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const HomeworkSubmissionScreen = () => {
  const [student_name, setStudent_name] = useState("");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const { email } = useUser(); // Get user email from context

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Fetch homework submissions from API
  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/homework/${email}`, {
        headers: { Accept: "application/json" },
      });
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  // Handle file selection
  const pickFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.canceled) return;

    // Use the correct path based on your result structure
    const selectedFile = result.output[0] || result.assets?.[0];

    if (!selectedFile) {
      showAlert("Error", "No file selected.");
      return;
    }

    setFile({
      uri: selectedFile.uri || URL.createObjectURL(selectedFile), // Handle both web & mobile
      name: selectedFile.name,
      type: selectedFile.type || "application/octet-stream",
    });
    console.log(file);
  };

  // Submit homework to API
  const submitHomework = async () => {
    if (!student_name || !subject || !teacher || !file) {
      showAlert(
        "Error",
        "Please fill in all required fields and upload a file."
      );
      return;
    }

    try {
      const fileUri = file.uri;
      const response = await fetch(fileUri);
      const blob = await response.blob(); // Convert the file to Blob

      const formData = new FormData();
      formData.append("email", email);
      formData.append("student_name", student_name);
      formData.append("subject", subject);
      formData.append("teacher", teacher);
      formData.append("notes", notes);
      formData.append("file", blob, file.name);

      const apiResponse = await fetch(`${SERVER_URL}/submit-homework`, {
        method: "POST",
        body: formData,
      });

      if (apiResponse.ok) {
        showAlert("Success", "Homework submitted successfully!");
        setStudent_name("");
        setSubject("");
        setTeacher("");
        setNotes("");
        setFile(null);
        fetchSubmissions();
      } else {
        showAlert("Error", "Failed to submit homework.");
      }
    } catch (error) {
      console.error("Error submitting homework:", error);
      showAlert("Error", "Failed to submit homework. Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        Submit Your Homework
      </Text>

      <TextInput
        placeholder="Your Name *"
        value={student_name}
        onChangeText={setStudent_name}
        style={styles.input}
      />
      <TextInput
        placeholder="Subject *"
        value={subject}
        onChangeText={setSubject}
        style={styles.input}
      />
      <TextInput
        placeholder="Teacher's Name *"
        value={teacher}
        onChangeText={setTeacher}
        style={styles.input}
      />
      <TextInput
        placeholder="Additional Notes"
        value={notes}
        onChangeText={setNotes}
        style={styles.input}
        multiline
      />

      <TouchableOpacity onPress={pickFile} style={styles.uploadButton}>
        <Text>{file ? `📄 ${file.name}` : "📂 Choose File (Max 5MB)"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={submitHomework}>
        <Text style={styles.buttonText}>Submit Homework</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 20 }}>
        Your Recent Submissions
      </Text>

      {submissions.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 10 }}>
          📄 No homework submissions yet
        </Text>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title
                title={item.subject}
                subtitle={`Student: ${item.studentName}`}
              />
              <Card.Content>
                <Text>👨‍🏫 Teacher: {item.teacher}</Text>
                {item.notes ? <Text>📝 Notes: {item.notes}</Text> : null}
                <Text>
                  📎 File: {item.file_name} ({item.file_size})
                </Text>
                <Text style={{ fontSize: 12, color: "gray" }}>
                  📅 Submitted on: {item.date}
                </Text>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = {
  button: {
    marginTop: 10,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  uploadButton: {
    backgroundColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  card: { marginVertical: 8, padding: 10 },
};

export default HomeworkSubmissionScreen;
