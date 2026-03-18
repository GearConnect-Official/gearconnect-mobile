import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/context/AuthContext";
import PerformanceService from "@/services/performanceService";
import {
  PerformanceFormData,
  PerformanceFormErrors,
  RACE_CATEGORIES,
  TRACK_CONDITIONS,
  RaceCategory,
  CreatePerformanceData,
} from "@/types/performance.types";
import {
  performanceStyles,
  THEME_COLORS,
  LAYOUT,
  TYPOGRAPHY,
} from "@/styles/screens/user/performanceStyles";
import { useMessage } from '@/context/MessageContext';
import userService from '@/services/userService';
import eventService from '@/services/eventService';
import { getSelectedEvent } from '@/utils/eventSelection';

const AddPerformanceScreen: React.FC = () => {
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const { showError, showConfirmation } = useMessage();

  // Form state
  const [formData, setFormData] = useState<PerformanceFormData>({
    circuitName: "",
    lapTime: "",
    racePosition: "",
    totalParticipants: "",
    category: "karting",
    date: new Date(),
    notes: "",
    trackCondition: "dry",
    eventId: undefined,
  });

  // Joined events state
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
  // Track which fields were auto-filled from event
  const [autoFilledFields, setAutoFilledFields] = useState<{
    circuitName: boolean;
    totalParticipants: boolean;
    date: boolean;
    trackCondition: boolean;
    notes: boolean;
  }>({
    circuitName: false,
    totalParticipants: false,
    date: false,
    trackCondition: false,
    notes: false,
  });

  // Form validation errors
  const [errors, setErrors] = useState<PerformanceFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  // Animation
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Load joined events
  React.useEffect(() => {
    const loadJoinedEvents = async () => {
      if (!user?.id) return;
      
      setLoadingEvents(true);
      try {
        const response = await userService.getJoinedEvents(
          typeof user.id === 'string' ? parseInt(user.id) : user.id,
          1,
          100
        );
        if (response.success && response.data) {
          setJoinedEvents(response.data.events || []);
        }
      } catch (error) {
        console.error('Error loading joined events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadJoinedEvents();
  }, [user?.id]);

  // Listen for selected event from SelectEventScreen
  useFocusEffect(
    useCallback(() => {
      // Check for selected event from SelectEventScreen
      const selectedEvent = getSelectedEvent();
      if (selectedEvent) {
        updateField("eventId", selectedEvent.id);
        setSelectedEventName(selectedEvent.name);
        
        // Fetch full event details to get creator info and event data
        loadEventDetails(selectedEvent.id);
      }
    }, [])
  );

  // Load event details and pre-fill form
  const loadEventDetails = async (eventId: number) => {
    try {
      const event = await eventService.getEventById(eventId.toString());
      
      if (event) {
        const newAutoFilled: typeof autoFilledFields = {
          circuitName: false,
          totalParticipants: false,
          date: false,
          trackCondition: false,
          notes: false,
        };

        // Prepare all updates at once to avoid closure issues
        const updates: Partial<PerformanceFormData> = {};

        // Pre-fill date with event date (always, even if already filled)
        if (event.date) {
          const eventDate = new Date(event.date);
          if (!isNaN(eventDate.getTime())) {
            updates.date = eventDate;
            newAutoFilled.date = true;
          }
        }

        // Pre-fill circuit name from event meteo (set by creator) or fallback to location
        if (event.meteo && typeof event.meteo === 'object') {
          const meteo = event.meteo as any;
          if (meteo.circuitName && meteo.circuitName.trim()) {
            updates.circuitName = meteo.circuitName;
            newAutoFilled.circuitName = true;
          } else if (event.location) {
            // Fallback to location if circuitName not set by creator
            updates.circuitName = event.location;
            newAutoFilled.circuitName = true;
          }
        } else if (event.location) {
          // Fallback to location if no meteo
          updates.circuitName = event.location;
          newAutoFilled.circuitName = true;
        }

        // Pre-fill total participants from event meteo (set by creator) or fallback to participantsCount
        if (event.meteo && typeof event.meteo === 'object') {
          const meteo = event.meteo as any;
          if (meteo.expectedParticipants !== undefined && meteo.expectedParticipants !== null) {
            updates.totalParticipants = meteo.expectedParticipants.toString();
            newAutoFilled.totalParticipants = true;
          } else if (event.participantsCount !== undefined && event.participantsCount !== null) {
            // Fallback to actual participants count if expectedParticipants not set by creator
            updates.totalParticipants = event.participantsCount.toString();
            newAutoFilled.totalParticipants = true;
          }
        } else if (event.participantsCount !== undefined && event.participantsCount !== null) {
          // Fallback to actual participants count if no meteo
          updates.totalParticipants = event.participantsCount.toString();
          newAutoFilled.totalParticipants = true;
        }

        // Pre-fill track condition from event meteo if available
        if (event.meteo && typeof event.meteo === 'object') {
          const meteo = event.meteo as any;
          if (meteo.trackCondition) {
            const condition = meteo.trackCondition.toLowerCase();
            if (condition === 'dry' || condition === 'wet' || condition === 'mixed' || condition === 'damp' || condition === 'slippery' || condition === 'drying') {
              updates.trackCondition = condition as 'dry' | 'wet' | 'mixed' | 'damp' | 'slippery' | 'drying';
              newAutoFilled.trackCondition = true;
            }
          }
        }

        // Apply all updates at once
        setFormData((prev) => ({ ...prev, ...updates }));

        setAutoFilledFields(newAutoFilled);

        // Use creator information from event (now included in API response)
        if (event.creator) {
          const creator = event.creator;
          
          // Build creator info string
          const creatorInfo: string[] = [];
          if (creator.name) {
            creatorInfo.push(`Event: ${event.name || 'Untitled Event'}`);
            creatorInfo.push(`Organized by: ${creator.name}`);
          }
          if (creator.username) {
            creatorInfo.push(`@${creator.username}`);
          }
          if (creator.description) {
            creatorInfo.push(`\n${creator.description}`);
          }
          
          // Add creator info to notes if notes are empty
          setFormData((prev) => {
            if (!prev.notes.trim() && creatorInfo.length > 0) {
              return { ...prev, notes: creatorInfo.join('\n') };
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Error loading event details:', error);
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: PerformanceFormErrors = {};

    // Circuit name validation
    if (!formData.circuitName.trim()) {
      newErrors.circuitName = "Circuit name is required";
    }

    // Lap time validation (MM:SS.sss format)
    const lapTimeRegex = /^\d+:\d{2}\.\d{3}$/;
    if (!formData.lapTime.trim()) {
      newErrors.lapTime = "Lap time is required";
    } else if (!lapTimeRegex.test(formData.lapTime)) {
      newErrors.lapTime = "Invalid format. Use MM:SS.sss (e.g., 1:23.456)";
    }

    // Position validation
    const racePosition = parseInt(formData.racePosition);
    if (!formData.racePosition.trim()) {
      newErrors.racePosition = "Position is required";
    } else if (isNaN(racePosition) || racePosition < 1) {
      newErrors.racePosition = "Position must be greater than 0";
    }

    // Participants validation
    const participants = parseInt(formData.totalParticipants);
    if (!formData.totalParticipants.trim()) {
      newErrors.totalParticipants = "Number of participants is required";
    } else if (isNaN(participants) || participants < 1) {
      newErrors.totalParticipants = "Participants must be greater than 0";
    } else if (racePosition > participants) {
      newErrors.racePosition =
        "Position cannot be greater than total participants";
    }

    // Event validation (optional but if selected, must be a joined event)
    if (formData.eventId) {
      const selectedEvent = joinedEvents.find(e => e.id === formData.eventId);
      if (!selectedEvent) {
        newErrors.eventId = "Please select a valid joined event";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      showError("You must be logged in to add a performance");
      return;
    }

    setIsLoading(true);

    try {
      const performanceData: CreatePerformanceData = {
        circuitName: formData.circuitName.trim(),
        lapTime: formData.lapTime.trim(),
        racePosition: parseInt(formData.racePosition),
        totalParticipants: parseInt(formData.totalParticipants),
        category: formData.category,
        date: formData.date.toISOString().split("T")[0], // YYYY-MM-DD format
        notes: formData.notes.trim() || undefined,
        trackCondition: formData.trackCondition,
        eventId: formData.eventId,
      };

      const response = await PerformanceService.createPerformance(
        performanceData,
        user.id
      );

      if (response.success) {
        showConfirmation({
          title: "Performance Added",
          message: response.message || "Your performance has been saved successfully!",
          confirmText: "View Performances",
          cancelText: "Add Another",
          type: 'success',
          onConfirm: () => {
            router.push('/(app)/performances');
          },
          onCancel: () => {
            // Reset form
            setFormData({
              circuitName: "",
              lapTime: "",
              racePosition: "",
              totalParticipants: "",
              category: "karting",
              date: new Date(),
        notes: "",
        trackCondition: "dry",
              eventId: undefined,
            });
            setErrors({});
          }
        });
      } else {
        const errorMessage = response.error || "Failed to save performance";
        setErrors({});
        showError(errorMessage);
      }
    } catch (error: any) {
      if (
        error?.code === "NETWORK_ERROR" ||
        error?.message?.includes("Network")
      ) {
        showError("Please check your internet connection and try again.");
      } else {
        showError("An unexpected error occurred while saving your performance");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle date change
   */
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  /**
   * Update form field and clear related errors
   */
  const updateField = (field: keyof PerformanceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  };

  /**
   * Get category data
   */
  const getCategoryData = (category: RaceCategory) => {
    return (
      RACE_CATEGORIES.find((cat) => cat.value === category) ||
      RACE_CATEGORIES[0]
    );
  };

  /**
   * Get condition data
   */
  const getConditionData = (condition: 'dry' | 'wet' | 'mixed' | 'damp' | 'slippery' | 'drying') => {
    return (
      TRACK_CONDITIONS.find((cond) => cond.value === condition) ||
      TRACK_CONDITIONS[0]
    );
  };


  /**
   * Render input field with label and error
   */
  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    error?: string,
    keyboardType: "default" | "numeric" = "default",
    multiline = false,
    disabled = false
  ) => {
    return (
      <View style={performanceStyles.inputGroup}>
        <Text style={performanceStyles.inputLabel}>{label}</Text>
        <TextInput
          style={[
            performanceStyles.textInput,
            error && performanceStyles.textInputError,
            disabled && {
              backgroundColor: '#f5f5f5',
              color: '#999',
              opacity: 0.7,
            },
            multiline && {
              height: 100,
              textAlignVertical: "top",
              paddingTop: 12,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={THEME_COLORS.TEXT_MUTED}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          maxLength={multiline ? 500 : undefined}
          submitBehavior={multiline ? "newline" : "submit"}
          returnKeyType={multiline ? "default" : "done"}
          editable={!disabled}
        />
        {error && <Text style={performanceStyles.errorText}>{error}</Text>}
        {disabled && (
          <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            This field is automatically filled from the selected event
          </Text>
        )}
        {multiline && (
          <Text
            style={{
              fontSize: 12,
              color: THEME_COLORS.TEXT_MUTED,
              textAlign: "right",
              marginTop: 4,
            }}
          >
            {value.length}/500
          </Text>
        )}
      </View>
    );
  };

  /**
   * Render selector button
   */
  const renderSelector = (
    label: string,
    value: string,
    emoji: string,
    onPress: () => void,
    color?: string,
    disabled = false
  ) => {
    return (
      <View style={performanceStyles.inputGroup}>
        <Text style={performanceStyles.inputLabel}>{label}</Text>
        <TouchableOpacity
          style={[
            performanceStyles.textInput,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: disabled 
                ? '#f5f5f5'
                : color
                ? `${color}15`
                : THEME_COLORS.CARD_BACKGROUND,
              borderColor: color || THEME_COLORS.BORDER,
              opacity: disabled ? 0.7 : 1,
            },
          ]}
          onPress={disabled ? undefined : onPress}
          disabled={disabled}
        >
          <Text
            style={[
              performanceStyles.textInput,
              { 
                borderWidth: 0, 
                padding: 0, 
                flex: 1,
                color: disabled ? '#999' : THEME_COLORS.TEXT_PRIMARY,
              },
            ]}
          >
            {emoji} {value}
          </Text>
          {!disabled && (
            <FontAwesome
              name="chevron-down"
              size={16}
              color={THEME_COLORS.TEXT_SECONDARY}
            />
          )}
        </TouchableOpacity>
        {disabled && (
          <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            This field is automatically filled from the selected event
          </Text>
        )}
      </View>
    );
  };

  /**
   * Render category selection modal
   */
  const renderCategoryModal = () => {
    return (
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={performanceStyles.modalOverlay}>
          <View style={performanceStyles.modalContent}>
            {/* Modal Header */}
            <View style={performanceStyles.modalHeader}>
              <Text style={performanceStyles.modalTitle}>
                Select Racing Category
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={{ padding: LAYOUT.SPACING_XS }}
              >
                <FontAwesome
                  name="times"
                  size={18}
                  color={THEME_COLORS.TEXT_SECONDARY}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={performanceStyles.modalList}>
              {RACE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    performanceStyles.modalItem,
                    formData.category === category.value &&
                      performanceStyles.modalItemSelected,
                    formData.category === category.value && {
                      backgroundColor: `${THEME_COLORS.RACING_RED}20`,
                      borderColor: THEME_COLORS.RACING_RED,
                    },
                  ]}
                  onPress={() => {
                    updateField("category", category.value);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={performanceStyles.modalItemEmoji}>
                    {category.emoji}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        performanceStyles.modalItemText,
                        formData.category === category.value && {
                          color: THEME_COLORS.RACING_RED,
                          fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
                        },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </View>
                  {formData.category === category.value && (
                    <FontAwesome
                      name="check"
                      size={20}
                      color={THEME_COLORS.RACING_RED}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const categoryData = getCategoryData(formData.category);
  const conditionData = getConditionData(formData.trackCondition);

  return (
    <SafeAreaView style={performanceStyles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={performanceStyles.scrollContainer}
          contentContainerStyle={performanceStyles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Header */}
          <View style={performanceStyles.header}>
            <TouchableOpacity
              style={performanceStyles.headerButton}
              onPress={() => router.back()}
            >
              <FontAwesome
                name="arrow-left"
                size={20}
                color={THEME_COLORS.TEXT_PRIMARY}
              />
            </TouchableOpacity>

            <Text style={performanceStyles.headerTitle}>Add Performance</Text>

            <View style={performanceStyles.headerButton}>
              <FontAwesome
                name="plus"
                size={20}
                color={THEME_COLORS.RACING_RED}
              />
            </View>
          </View>

          {/* Hero Section */}
          <Animated.View
            style={[
              performanceStyles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                THEME_COLORS.RACING_GRADIENT_START,
                THEME_COLORS.RACING_GRADIENT_END,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={performanceStyles.heroGradient}
            >
              <Text style={performanceStyles.heroTitle}>
                Record Your Race 🏁
              </Text>
              <Text style={performanceStyles.heroSubtitle}>
                Track every lap, celebrate every achievement, and watch your
                racing journey unfold
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              performanceStyles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Circuit Name */}
            {renderInputField(
              "Circuit Name *",
              formData.circuitName,
              (text) => updateField("circuitName", text),
              "e.g., Silverstone Circuit",
              errors.circuitName,
              "default",
              false,
              !!formData.eventId && autoFilledFields.circuitName // Disabled if event is selected and field was auto-filled
            )}

            {/* Lap Time */}
            {renderInputField(
              "Best Lap Time *",
              formData.lapTime,
              (text) => updateField("lapTime", text),
              "MM:SS.sss (e.g., 1:23.456)",
              errors.lapTime,
              "default"
            )}

            {/* Position and Participants Row */}
            <View style={{ flexDirection: "row", gap: LAYOUT.SPACING_MD }}>
              <View style={{ flex: 1 }}>
                {renderInputField(
                  "Position *",
                  formData.racePosition,
                  (text) => updateField("racePosition", text),
                  "Final position",
                  errors.racePosition,
                  "numeric"
                )}
              </View>
              <View style={{ flex: 1 }}>
                {renderInputField(
                  "Total Participants *",
                  formData.totalParticipants,
                  (text) => updateField("totalParticipants", text),
                  "Total racers",
                  errors.totalParticipants,
                  "numeric",
                  false,
                  !!formData.eventId && autoFilledFields.totalParticipants // Disabled if event is selected and field was auto-filled
                )}
              </View>
            </View>

            {/* Event Selector */}
            <View style={performanceStyles.inputGroup}>
              <Text style={performanceStyles.inputLabel}>Event (Optional)</Text>
              <TouchableOpacity
                style={[
                  performanceStyles.textInput,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: formData.eventId
                      ? `${THEME_COLORS.PRIMARY}15`
                      : THEME_COLORS.CARD_BACKGROUND,
                    borderColor: formData.eventId ? THEME_COLORS.PRIMARY : THEME_COLORS.BORDER,
                  },
                ]}
                onPress={() => router.push('/(app)/selectEvent')}
              >
                <Text
                  style={[
                    performanceStyles.textInput,
                    { borderWidth: 0, padding: 0, flex: 1 },
                  ]}
                  numberOfLines={1}
                >
                  {formData.eventId
                    ? selectedEventName || joinedEvents.find(e => e.id === formData.eventId)?.name || "Event selected"
                    : "📅 Select event"}
                </Text>
                <FontAwesome
                  name="chevron-right"
                  size={16}
                  color={THEME_COLORS.TEXT_SECONDARY}
                />
              </TouchableOpacity>
              {formData.eventId && (
                <TouchableOpacity
                  onPress={() => {
                    updateField("eventId", undefined);
                    setSelectedEventName(null);
                    // Reset auto-filled fields tracking
                    setAutoFilledFields({
                      circuitName: false,
                      totalParticipants: false,
                      date: false,
                      trackCondition: false,
                      notes: false,
                    });
                    // Clear auto-filled fields when event is deselected
                    if (autoFilledFields.circuitName) updateField("circuitName", "");
                    if (autoFilledFields.totalParticipants) updateField("totalParticipants", "");
                    if (autoFilledFields.trackCondition) updateField("trackCondition", "dry");
                    if (autoFilledFields.date) updateField("date", new Date());
                    if (autoFilledFields.notes) updateField("notes", "");
                  }}
                  style={{ marginTop: 8, alignSelf: 'flex-start' }}
                >
                  <Text style={[performanceStyles.errorText, { color: THEME_COLORS.PRIMARY, fontSize: 12 }]}>
                    ✕ Clear selection
                  </Text>
                </TouchableOpacity>
              )}
              {errors.eventId && (
                <Text style={performanceStyles.errorText}>{errors.eventId}</Text>
              )}
              {!formData.eventId && (
                <Text style={[performanceStyles.errorText, { color: THEME_COLORS.TEXT_MUTED, fontSize: 12 }]}>
                  💡 You need to join an event before adding your performance
                </Text>
              )}
            </View>

            {/* Category Selector */}
            {renderSelector(
              "Racing Category *",
              categoryData.label,
              categoryData.emoji,
              () => setShowCategoryModal(true),
              categoryData.color
            )}

            {/* Date Selector */}
            <View style={performanceStyles.inputGroup}>
              <Text style={performanceStyles.inputLabel}>Race Date *</Text>
              <TouchableOpacity
                style={[
                  performanceStyles.textInput,
                  !!(formData.eventId && autoFilledFields.date) && {
                    backgroundColor: '#f5f5f5',
                    opacity: 0.7,
                  },
                ]}
                onPress={formData.eventId && autoFilledFields.date ? undefined : () => setShowDatePicker(true)}
                disabled={!!formData.eventId && autoFilledFields.date}
              >
                <Text
                  style={{
                    fontSize: TYPOGRAPHY.BODY,
                    color: formData.eventId ? '#999' : THEME_COLORS.TEXT_PRIMARY,
                  }}
                >
                  📅{" "}
                  {formData.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
              {formData.eventId && autoFilledFields.date && (
                <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  This field is automatically filled from the selected event
                </Text>
              )}
            </View>

            {/* Track Condition Selector */}
            {renderSelector(
              "Track Condition *",
              conditionData.label,
              conditionData.emoji,
              () => setShowConditionModal(true),
              conditionData.color,
              !!formData.eventId && autoFilledFields.trackCondition // Disabled if event is selected and track condition was pre-filled
            )}

            {/* Notes */}
            {renderInputField(
              "Race Notes (Optional)",
              formData.notes,
              (text) => updateField("notes", text),
              "Share your experience, strategy, or memorable moments...",
              errors.notes,
              "default",
              true
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                performanceStyles.primaryButton,
                {
                  marginTop: LAYOUT.SPACING_LG,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <FontAwesome name="trophy" size={18} color="#FFFFFF" />
                  <Text style={performanceStyles.primaryButtonText}>
                    Save Performance
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Modals */}
        {renderCategoryModal()}

        {/* Track Condition Modal */}
        {showConditionModal && (
          <Modal transparent animationType="slide">
            <View style={performanceStyles.modalOverlay}>
              <View style={performanceStyles.modalContent}>
                <View style={performanceStyles.modalHeader}>
                  <Text style={performanceStyles.modalTitle}>
                    Select Track Condition
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowConditionModal(false)}
                  >
                    <FontAwesome
                      name="times"
                      size={24}
                      color={THEME_COLORS.TEXT_SECONDARY}
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView style={performanceStyles.modalList}>
                  {TRACK_CONDITIONS.map((condition) => (
                    <TouchableOpacity
                      key={condition.value}
                      style={[
                        performanceStyles.modalItem,
                        formData.trackCondition === condition.value &&
                          performanceStyles.modalItemSelected,
                      ]}
                      onPress={() => {
                        updateField("trackCondition", condition.value);
                        setShowConditionModal(false);
                      }}
                    >
                      <Text style={performanceStyles.modalItemEmoji}>
                        {condition.emoji}
                      </Text>
                      <Text
                        style={[
                          performanceStyles.modalItemText,
                          formData.trackCondition === condition.value &&
                            performanceStyles.modalItemTextSelected,
                        ]}
                      >
                        {condition.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddPerformanceScreen;
