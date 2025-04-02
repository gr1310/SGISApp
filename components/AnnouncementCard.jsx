import React from "react";
import { View, Text } from "react-native";
import { Card, Title, Paragraph } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

const AnnouncementCard = ({ title, content, date }) => {
  return (
    <Card style={{ margin: 10, borderRadius: 10, elevation: 4 }}>
      <Card.Content>
        <Title style={{ fontWeight: "bold" }}>{title}</Title>
        <Paragraph>{content}</Paragraph>
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
        >
          <MaterialIcons name="calendar-today" size={16} color="#666" />
          <Text style={{ marginLeft: 5, color: "#666" }}>{date}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export default AnnouncementCard;
