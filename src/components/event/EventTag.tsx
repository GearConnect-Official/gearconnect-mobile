import React from 'react';
import { View, Text } from 'react-native';

interface EventTagProps {
  text?: string;
  color?: string;
  style?: any;
}

const EventTag: React.FC<EventTagProps> = ({
  text,
  color,
  style,
}) => {
  if (!text || !color) {
    return null;
  }

  return (
    <View
      style={[
        {
          backgroundColor: color,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: 12,
          fontWeight: '600',
        }}
      >
        {text}
      </Text>
    </View>
  );
};

export default EventTag;
