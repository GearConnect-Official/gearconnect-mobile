import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import eventService, { Event } from '@/services/eventService';
import EventItem from '@/components/items/EventItem';
import { checkMissingEventInfo, countEventsWithMissingInfo } from '@/utils/eventMissingInfo';
import { API_URL_USERS } from '@/config';
import myCreatedEventsStyles from '@/styles/screens/events/myCreatedEventsStyles';
import theme from '@/styles/config/theme';

const styles = myCreatedEventsStyles;

const MyCreatedEventsScreen: React.FC = () => {
  const router = useRouter();
  const auth = useAuth();
  const currentUserId = auth?.user?.id ? Number(auth.user.id) : undefined;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [eventsWithCreators, setEventsWithCreators] = useState<any[]>([]);

  const fetchCreatedEvents = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const response = await eventService.getEventsByUserId(currentUserId.toString());
      
      if (response && response.events) {
        // Fetch creator names for each event
        const eventsWithCreatorInfo = await Promise.all(
          response.events.map(async (event: any) => {
            try {
              const userResponse = await fetch(`${API_URL_USERS}/${event.creatorId}`);
              if (userResponse.ok) {
                const user = await userResponse.json();
                return {
                  ...event,
                  creators: user.name || user.username || 'Unknown',
                };
              }
            } catch (error) {
              console.error(`Error fetching creator for event ${event.id}:`, error);
            }
            return {
              ...event,
              creators: 'Unknown',
            };
          })
        );

        setEvents(response.events);
        setEventsWithCreators(eventsWithCreatorInfo);
      }
    } catch (error) {
      console.error('Error fetching created events:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCreatedEvents();
    }, [currentUserId])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCreatedEvents();
    setRefreshing(false);
  }, [currentUserId]);

  const missingInfoCount = countEventsWithMissingInfo(events);

  const handleEventPress = (event: Event) => {
    // Vérifier si des infos manquent
    const missingInfo = checkMissingEventInfo(event);
    const eventId = typeof event.id === 'string' ? parseInt(event.id) : event.id;
    
    if (missingInfo.hasMissingInfo && eventId) {
      // Naviguer vers le formulaire post-event
      router.push({
        pathname: '/(app)/post-event-info',
        params: { eventId: eventId.toString() },
      });
    } else {
      // Sinon, aller à la page de détail normale
      router.push({
        pathname: '/(app)/event-detail',
        params: { eventId: event.id },
      });
    }
  };

  if (loading && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <FontAwesome name="arrow-left" size={20} color="#1E232C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Created Events</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#1E232C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Created Events</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {missingInfoCount > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.warningText}>
              ⚠️ {missingInfoCount} event{missingInfoCount > 1 ? 's' : ''} with missing information
            </Text>
            <Text style={[styles.statsText, { fontSize: 12, marginTop: 4, color: theme.colors.text.secondary }]}>
              Only events with missing information are displayed below
            </Text>
          </View>
        )}

        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="calendar-o" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No events created yet</Text>
            <TouchableOpacity
              style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: '#E10600',
                borderRadius: 8,
              }}
              onPress={() => router.push('/(app)/create-event')}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                Create Your First Event
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {eventsWithCreators
              .filter((event: any) => {
                // Filtrer pour ne garder que les événements avec des informations manquantes
                const missingInfo = checkMissingEventInfo(event);
                return missingInfo.hasMissingInfo;
              })
              .map((event: any, index: number) => {
                const eventId = typeof event.id === 'string' ? parseInt(event.id) : event.id;
                
                return (
                  <EventItem
                    key={event.id?.toString() || index.toString()}
                    title={event.name}
                    subtitle={`By: ${event.creators || 'Unknown'}`}
                    date={new Date(event.date).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    icon={event.logo}
                    logoPublicId={event.logoPublicId}
                    images={event.images}
                    imagePublicIds={event.imagePublicIds}
                    location={event.location}
                    attendees={event.participantsCount || 0}
                    onPress={() => handleEventPress(event)}
                    eventId={eventId}
                    creatorId={event.creatorId}
                    currentUserId={currentUserId}
                    isJoined={true}
                    eventDate={event.date}
                    meteo={event.meteo}
                    finished={event.finished}
                    participationTagText={event.participationTagText}
                    participationTagColor={event.participationTagColor}
                  />
                );
              })}
            {eventsWithCreators.filter((event: any) => {
              const missingInfo = checkMissingEventInfo(event);
              return missingInfo.hasMissingInfo;
            }).length === 0 && (
              <View style={styles.emptyContainer}>
                <FontAwesome name="check-circle" size={64} color="#10b981" />
                <Text style={styles.emptyText}>All events are complete!</Text>
                <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
                  All your events have all the required information filled in.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyCreatedEventsScreen;
