import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../src/context/AuthContext';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/welcome');
    }
  }, [isAuthenticated, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="eventDetail" />
      <Stack.Screen name="createJobOffer" />
      <Stack.Screen name="createEvent" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="userProfile" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="publication" />
      <Stack.Screen name="performances" />
      <Stack.Screen name="addPerformance" />
      <Stack.Screen name="eventMap" />
    </Stack>
  );
} 