import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomTextInput from '../ui/CustomTextInput';
import theme from '../../styles/config/theme';
import { addAppointmentToCalendar } from '../../utils/calendarHelper';

export interface AppointmentData {
  title: string;
  description?: string;
  date: Date | string;
  endDate?: Date | string;
  location?: string;
  reminder?: string;
  includeEndTime?: boolean;
}

interface AppointmentCreatorProps {
  visible: boolean;
  onSend: (appointment: AppointmentData) => void;
  onCancel: () => void;
  initialData?: AppointmentData;
}

const AppointmentCreator: React.FC<AppointmentCreatorProps> = ({ visible, onSend, onCancel, initialData }) => {
  const isEditMode = !!initialData;
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(() => {
    if (initialData?.date) {
      return typeof initialData.date === 'string' ? new Date(initialData.date) : initialData.date;
    }
    return new Date();
  });
  const [endDate, setEndDate] = useState(() => {
    if (initialData?.endDate) {
      return typeof initialData.endDate === 'string' ? new Date(initialData.endDate) : initialData.endDate;
    }
    const defaultEnd = new Date();
    defaultEnd.setHours(defaultEnd.getHours() + 2);
    return defaultEnd;
  });
  const [location, setLocation] = useState(initialData?.location || '');
  const [reminder, setReminder] = useState(initialData?.reminder || '1 hour before');
  const [includeEndTime, setIncludeEndTime] = useState(initialData?.includeEndTime ?? true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [endPickerMode, setEndPickerMode] = useState<'date' | 'time'>('date');

  // Reset form when initialData changes or modal opens
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        const parsedDate = typeof initialData.date === 'string' 
          ? new Date(initialData.date) 
          : (initialData.date || new Date());
        setDate(parsedDate);
        const parsedEndDate = initialData.endDate
          ? (typeof initialData.endDate === 'string' ? new Date(initialData.endDate) : initialData.endDate)
          : (() => {
              const defaultEnd = new Date(parsedDate);
              defaultEnd.setHours(defaultEnd.getHours() + 2);
              return defaultEnd;
            })();
        setEndDate(parsedEndDate);
        setLocation(initialData.location || '');
        setReminder(initialData.reminder || '1 hour before');
        setIncludeEndTime(initialData.includeEndTime ?? true);
      } else {
        setTitle('');
        setDescription('');
        const now = new Date();
        setDate(now);
        const defaultEnd = new Date(now);
        defaultEnd.setHours(defaultEnd.getHours() + 2);
        setEndDate(defaultEnd);
        setLocation('');
        setReminder('1 hour before');
        setIncludeEndTime(true);
      }
    }
  }, [visible, initialData]);

  const handleSend = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Invalid Appointment', 'Please enter a title');
      return;
    }

    const appointmentDate = date instanceof Date ? date : new Date(date);
    if (appointmentDate < new Date()) {
      Alert.alert('Invalid Date', 'Appointment date cannot be in the past');
      return;
    }

    const appointmentEndDate = endDate instanceof Date ? endDate : new Date(endDate);
    if (appointmentEndDate < appointmentDate) {
      Alert.alert('Invalid Date', 'End date cannot be before start date');
      return;
    }

    const appointmentData = {
      title: title.trim(),
      description: description.trim() || undefined,
      date: appointmentDate.toISOString(),
      endDate: includeEndTime ? appointmentEndDate.toISOString() : undefined,
      location: location.trim() || undefined,
      reminder: reminder || undefined,
      includeEndTime,
    };

    // Add to calendar if creating new appointment (not editing)
    if (!isEditMode) {
      await addAppointmentToCalendar(appointmentData);
    }

    onSend(appointmentData);
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setDate(newDate);
      }
    } else {
      // iOS
      if (selectedDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        setDate(newDate);
        // Switch to time picker after date selection
        setPickerMode('time');
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selectedTime) {
        const newDate = new Date(date);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setDate(newDate);
      }
    } else {
      // iOS
      if (selectedTime) {
        const newDate = new Date(date);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setDate(newDate);
      }
      // Close picker on iOS when time is selected
      setShowTimePicker(false);
      setShowDatePicker(false);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(endDate.getHours());
        newDate.setMinutes(endDate.getMinutes());
        setEndDate(newDate);
      }
    } else {
      if (selectedDate) {
        const newDate = new Date(selectedDate);
        newDate.setHours(endDate.getHours());
        newDate.setMinutes(endDate.getMinutes());
        setEndDate(newDate);
        setEndPickerMode('time');
      }
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
      if (event.type === 'set' && selectedTime) {
        const newDate = new Date(endDate);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setEndDate(newDate);
      }
    } else {
      if (selectedTime) {
        const newDate = new Date(endDate);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        setEndDate(newDate);
      }
      setShowEndTimePicker(false);
      setShowEndDatePicker(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onCancel} style={styles.cancelHeaderButton}>
                <Text style={styles.cancelHeaderText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>{isEditMode ? 'Edit Appointment' : 'Create Appointment'}</Text>
              <TouchableOpacity 
                onPress={handleSend} 
                style={[styles.sendHeaderButton, !title.trim() && styles.sendHeaderButtonDisabled]}
                disabled={!title.trim()}
              >
                <Text style={[styles.sendHeaderText, !title.trim() && styles.sendHeaderTextDisabled]}>
                  {isEditMode ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <CustomTextInput
                  style={styles.input}
                  placeholder="Add appointment name"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <CustomTextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add description (optional)"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                />
                {description.length > 0 && (
                  <Text style={styles.charCount}>{500 - description.length}</Text>
                )}
              </View>

              <View style={styles.dateTimeSection}>
                <Text style={styles.sectionLabel}>Start</Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        setPickerMode('date');
                        setShowDatePicker(true);
                        setShowTimePicker(false);
                      } else {
                        setShowDatePicker(true);
                      }
                    }}
                  >
                    <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        setPickerMode('time');
                        setShowTimePicker(true);
                        setShowDatePicker(false);
                      } else {
                        setShowTimePicker(true);
                      }
                    }}
                  >
                    <Text style={styles.timeButtonText}>{formatTime(date)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {Platform.OS === 'android' && (
                <>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                      display="default"
                      onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={date}
                  mode="time"
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}
                </>
              )}

              {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
                <View style={styles.pickerContainer}>
                  <View style={styles.iosPickerWrapper}>
                    <View style={styles.iosPickerHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowDatePicker(false);
                          setShowTimePicker(false);
                        }}
                      >
                        <Text style={styles.iosPickerButton}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={date}
                      mode={pickerMode}
                      display="spinner"
                      onChange={pickerMode === 'date' ? handleDateChange : handleTimeChange}
                      minimumDate={pickerMode === 'date' ? new Date() : undefined}
                      locale="en_US"
                      textColor={theme.colors.text.primary}
                      themeVariant="light"
                    />
                  </View>
                </View>
              )}

              {includeEndTime && (
                <View style={styles.dateTimeSection}>
                  <Text style={styles.sectionLabel}>End</Text>
                  <View style={styles.dateTimeRow}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          setEndPickerMode('date');
                          setShowEndDatePicker(true);
                          setShowEndTimePicker(false);
                        } else {
                          setShowEndDatePicker(true);
                        }
                      }}
                    >
                      <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        if (Platform.OS === 'ios') {
                          setEndPickerMode('time');
                          setShowEndTimePicker(true);
                          setShowEndDatePicker(false);
                        } else {
                          setShowEndTimePicker(true);
                        }
                      }}
                    >
                      <Text style={styles.timeButtonText}>{formatTime(endDate)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {Platform.OS === 'android' && (
                <>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="default"
                      onChange={handleEndDateChange}
                      minimumDate={date}
                    />
                  )}
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="time"
                      display="default"
                      onChange={handleEndTimeChange}
                    />
                  )}
                </>
              )}

              {Platform.OS === 'ios' && (showEndDatePicker || showEndTimePicker) && (
                <View style={styles.pickerContainer}>
                  <View style={styles.iosPickerWrapper}>
                    <View style={styles.iosPickerHeader}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowEndDatePicker(false);
                          setShowEndTimePicker(false);
                        }}
                      >
                        <Text style={styles.iosPickerButton}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={endDate}
                      mode={endPickerMode}
                      display="spinner"
                      onChange={endPickerMode === 'date' ? handleEndDateChange : handleEndTimeChange}
                      minimumDate={endPickerMode === 'date' ? date : undefined}
                      locale="en_US"
                      textColor={theme.colors.text.primary}
                      themeVariant="light"
                    />
                  </View>
                </View>
              )}

              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Include end time</Text>
                <Switch
                  value={includeEndTime}
                  onValueChange={setIncludeEndTime}
                  trackColor={{ false: theme.colors.grey[300], true: theme.colors.primary.light }}
                  thumbColor={includeEndTime ? theme.colors.primary.main : theme.colors.grey[400]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reminder</Text>
                <TouchableOpacity
                  style={styles.reminderButton}
                  onPress={() => {
                    // Simple reminder options
                    Alert.alert(
                      'Reminder',
                      'Choose a reminder',
                      [
                        { text: '15 minutes before', onPress: () => setReminder('15 minutes before') },
                        { text: '30 minutes before', onPress: () => setReminder('30 minutes before') },
                        { text: '1 hour before', onPress: () => setReminder('1 hour before') },
                        { text: '2 hours before', onPress: () => setReminder('2 hours before') },
                        { text: '1 day before', onPress: () => setReminder('1 day before') },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.reminderButtonText}>{reminder}</Text>
                  <FontAwesome name="chevron-down" size={14} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <CustomTextInput
                  style={styles.input}
                  placeholder="Add location (optional)"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={location}
                  onChangeText={setLocation}
                  maxLength={200}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  cancelHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelHeaderText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  sendHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.primary.main,
  },
  sendHeaderButtonDisabled: {
    backgroundColor: theme.colors.grey[300],
    opacity: 0.5,
  },
  sendHeaderText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sendHeaderTextDisabled: {
    color: theme.colors.text.secondary,
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.grey[100],
    minHeight: 50,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    paddingBottom: 16,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: 4,
  },
  dateTimeSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: theme.colors.grey[100],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  dateButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  timeButton: {
    flex: 1,
    backgroundColor: theme.colors.grey[100],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  pickerContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  iosPickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  iosPickerButton: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.main,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  reminderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: 12,
    padding: 16,
    backgroundColor: theme.colors.grey[100],
    minHeight: 50,
  },
  reminderButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
});

export default AppointmentCreator;
