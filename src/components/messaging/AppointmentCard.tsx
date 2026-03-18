import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import theme from '@/theme';
import { addAppointmentToCalendar } from '@/utils/calendarHelper';
import styles from '@/styles/components/messaging/appointmentCardStyles';

const { width: screenWidth } = Dimensions.get('window');

export interface AppointmentData {
  title: string;
  description?: string;
  date: Date | string;
  endDate?: Date | string;
  location?: string;
  reminder?: string;
  includeEndTime?: boolean;
}

interface AppointmentCardProps {
  appointment: AppointmentData;
  isOwn: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, isOwn }) => {
  // Parse date if it's a string
  const appointmentDate = typeof appointment.date === 'string' ? new Date(appointment.date) : appointment.date;
  const appointmentEndDate = appointment.endDate 
    ? (typeof appointment.endDate === 'string' ? new Date(appointment.endDate) : appointment.endDate)
    : null;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPast = appointmentDate < new Date();

  const handlePress = async () => {
    await addAppointmentToCalendar(appointment);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isOwn && styles.ownContainer, isPast && styles.pastContainer]}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, isOwn && styles.ownIconContainer, isPast && styles.pastIconContainer]}>
          <FontAwesome 
            name="calendar" 
            size={screenWidth * 0.08} 
            color={isOwn ? '#FFFFFF' : theme.colors.primary.main} 
          />
        </View>
        
        <View style={styles.eventInfo}>
          <Text 
            style={[styles.eventTitle, isOwn && styles.ownEventTitle]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {appointment.title}
          </Text>
          
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <FontAwesome 
                name="clock-o" 
                size={screenWidth * 0.032} 
                color={isOwn ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary} 
              />
              <Text style={[styles.detailText, isOwn && styles.ownDetailText]}>
                {formatDate(appointmentDate)} at {formatTime(appointmentDate)}
                {appointmentEndDate && ` - ${formatTime(appointmentEndDate)}`}
              </Text>
            </View>
            
            {appointment.location && (
              <View style={styles.detailRow}>
                <FontAwesome 
                  name="map-marker" 
                  size={screenWidth * 0.032} 
                  color={isOwn ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary} 
                />
                <Text 
                  style={[styles.detailText, isOwn && styles.ownDetailText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {appointment.location}
                </Text>
              </View>
            )}
            
            {appointment.description && (
              <View style={styles.detailRow}>
                <FontAwesome 
                  name="info-circle" 
                  size={screenWidth * 0.032} 
                  color={isOwn ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.secondary} 
                />
                <Text 
                  style={[styles.detailText, isOwn && styles.ownDetailText, styles.descriptionText]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {appointment.description}
                </Text>
              </View>
            )}
          </View>
          
          {isPast && (
            <View style={styles.pastBadge}>
              <Text style={[styles.pastBadgeText, isOwn && styles.ownPastBadgeText]}>
                Past
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default AppointmentCard;
