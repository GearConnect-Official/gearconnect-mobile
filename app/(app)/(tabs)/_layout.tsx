import { Tabs } from 'expo-router';
import BottomNav from '@/components/ui/BottomNav';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props: any) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="publication" />
      <Tabs.Screen name="events" />
    </Tabs>
  );
}
