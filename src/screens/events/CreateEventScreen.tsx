import * as React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateEventForm from "@/components/CreateEventForm";
import { createEventStyles as styles } from "@/styles/screens";
import { useRouter } from "expo-router";
import { trackScreenView } from "@/utils/mixpanelTracking";

const CreateEventScreen: React.FC = () => {
  const router = useRouter();

  // Track screen view
  React.useEffect(() => {
    trackScreenView('Create Event');
  }, []);

  const handleCancel = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.back(); // Naviguer après succès
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <CreateEventForm onCancel={handleCancel} onSuccess={handleSuccess} />
        <View />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateEventScreen;
