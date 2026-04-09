import React from 'react';
import { View, Image } from 'react-native';
import CustomTextInput from '../ui/CustomTextInput';
import styles from '../../styles/components/captionInputStyles';

interface CaptionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  userAvatar?: string;
}

const CaptionInput: React.FC<CaptionInputProps> = ({
  value,
  onChangeText,
  userAvatar = 'https://via.placeholder.com/32',
}) => {
  return (
    <View style={styles.captionContainer}>
      <Image
        source={{ uri: userAvatar }}
        style={styles.userAvatar}
      />
      <CustomTextInput
        style={styles.captionInput}
        placeholder="Enter your caption"
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={2200}
      />
    </View>
  );
};

export default CaptionInput; 