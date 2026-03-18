import * as Calendar from 'expo-calendar';
import { Alert } from 'react-native';
import { AppointmentData } from '@/components/messaging/AppointmentCard';

const checkExistingEvent = async (
  calendars: Calendar.Calendar[],
  appointment: AppointmentData,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  try {
    const searchStartDate = new Date(startDate);
    searchStartDate.setHours(searchStartDate.getHours() - 1);

    const searchEndDate = new Date(endDate);
    searchEndDate.setHours(searchEndDate.getHours() + 1);

    for (const calendar of calendars) {
      try {
        const events = await Calendar.getEventsAsync(
          [calendar.id],
          searchStartDate,
          searchEndDate
        );

        const existingEvent = events.find((event) => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);

          const titleMatches = event.title?.toLowerCase() === appointment.title.toLowerCase();

          const timeOverlap =
            (eventStart.getTime() <= startDate.getTime() + 30 * 60 * 1000 &&
             eventEnd.getTime() >= startDate.getTime() - 30 * 60 * 1000) ||
            (eventStart.getTime() <= endDate.getTime() + 30 * 60 * 1000 &&
             eventEnd.getTime() >= endDate.getTime() - 30 * 60 * 1000);

          return titleMatches && timeOverlap;
        });

        if (existingEvent) {
          return true;
        }
      } catch (error) {
        console.warn(`Could not read calendar ${calendar.id}:`, error);
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking existing events:', error);
    return false;
  }
};

export const addAppointmentToCalendar = async (appointment: AppointmentData): Promise<boolean> => {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Calendar access is required to add appointments to your calendar.'
      );
      return false;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    let defaultCalendar = calendars.find(
      (cal) => cal.allowsModifications && cal.source.type === Calendar.SourceType.LOCAL
    );

    if (!defaultCalendar) {
      defaultCalendar = calendars.find((cal) => cal.allowsModifications);
    }

    if (!defaultCalendar && calendars.length > 0) {
      defaultCalendar = calendars[0];
    }

    if (!defaultCalendar || !defaultCalendar.allowsModifications) {
      Alert.alert('Error', 'No writable calendar found. Please check your calendar permissions.');
      return false;
    }

    const startDate = typeof appointment.date === 'string'
      ? new Date(appointment.date)
      : appointment.date;

    const endDate = appointment.endDate
      ? (typeof appointment.endDate === 'string' ? new Date(appointment.endDate) : appointment.endDate)
      : (() => {
          const defaultEnd = new Date(startDate);
          defaultEnd.setHours(defaultEnd.getHours() + 1);
          return defaultEnd;
        })();

    const eventExists = await checkExistingEvent(calendars, appointment, startDate, endDate);

    if (eventExists) {
      return new Promise((resolve) => {
        Alert.alert(
          'Event Already Exists',
          `An event with the title "${appointment.title}" already exists in your calendar at this time. Do you want to add it anyway?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Add Anyway',
              onPress: async () => {
                const result = await createCalendarEvent(defaultCalendar, appointment, startDate, endDate);
                resolve(result);
              },
            },
          ],
          { cancelable: true }
        );
      });
    }

    return await createCalendarEvent(defaultCalendar, appointment, startDate, endDate);
  } catch (error: any) {
    console.error('Error adding appointment to calendar:', error);
    Alert.alert('Error', error.message || 'Failed to add appointment to calendar.');
    return false;
  }
};

const createCalendarEvent = async (
  calendar: Calendar.Calendar,
  appointment: AppointmentData,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  try {
    const eventId = await Calendar.createEventAsync(calendar.id, {
      title: appointment.title,
      startDate: startDate,
      endDate: endDate,
      notes: appointment.description || undefined,
      location: appointment.location || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: appointment.reminder ? [{
        relativeOffset: parseReminderToMinutes(appointment.reminder),
        method: Calendar.AlarmMethod.ALERT,
      }] : undefined,
    });

    if (eventId) {
      Alert.alert('Success', 'Appointment added to your calendar.');
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    Alert.alert('Error', error.message || 'Failed to create calendar event.');
    return false;
  }
};

const parseReminderToMinutes = (reminder: string): number => {
  const lowerReminder = reminder.toLowerCase();

  if (lowerReminder.includes('15 minutes')) return -15;
  if (lowerReminder.includes('30 minutes')) return -30;
  if (lowerReminder.includes('1 hour') || lowerReminder.includes('1h')) return -60;
  if (lowerReminder.includes('2 hours') || lowerReminder.includes('2h')) return -120;
  if (lowerReminder.includes('1 day') || lowerReminder.includes('1d')) return -1440;

  return -60;
};
