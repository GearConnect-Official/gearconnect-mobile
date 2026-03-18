import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import eventService, { Event } from '@/services/eventService';
import { TRACK_CONDITIONS } from '@/types/performance.types';
import postEventInfoStyles from '@/styles/screens/events/postEventInfoStyles';

const styles = postEventInfoStyles;

const PostEventInfoScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [trackCondition, setTrackCondition] = useState<'dry' | 'wet' | 'mixed' | 'damp' | 'slippery' | 'drying' | ''>('');
  const [eventResultsLink, setEventResultsLink] = useState<string>('');
  const [seasonResultsLink, setSeasonResultsLink] = useState<string>('');
  
  // Modal states
  const [showTrackConditionModal, setShowTrackConditionModal] = useState(false);

  const loadEvent = async () => {
    if (!eventId) {
      setError('Event ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const eventData = await eventService.getEventById(eventId);
      setEvent(eventData);
      
      // Pre-fill form with existing data
      const meteo = eventData.meteo || {};
      setTrackCondition(meteo.trackCondition || '');
      setEventResultsLink(meteo.eventResultsLink || '');
      setSeasonResultsLink(meteo.seasonResultsLink || '');
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError('Failed to load event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvent();
    }, [eventId])
  );

  const handleSave = async () => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID is missing');
      return;
    }

    setSaving(true);
    try {
      const meteo = {
        trackCondition: trackCondition || undefined,
        eventResultsLink: eventResultsLink.trim() || undefined,
        seasonResultsLink: seasonResultsLink.trim() || undefined,
      };

      // Remove undefined values
      Object.keys(meteo).forEach(key => {
        if (meteo[key as keyof typeof meteo] === undefined) {
          delete meteo[key as keyof typeof meteo];
        }
      });

      const updateData = {
        meteo: meteo,
      };

      await eventService.updateEvent(eventId, updateData);
      
      Alert.alert('Success', 'Event information has been saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error('Error saving event info:', err);
      Alert.alert('Error', 'Failed to save event information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getTrackConditionDisplay = () => {
    if (!trackCondition) return 'Select track condition';
    const condition = TRACK_CONDITIONS.find(c => c.value === trackCondition);
    return condition ? `${condition.emoji} ${condition.label}` : trackCondition;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E10600" />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-triangle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>
            {error || 'Event not found'}
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="#1E232C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Post-Event Information
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.eventInfoContainer}>
          <Text style={styles.eventName}>
            {event.name}
          </Text>
          <Text style={styles.eventDescription}>
            Please fill in the post-event information to help participants complete their performance forms.
          </Text>
        </View>

        {/* Track Condition Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Track Condition *
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowTrackConditionModal(true)}
          >
            <Text style={[
              styles.selectButtonText,
              trackCondition ? styles.selectButtonTextFilled : styles.selectButtonTextPlaceholder
            ]}>
              {getTrackConditionDisplay()}
            </Text>
            <FontAwesome name="chevron-down" size={14} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Event Results Link */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Event Results Link
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://example.com/results"
            value={eventResultsLink}
            onChangeText={setEventResultsLink}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHint}>
            Link to the official results of this event
          </Text>
        </View>

        {/* Season Results Link */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Season Results Link
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="https://example.com/season-results"
            value={seasonResultsLink}
            onChangeText={setSeasonResultsLink}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHint}>
            Link to the overall season standings
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Information
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Track Condition Modal */}
      <View style={showTrackConditionModal ? styles.modalOverlay : styles.modalOverlayHidden}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowTrackConditionModal(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Track Condition</Text>
          </View>
          <View>
            {TRACK_CONDITIONS.map((condition) => (
              <TouchableOpacity
                key={condition.value}
                style={[
                  styles.modalItem,
                  condition.value === TRACK_CONDITIONS[TRACK_CONDITIONS.length - 1].value && styles.modalItemLast,
                  trackCondition === condition.value && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setTrackCondition(condition.value);
                  setShowTrackConditionModal(false);
                }}
              >
                <View style={styles.modalItemContent}>
                  <Text style={styles.modalItemEmoji}>{condition.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.modalItemText,
                      trackCondition === condition.value && styles.modalItemTextSelected,
                    ]}>
                      {condition.label}
                    </Text>
                    {condition.description && (
                      <Text style={styles.modalItemDescription}>
                        {condition.description}
                      </Text>
                    )}
                  </View>
                </View>
                {trackCondition === condition.value && (
                  <FontAwesome name="check" size={18} color="#E10600" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PostEventInfoScreen;
