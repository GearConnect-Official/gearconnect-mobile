import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

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
      <Stack.Screen name="event-detail" />
      <Stack.Screen name="create-job-offer" />
      <Stack.Screen name="create-event" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="user-profile" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="publication" />
      <Stack.Screen name="performances" />
      <Stack.Screen name="add-performance" />
      <Stack.Screen name="conversation" />
      <Stack.Screen name="create-event-review" />
      <Stack.Screen name="edit-event" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="event-groups" />
      <Stack.Screen name="follow-list" />
      <Stack.Screen name="group-channel" />
      <Stack.Screen name="group-detail" />
      <Stack.Screen name="groups" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="modify-event-review" />
      <Stack.Screen name="my-created-events" />
      <Stack.Screen name="new-conversation" />
      <Stack.Screen name="notification-settings" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="post-detail" />
      <Stack.Screen name="post-event-info" />
      <Stack.Screen name="privacy-settings" />
      <Stack.Screen name="product-list" />
      <Stack.Screen name="select-event" />
      <Stack.Screen name="select-organizers" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="terms-and-conditions" />
      <Stack.Screen name="user-search" />
      <Stack.Screen name="verification-dashboard" />
      <Stack.Screen name="verification-request" />
    </Stack>
  );
}
