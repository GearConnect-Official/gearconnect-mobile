import { useLocalSearchParams } from 'expo-router';
import ProfileScreen from '@/screens/ProfileScreen';
import React from 'react';

export default function UserProfile() {
  const params = useLocalSearchParams<{ userId: string }>();
  const userId = params.userId ? Number(params.userId) : undefined;
  return <ProfileScreen userId={userId} />;
}
