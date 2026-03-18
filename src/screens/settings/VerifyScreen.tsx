import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/auth/verifyStyles';

const VerifyScreen: React.FC = () => {
  const authContext = useAuth();
  const user = authContext?.user;
  const router = useRouter();
  
  useEffect(() => {
    // Redirection automatique vers les tabs après 2 secondes
    const timer = setTimeout(() => {
      router.replace('/(app)/(tabs)');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue {user?.username} !</Text>
      <Text style={styles.subtitle}>
        Vous êtes maintenant connecté à GearConnect
      </Text>
      <ActivityIndicator size="large" color="#1E232C" style={styles.loader} />
    </View>
  );
};

export default VerifyScreen; 