import * as React from "react";
import { View, Text } from "react-native";
import CustomTextInput from '../ui/CustomTextInput';
import { createEventStyles as styles } from "../../styles/screens";

interface InputFieldProps {
  title: string;
  placeholder: string;
  info: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  title,
  placeholder,
  info,
  value,
  onChangeText,
  secureTextEntry = false,
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputTitle}>{title}</Text>
      <CustomTextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
      <Text style={styles.inputInfo}>{info}</Text>
    </View>
  );
};

export default InputField;