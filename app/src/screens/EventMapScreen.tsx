import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MOCK_EVENTS,
  EVENT_CATEGORIES,
  DEFAULT_REGION,
  MapEvent,
  EventCategory,
} from '../mocks/eventMapMockData';
import { API_URL_EVENTS } from '../config';
import { Event } from '../services/eventService';
import styles from '../styles/screens/events/eventMapStyles';
import theme from '../styles/config/theme';


type DateFilter = 'all' | 'today' | 'week' | 'month';
type PriceFilter = 'all' | 'free' | 'paid';
type StatusFilter = 'all' | 'upcoming' | 'passed';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

const PRICE_FILTERS: { key: PriceFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'free', label: 'Gratuit' },
  { key: 'paid', label: 'Payant' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'upcoming', label: 'A venir' },
  { key: 'passed', label: 'Passes' },
];

const apiEventToMapEvent = (event: Event): MapEvent | null => {
  const meteo = event.meteo as any;
  if (!meteo?.latitude || !meteo?.longitude) return null;

  const validCategories: EventCategory[] = ['race', 'trackday', 'meet', 'rally', 'drift', 'karting'];
  const category: EventCategory = validCategories.includes(meteo.category) ? meteo.category : 'meet';

  return {
    id: typeof event.id === 'string' ? parseInt(event.id) : (event.id ?? 0),
    name: event.name,
    description: event.description || '',
    location: event.location,
    latitude: meteo.latitude,
    longitude: meteo.longitude,
    date: typeof event.date === 'string' ? event.date : new Date(event.date).toISOString(),
    category,
    participantsCount: event.participantsCount || 0,
    maxParticipants: meteo.expectedParticipants || 50,
    organizer: event.creators || 'Organisateur',
    image: event.logo || null,
    price: event.website ? 'Payant' : 'Gratuit',
    isJoined: false,
  };
};

const EventMapScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const cardTranslateY = useRef(new Animated.Value(400)).current;
  const filterTranslateY = useRef(new Animated.Value(600)).current;
  const filterOverlayOpacity = useRef(new Animated.Value(0)).current;
  const selectedEventRef = useRef<MapEvent | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(new Set());
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [allEvents, setAllEvents] = useState<MapEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MapEvent[]>([]);
  const [_region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterMounted, setFilterMounted] = useState(false);

  const activeFilterCount = activeCategories.size
    + (dateFilter !== 'all' ? 1 : 0)
    + (priceFilter !== 'all' ? 1 : 0)
    + (statusFilter !== 'all' ? 1 : 0);

  // Fetch events from API, fallback to mock data
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_URL_EVENTS);
        if (!response.ok) throw new Error('API error');
        const apiEvents: Event[] = await response.json();
        const mapEvents = apiEvents
          .map(apiEventToMapEvent)
          .filter((e): e is MapEvent => e !== null);
        setAllEvents(mapEvents.length > 0 ? mapEvents : MOCK_EVENTS);
      } catch {
        setAllEvents(MOCK_EVENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Request location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch { /* default Paris */ }
      }
    })();
  }, []);

  // Apply all filters
  useEffect(() => {
    let events = allEvents;

    // Category filter
    if (activeCategories.size > 0) {
      events = events.filter((e) => activeCategories.has(e.category));
    }

    // Search filter
    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.location.toLowerCase().includes(query) ||
          e.organizer.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      events = events.filter((e) => {
        const eventDate = new Date(e.date);
        if (dateFilter === 'today') {
          return eventDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const weekFromNow = new Date(now);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return eventDate >= now && eventDate <= weekFromNow;
        }
        if (dateFilter === 'month') {
          return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Price filter
    if (priceFilter !== 'all') {
      events = events.filter((e) =>
        priceFilter === 'free' ? e.price === 'Gratuit' : e.price !== 'Gratuit'
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      events = events.filter((e) => {
        const eventDate = new Date(e.date);
        return statusFilter === 'upcoming' ? eventDate >= now : eventDate < now;
      });
    }

    setFilteredEvents(events);
  }, [activeCategories, searchQuery, allEvents, dateFilter, priceFilter, statusFilter]);

  // Animate bottom card
  useEffect(() => {
    selectedEventRef.current = selectedEvent;
    if (selectedEvent) {
      Animated.spring(cardTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(cardTranslateY, { toValue: 400, duration: 200, useNativeDriver: true }).start();
    }
  }, [selectedEvent]);

  // Animate filter panel
  useEffect(() => {
    if (filterVisible) {
      setFilterMounted(true);
      Animated.parallel([
        Animated.spring(filterTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(filterOverlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(filterTranslateY, { toValue: 600, duration: 200, useNativeDriver: true }),
        Animated.timing(filterOverlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setFilterMounted(false));
    }
  }, [filterVisible]);

  const toggleCategory = useCallback((cat: EventCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setActiveCategories(new Set());
    setDateFilter('all');
    setPriceFilter('all');
    setStatusFilter('all');
  }, []);

  const getCategoryInfo = (category: EventCategory) =>
    EVENT_CATEGORIES.find((c) => c.key === category)!;

  // Swipe-to-dismiss PanResponder for bottom card
  const dragStartY = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx * 1.5),
      onPanResponderGrant: () => {
        // Capture current animated position as starting point
        cardTranslateY.stopAnimation((value) => {
          dragStartY.current = value;
        });
      },
      onPanResponderMove: (_, gs) => {
        const newY = dragStartY.current + gs.dy;
        // Only allow downward from 0 (clamp to >= 0)
        cardTranslateY.setValue(Math.max(0, newY));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 60 || gs.vy > 0.4) {
          // Dismiss
          Animated.timing(cardTranslateY, {
            toValue: 400,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            setSelectedEvent(null);
          });
        } else {
          // Snap back to open
          Animated.spring(cardTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Swipe-to-dismiss PanResponder for filter panel
  const filterDragStartY = useRef(0);
  const filterPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx * 1.5),
      onPanResponderGrant: () => {
        filterTranslateY.stopAnimation((value) => {
          filterDragStartY.current = value;
        });
      },
      onPanResponderMove: (_, gs) => {
        const newY = filterDragStartY.current + gs.dy;
        filterTranslateY.setValue(Math.max(0, newY));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 60 || gs.vy > 0.4) {
          Animated.parallel([
            Animated.timing(filterTranslateY, { toValue: 600, duration: 150, useNativeDriver: true }),
            Animated.timing(filterOverlayOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start(() => {
            setFilterVisible(false);
            setFilterMounted(false);
          });
        } else {
          Animated.spring(filterTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const handleMarkerPress = useCallback((eventId: number) => {
    const event = filteredEvents.find((e) => e.id === eventId) ?? allEvents.find((e) => e.id === eventId);
    if (!event) return;
    setSelectedEvent(event);
    mapRef.current?.animateToRegion(
      { latitude: event.latitude - 0.15, longitude: event.longitude, latitudeDelta: 0.8, longitudeDelta: 0.8 },
      350
    );
  }, [filteredEvents, allEvents]);

  const handleMapPress = useCallback((e: any) => {
    // On Android, marker taps also trigger MapView onPress.
    // Check the action to only deselect on real map taps.
    const action = e?.nativeEvent?.action;
    if (action === 'marker-press') return;
    setSelectedEvent(null);
  }, []);

  const handleLocateMe = useCallback(() => {
    const target = userLocation
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.5, longitudeDelta: 0.5 }
      : DEFAULT_REGION;
    mapRef.current?.animateToRegion(target, 400);
    setSelectedEvent(null);
  }, [userLocation]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const renderMarker = (event: MapEvent) => {
    const catInfo = getCategoryInfo(event.category);
    const isSelected = selectedEvent?.id === event.id;
    return (
      <Marker
        key={event.id}
        identifier={String(event.id)}
        coordinate={{ latitude: event.latitude, longitude: event.longitude }}
        onPress={() => handleMarkerPress(event.id)}
        tracksViewChanges={false}
        stopPropagation
      >
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.markerBubble,
              { backgroundColor: catInfo.color },
              event.isJoined && styles.markerBubbleJoined,
              isSelected && styles.markerBubbleSelected,
            ]}
          >
            <FontAwesome name={catInfo.icon as any} size={16} color="#fff" />
          </View>
          <View style={[styles.markerArrow, { borderTopColor: event.isJoined ? theme.colors.status.success : catInfo.color }]} />
        </View>
      </Marker>
    );
  };

  const renderBottomCard = () => {
    if (!selectedEvent) return null;
    const catInfo = getCategoryInfo(selectedEvent.category);
    return (
      <Animated.View
        style={[
          styles.bottomCardContainer,
          { transform: [{ translateY: cardTranslateY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.bottomCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.bottomCardHandle} />
          <View style={styles.bottomCardHeader}>
            <View style={styles.bottomCardHeaderLeft}>
              <View style={styles.bottomCardCategory}>
                <FontAwesome name={catInfo.icon as any} size={12} color={catInfo.color} />
                <Text style={[styles.bottomCardCategoryText, { color: catInfo.color }]}>{catInfo.label}</Text>
              </View>
              <Text style={styles.bottomCardTitle} numberOfLines={2}>{selectedEvent.name}</Text>
            </View>
            <Text style={styles.bottomCardPrice}>{selectedEvent.price}</Text>
          </View>
          <View style={styles.bottomCardInfoRow}>
            <View style={styles.bottomCardInfoItem}>
              <FontAwesome name="map-marker" size={14} color={theme.colors.primary.main} />
              <Text style={styles.bottomCardInfoText} numberOfLines={1}>{selectedEvent.location}</Text>
            </View>
            <View style={styles.bottomCardInfoItem}>
              <FontAwesome name="calendar" size={13} color={theme.colors.primary.main} />
              <Text style={styles.bottomCardInfoText}>{formatDate(selectedEvent.date)}</Text>
            </View>
            <View style={styles.bottomCardInfoItem}>
              <FontAwesome name="clock-o" size={14} color={theme.colors.primary.main} />
              <Text style={styles.bottomCardInfoText}>{formatTime(selectedEvent.date)}</Text>
            </View>
            <View style={styles.bottomCardInfoItem}>
              <FontAwesome name="users" size={13} color={theme.colors.primary.main} />
              <Text style={styles.bottomCardInfoText}>{selectedEvent.participantsCount}/{selectedEvent.maxParticipants}</Text>
            </View>
          </View>
          <Text style={styles.bottomCardDescription} numberOfLines={2}>{selectedEvent.description}</Text>
          <View style={styles.bottomCardActions}>
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => router.push({ pathname: '/(app)/eventDetail', params: { eventId: selectedEvent.id.toString() } })}
            >
              <Text style={styles.detailButtonText}>Voir les details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.joinButton, selectedEvent.isJoined && styles.joinButtonJoined]}
              onPress={() => {
                const toggled = !selectedEvent.isJoined;
                setFilteredEvents((prev) => prev.map((e) => e.id === selectedEvent.id ? { ...e, isJoined: toggled } : e));
                setAllEvents((prev) => prev.map((e) => e.id === selectedEvent.id ? { ...e, isJoined: toggled } : e));
                setSelectedEvent({ ...selectedEvent, isJoined: toggled });
              }}
            >
              <Text style={[styles.joinButtonText, selectedEvent.isJoined && styles.joinButtonTextJoined]}>
                {selectedEvent.isJoined ? 'Inscrit' : "S'inscrire"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderFilterPanel = () => {
    if (!filterMounted) return null;
    return (
      <View style={styles.filterOverlay} pointerEvents="box-none">
        {/* Backdrop */}
        <Animated.View style={[styles.filterOverlayBackdrop, { opacity: filterOverlayOpacity }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setFilterVisible(false)} />
        </Animated.View>

        <Animated.View
          style={[
            styles.filterPanel,
            { transform: [{ translateY: filterTranslateY }], paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          {/* Swipeable handle + header zone */}
          <View {...filterPanResponder.panHandlers} style={styles.filterPanelDragZone}>
            <View style={styles.filterPanelHandle} />
            <View style={styles.filterPanelHeader}>
              <Text style={styles.filterPanelTitle}>Filtres</Text>
              <TouchableOpacity onPress={resetFilters}>
                <Text style={styles.filterResetText}>Reinitialiser</Text>
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

            {/* Categories */}
            <Text style={styles.filterSectionTitle}>Categorie</Text>
            <View style={styles.filterChipsWrap}>
              {EVENT_CATEGORIES.map((cat) => {
                const isActive = activeCategories.has(cat.key);
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.filterChip, isActive && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => toggleCategory(cat.key)}
                  >
                    <FontAwesome name={cat.icon as any} size={13} color={isActive ? '#fff' : cat.color} />
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextSelected]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date */}
            <Text style={styles.filterSectionTitle}>Date</Text>
            <View style={styles.filterChipsWrap}>
              {DATE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, dateFilter === f.key && styles.filterChipSelected]}
                  onPress={() => setDateFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, dateFilter === f.key && styles.filterChipTextSelected]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price */}
            <Text style={styles.filterSectionTitle}>Tarif</Text>
            <View style={styles.filterChipsWrap}>
              {PRICE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, priceFilter === f.key && styles.filterChipSelected]}
                  onPress={() => setPriceFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, priceFilter === f.key && styles.filterChipTextSelected]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status */}
            <Text style={styles.filterSectionTitle}>Statut</Text>
            <View style={styles.filterChipsWrap}>
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, statusFilter === f.key && styles.filterChipSelected]}
                  onPress={() => setStatusFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextSelected]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        onPress={handleMapPress}
        onRegionChangeComplete={setRegion}
        mapPadding={{ top: 80, right: 0, bottom: 20, left: 0 }}
        legalLabelInsets={{ bottom: 44, left: 16, top: 0, right: 0 }}
      >
        {filteredEvents.map(renderMarker)}
      </MapView>

      {/* Top bar: back + search + filter icon */}
      <View style={[styles.topBarOverlay, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.topBarRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.searchBarContainer}>
            <FontAwesome name="search" size={15} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un evenement..."
              placeholderTextColor={theme.colors.text.hint}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome name="times-circle" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
            onPress={() => setFilterVisible(true)}
          >
            <FontAwesome name="sliders" size={18} color={activeFilterCount > 0 ? '#fff' : theme.colors.text.primary} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Event count badge */}
      {!loading && (
        <View style={[styles.eventCountBadge, { top: insets.top + 56 }]}>
          <Text style={styles.eventCountText}>
            {filteredEvents.length} evenement{filteredEvents.length !== 1 ? 's' : ''} trouves
          </Text>
        </View>
      )}
      {loading && (
        <View style={[styles.eventCountBadge, { top: insets.top + 56 }]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}

      {/* Locate me */}
      <TouchableOpacity style={styles.locateButton} onPress={handleLocateMe}>
        <FontAwesome name="crosshairs" size={22} color={theme.colors.primary.main} />
      </TouchableOpacity>

      {/* Bottom card when marker is selected */}
      {selectedEvent && renderBottomCard()}

      {renderFilterPanel()}
    </View>
  );
};

export default EventMapScreen;
