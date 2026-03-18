import * as React from "react";
import { TouchableOpacity, View, SafeAreaView, Platform } from "react-native";
import { createEventStyles as styles } from '@/styles/screens';
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  const progress = (currentStep - 1) / (totalSteps - 1 || 1);
  const fillPercent = Math.round(progress * 100);

  return (
    <SafeAreaView style={{ backgroundColor: "transparent" }}>
      <View
        style={[
          styles.stepsContainer,
          Platform.OS === "ios" ? { paddingTop: 8 } : {},
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <FontAwesome name="arrow-left" size={22} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.stepIndicatorRow}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${fillPercent}%` }]} />
          </View>
        </View>

        <View style={styles.placeholderRight} />
      </View>
    </SafeAreaView>
  );
};

export default StepIndicator;