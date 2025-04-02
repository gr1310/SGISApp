import { View, Text, Image, Dimensions } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import { icons } from "../../constants";
import Icon from "react-native-vector-icons/FontAwesome";
import { CommonActions, useNavigation } from "@react-navigation/native";
// TabIcon component to render individual tab icons
const TabIcon = ({ icon, color, name, focused }) => {
  const screenHeight = Dimensions.get("window").height;

  return (
    <View
      className="items-center justify-center flex-1 mt-4"
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        style={{
          width: screenHeight * 0.03, // Maintain aspect ratio or adjust width
          height: screenHeight * 0.03,
          tintColor: color, // Works only for monochrome images
        }}
      />
      <Text
        className={`${
          focused ? "font-psemibold" : "font-pregular"
        } text-[10px]`}
        style={{
          color: color,
          textAlign: "center",
          width: screenHeight * 0.1,
        }}
      >
        {name}
      </Text>
    </View>
  );
};

const TabsLayout = () => {
  const navigation = useNavigation();
  const screenHeight = Dimensions.get("window").height;

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#f5c6cb",
        tabBarInactiveTintColor: "#CDCDE0",
        tabBarStyle: {
          backgroundColor: "#495057",
          borderTopWidth: 1,
          height: screenHeight * 0.07,
        },
      }}
    >
      {/* Home Screen */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.home}
              color={color}
              name="Home"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: "Complaints",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.plus}
              color={color}
              name="Complaint"
              focused={focused}
            />
          ),
        }}
      />

      {/* Business Screen */}
      <Tabs.Screen
        name="homework"
        options={{
          title: "Homework",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.bookmark}
              color={color}
              focused={focused}
              name="Homework"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.profile}
              color={color}
              focused={focused}
              name="Profile"
            />
          ),
        }}
      />

      {/* Profile Screen */}
      {/* <Tabs.Screen
        name="profile"
        options={{
          title: "",
          headerTransparent: true,
          headerTintColor: "#fff", // Text color
          headerTitleStyle: { fontWeight: "bold", fontSize: 20 }, // Font styles
          headerTitleAlign: "center", // Align title center
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.profile}
              color={color}
              focused={focused}
              name="Profile"
            />
          ),
        }}
      /> */}
    </Tabs>
  );
};

export default TabsLayout;
