import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { createEventStyles as styles } from '@/styles/screens';
import { router } from "expo-router";

interface TopBarProps {
  title: string;
  onBackPress?: () => void;
  showDeleteButton?: boolean;
  onDeletePress?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  title,
  onBackPress,
  showDeleteButton,
  onDeletePress,
}) => {
  return (
    <SafeAreaView style={styles.topBarSafeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress || (() => router.back())}
        >
          <FontAwesome name="arrow-left" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        {showDeleteButton ? (
          <TouchableOpacity style={styles.deleteButton} onPress={onDeletePress}>
            <FontAwesome name="trash" size={20} color="#E10600" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholderRight} />
        )}
      </View>
    </SafeAreaView>
  );
};

export default TopBar;
