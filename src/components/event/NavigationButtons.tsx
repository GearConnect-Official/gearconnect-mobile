import * as React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { createEventStyles as styles } from '@/styles/screens';

interface NavigationButtonsProps {
  currentStep: number;
  isLastStep: boolean;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isEditing?: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  isLastStep,
  loading,
  onPrev,
  onNext,
  onSubmit,
  isEditing = false,
}) => {
  return (
    <View style={styles.buttonsContainer}>
      {currentStep > 1 ? (
        <TouchableOpacity style={styles.backSmall} onPress={onPrev}>
          <FontAwesome name="arrow-left" size={14} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.navSpacer} />
      )}

      {isLastStep ? (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {isEditing ? "Save Changes" : "Publish Event"}
              </Text>
              <FontAwesome name="check" size={16} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
          <FontAwesome name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NavigationButtons;