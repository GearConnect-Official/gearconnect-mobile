import * as React from "react";
import { View, ScrollView, ActivityIndicator, Text, TouchableOpacity, Alert } from "react-native";
import TopBar from "@/components/event/TopBar";
import ModifyEvent from "@/components/ModifyEvent";
import { createEventStyles as styles } from "@/styles/screens";
import { editEventStyles as editStyles } from "@/styles/screens";
import { useRouter, useLocalSearchParams } from "expo-router";
import eventService, { Event } from "@/services/eventService";

// Custom hook to fetch and manage event data
const useEventData = (eventId: string) => {
  const [loading, setLoading] = React.useState(true);
  const [eventData, setEventData] = React.useState<Event | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("No event ID provided");
        setLoading(false);
        return;
      }
      
      try {
        const event = await eventService.getEventById(eventId);
        if (!event) {
          setError("Event not found");
        } else {
          // Process and normalize event data
          const processedEventData = {
            ...event,
            name: event.name || "",
            location: event.location || "",
            creators: (typeof event.creators === 'string' ? event.creators : 
                      typeof event.creatorId === 'object' ? event.creatorId.id : 
                      event.creatorId) || "",
            date: event.date ? new Date(event.date) : new Date(),
            sponsors: event.sponsors || "",
            website: event.website || "",
            rankings: event.rankings || "",
            logo: event.logo || "",
            images: event.images || [],
            description: event.description || "",
            logoPublicId: event.logoPublicId || "",
            imagePublicIds: event.imagePublicIds || [],
            meteo: event.meteo || {}
          };
          
          setEventData(processedEventData);
        }
      } catch (err: any) {
        console.error("Failed to fetch event:", err);
        setError(err?.message || "Failed to load event data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return { loading, eventData, error };
};

const EditEventScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  
  const { loading, eventData, error } = useEventData(eventId);
  const [deletingEvent, setDeletingEvent] = React.useState(false);

  const handleCancel = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.back();
  };

  const handleDeletePress = () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteEvent
        }
      ]
    );
  };

  const deleteEvent = async () => {
    try {
      setDeletingEvent(true);
      await eventService.deleteEvent(eventId);

      Alert.alert(
        "Success",
        "Event deleted successfully",
        [{ text: "OK", onPress: () => router.replace("/(app)/(tabs)/events") }]
      );
    } catch (error: any) {
      console.error("Failed to delete event:", error);
      
      Alert.alert(
        "Error",
        error?.message || "Failed to delete event. Please try again."
      );
    } finally {
      setDeletingEvent(false);
    }
  };

  // Render loading state
  if (loading || deletingEvent) {
    return (
      <View style={editStyles.centeredContainer}>
        <ActivityIndicator size="large" color="#3a86ff" />
        <Text style={editStyles.loadingText}>
          {deletingEvent ? "Deleting event..." : "Loading event data..."}
        </Text>
      </View>
    );
  }

  // Render error state
  if (error || !eventData) {
    return (
      <View style={editStyles.centeredContainer}>
        <Text style={editStyles.errorText}>{error || "Unable to load event data"}</Text>
        <TouchableOpacity 
          style={editStyles.button} 
          onPress={() => router.back()}
        >
          <Text style={editStyles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render main content
  return (
    <View style={styles.container}>
      <TopBar 
        title="Edit Event" 
        onBackPress={handleCancel} 
        showDeleteButton={true}
        onDeletePress={handleDeletePress}
      />
      <ScrollView style={styles.scrollView}>
        <ModifyEvent 
          onCancel={handleCancel} 
          onSuccess={handleSuccess}
          eventData={eventData}
          eventId={eventId}
        />
      </ScrollView>
    </View>
  );
};

export default EditEventScreen;