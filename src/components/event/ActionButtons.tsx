import * as React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { createEventStyles as styles } from '@/styles/screens';

interface ActionButtonsProps {
  onCancel: () => void;
  onSubmit: () => void;
  cancelText?: string;
  submitText?: string;
  disabled?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSubmit,
  cancelText = "Cancel",
  submitText = "Create",
  disabled = false,
}) => {
  return (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        onPress={onCancel}
        style={[styles.actionButton, styles.cancelButton]}
        disabled={disabled}
      >
        <Text style={styles.cancelButtonText}>{cancelText}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSubmit}
        style={[
          styles.actionButton,
          styles.submitButton,
          disabled && styles.disabledButton,
        ]}
        disabled={disabled}
      >
        <Text style={[styles.submitButtonText, disabled && styles.disabledButtonText]}>
          {submitText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionButtons;