import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import CustomTextInput from '../components/ui/CustomTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Event } from "../services/eventService";
import { API_URL_USERS } from '../config';
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import EventItem from "../components/items/EventItem";
import { setSelectedEvent } from "../utils/eventSelection";
import selectEventScreenStyles from "../styles/screens/events/selectEventScreenStyles";

const styles = selectEventScreenStyles;

const SelectEventScreen: React.FC = () => {
  const router = useRouter();
  const auth = useAuth();
  const currentUserId = auth?.user?.id ? Number(auth.user.id) : undefined;

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  interface TabItem {
    key: string;
    label: string;
    icon: keyof typeof FontAwesome.glyphMap;
  }

  const tabs: TabItem[] = [
    { key: 'all', label: 'All Events', icon: 'calendar' },
    { key: 'upcoming', label: 'Upcoming', icon: 'star' },
    { key: 'passed', label: 'Past Events', icon: 'history' },
  ];

  const fetchJoinedEvents = async () => {
    if (!currentUserId) {
      setError("You must be logged in to select an event");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userService.getJoinedEvents(currentUserId, 1, 100);
      
      if (response.success && response.data) {
        const events = response.data.events || [];
        
        // Filtrer pour ne garder que les événements terminés
        // Un événement est considéré comme terminé si finished === true OU si sa date est passée
        const now = new Date();
        const finishedEvents = events.filter((event: any) => {
          const eventDate = new Date(event.date);
          const isDatePassed = eventDate < now;
          return event.finished === true || isDatePassed;
        });
        
        // Fetch organizers for each event
        const eventsWithOrganizers = await Promise.all(
          finishedEvents.map(async (event: any) => {
            const organizers = event.organizers || [];
            const organizersWithDetails: { userId: number | null; name: string }[] = [];
            
            // Si pas d'organisateurs dans le tableau, inclure au moins le créateur
            if (organizers.length === 0 && event.creatorId) {
              try {
                const userResponse = await fetch(`${API_URL_USERS}/${event.creatorId}`);
                if (userResponse.ok) {
                  const user = await userResponse.json();
                  organizersWithDetails.push({
                    userId: event.creatorId,
                    name: user.username || user.name || 'Unknown',
                  });
                } else {
                  organizersWithDetails.push({
                    userId: event.creatorId,
                    name: 'Unknown',
                  });
                }
              } catch (error) {
                console.error(`Error fetching creator for event ${event.id}:`, error);
                organizersWithDetails.push({
                  userId: event.creatorId,
                  name: 'Unknown',
                });
              }
            } else {
              // Récupérer les détails de chaque organisateur
              for (const org of organizers) {
                if (org.userId) {
                  try {
                    const userResponse = await fetch(`${API_URL_USERS}/${org.userId}`);
                    if (userResponse.ok) {
                      const user = await userResponse.json();
                      organizersWithDetails.push({
                        userId: org.userId,
                        name: user.username || user.name || org.name,
                      });
                    } else {
                      organizersWithDetails.push({
                        userId: org.userId,
                        name: org.name,
                      });
                    }
                  } catch (error) {
                    console.error(`Error fetching organizer ${org.userId} for event ${event.id}:`, error);
                    organizersWithDetails.push({
                      userId: org.userId,
                      name: org.name,
                    });
                  }
                } else {
                  // Organisateur externe
                  organizersWithDetails.push({
                    userId: null,
                    name: org.name,
                  });
                }
              }
            }
            
            return { ...event, organizers: organizersWithDetails };
          })
        );

        setJoinedEvents(eventsWithOrganizers);
        applyFilters(eventsWithOrganizers, activeTab, searchQuery);
      } else {
        setError(response.error || "Failed to load events");
        setJoinedEvents([]);
        setFilteredEvents([]);
      }
    } catch (err: any) {
      console.error("Error fetching joined events:", err);
      setError("Unable to load events. Please try again.");
      setJoinedEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (events: Event[], tab: string, query: string) => {
    let filtered = [...events];

    // Apply tab filter
    if (tab !== 'all') {
      const now = new Date();
      if (tab === 'upcoming') {
        filtered = filtered.filter((event: Event) => new Date(event.date) >= now);
      } else if (tab === 'passed') {
        filtered = filtered.filter((event: Event) => new Date(event.date) < now);
      }
    }

    // Apply search filter
    if (query.trim().length >= 2) {
      const lowerCaseQuery = query.toLowerCase();
      filtered = filtered.filter((event: Event) =>
        event.name.toLowerCase().includes(lowerCaseQuery) ||
        event.location?.toLowerCase().includes(lowerCaseQuery)
      );
    }

    setFilteredEvents(filtered);
  };

  useEffect(() => {
    fetchJoinedEvents();
  }, [currentUserId]);

  useEffect(() => {
    applyFilters(joinedEvents, activeTab, searchQuery);
  }, [activeTab, searchQuery, joinedEvents]);

  const handleSearch = () => {
    applyFilters(joinedEvents, activeTab, searchQuery);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJoinedEvents();
    setRefreshing(false);
  }, [currentUserId]);

  const handleEventSelect = (event: Event) => {
    const eventId = typeof event.id === 'string' ? parseInt(event.id) : event.id;
    if (eventId) {
      // Store selected event temporarily
      setSelectedEvent({
        id: eventId,
        name: event.name || '',
      });
      // Navigate back
      router.back();
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading && joinedEvents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.centeredContainer, { flex: 1 }]}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleBack}
        >
          <FontAwesome name="arrow-left" size={20} color="#1E232C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Event</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <View style={styles.searchIcon}>
            <FontAwesome name="search" size={16} color="#666" />
          </View>
          <CustomTextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                applyFilters(joinedEvents, activeTab, '');
              }}
              style={styles.searchClearButton}
            >
              <FontAwesome name="times" size={14} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabGroup}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={styles.tabIcon}>
              <FontAwesome
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? "#fff" : "#666"}
              />
            </View>
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchJoinedEvents}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && joinedEvents.length === 0 && (
          <View style={styles.emptyContainer}>
            <FontAwesome name="calendar-o" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No finished events</Text>
            <Text style={styles.emptySubtext}>
              You can only add performances for events that have finished. Join an event and wait for it to finish.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/events')}
            >
              <Text style={styles.primaryButtonText}>Browse Events</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && filteredEvents.length === 0 && joinedEvents.length > 0 && (
          <View style={styles.emptyContainer}>
            <FontAwesome name="search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}

        {!error && filteredEvents.length > 0 && (
          <View style={styles.eventsList}>
            {filteredEvents.map((event: Event, index: number) => {
              const eventId = typeof event.id === 'string' ? parseInt(event.id) : event.id;
              
              return (
                <TouchableOpacity
                  key={event.id?.toString() || index.toString()}
                  onPress={() => handleEventSelect(event)}
                  activeOpacity={0.7}
                >
                  <EventItem
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
                    onPress={() => handleEventSelect(event)}
                    eventId={eventId}
                    creatorId={event.creatorId}
                    currentUserId={currentUserId}
                    isJoined={true}
                    finished={event.finished}
                    participationTagText={event.participationTagText}
                    participationTagColor={event.participationTagColor}
                    organizers={(event as any).organizers || []}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SelectEventScreen;
