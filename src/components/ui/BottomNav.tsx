import React from "react";
import { View, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import styles from '@/styles/components/bottomNavStyles';
import { useRouter, usePathname } from "expo-router";

// Adapter le composant pour ne pas dépendre de react-navigation
const BottomNav = (props: any) => {
  const router = useRouter();
  const pathname = usePathname();

  // Define tab routes with their paths and labels
  const tabs = [
    { name: "Home", path: "/(app)/(tabs)/home" },
    { name: "Publication", path: "/(app)/(tabs)/publication" },
    { name: "Events", path: "/(app)/(tabs)/events" },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.path);

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleNavigation(tab.path)}
          >
            <FontAwesome
              name={getIconName(tab.name) as any}
              size={tab.name === "Home" ? 32 : 30}
              color={isActive ? "#E10600" : "#6A707C"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Function to associate icons with pages
const getIconName = (routeName: string) => {
  switch (routeName) {
    case "Home":
      return "home"; // Icône de maison pour la page d'accueil
    case "Publication":
      return "plus-circle"; // Symbole plus pour créer une nouvelle publication
    case "Events":
      return "trophy"; // Trophée pour les événements de course
    default:
      return "circle";
  }
};

export default BottomNav;
