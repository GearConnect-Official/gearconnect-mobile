import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import theme from '@/theme';
import styles from '@/styles/components/messaging/locationCardStyles';

const { width: screenWidth } = Dimensions.get('window');

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface LocationCardProps {
  location: LocationData;
  isOwn: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({ location, isOwn }) => {
  const handleOpen = async () => {
    try {
      // Open location in native maps app
      const url = Platform.OS === 'ios'
        ? `maps://maps.apple.com/?q=${location.latitude},${location.longitude}`
        : `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const googleMapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        await Linking.openURL(googleMapsUrl);
      }
    } catch (error) {
      console.error('Error opening location:', error);
    }
  };

  const displayName = location.name || location.address || 'Location';

  return (
    <TouchableOpacity
      style={[styles.container, isOwn && styles.ownContainer]}
      onPress={handleOpen}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, isOwn && styles.ownIconContainer]}>
          <FontAwesome 
            name="map-marker" 
            size={screenWidth * 0.08} 
            color={isOwn ? '#FFFFFF' : theme.colors.primary.main} 
          />
        </View>
        
        <View style={styles.locationInfo}>
          <Text 
            style={[styles.locationName, isOwn && styles.ownLocationName]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {displayName}
          </Text>
          
          <View style={styles.coordinates}>
            <FontAwesome 
              name="map-pin" 
              size={screenWidth * 0.028} 
              color={isOwn ? 'rgba(255, 255, 255, 0.7)' : theme.colors.text.secondary} 
            />
            <Text style={[styles.coordinatesText, isOwn && styles.ownCoordinatesText]}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.openButton, isOwn && styles.ownOpenButton]}
            onPress={handleOpen}
            activeOpacity={0.7}
          >
            <FontAwesome 
              name="external-link" 
              size={screenWidth * 0.04} 
              color={isOwn ? '#FFFFFF' : theme.colors.primary.main} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LocationCard;
