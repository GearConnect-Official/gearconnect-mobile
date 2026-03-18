import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import styles from "@/styles/screens/common/loadingStyles";

const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E232C" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

export default LoadingScreen; 