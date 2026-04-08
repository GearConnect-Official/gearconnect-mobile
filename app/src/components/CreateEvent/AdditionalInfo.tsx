import * as React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, TextStyle, ViewStyle } from 'react-native';
import CustomTextInput from '../ui/CustomTextInput';
import { FontAwesome } from '@expo/vector-icons';
import { createEventStyles as styles } from '../../styles/screens';
import { Event } from '../../services/eventService';
import { TRACK_CONDITIONS } from '../../types/performance.types';
import { AspectBannerImage } from '../media/AspectBannerImage';

interface AdditionalInfoProps {
  logo: string;
  images?: string[];
  name: string;
  location: string;
  date: Date;
  website: string;
  sponsors: string;
  meteo?: {
    trackCondition?: 'dry' | 'wet' | 'mixed' | 'damp' | 'slippery' | 'drying';
    circuitName?: string;
    expectedParticipants?: number;
  };
  participationTagText?: string;
  participationTagColor?: string;
  onInputChange: (field: keyof Event, value: any) => void;
}

const AdditionalInfo: React.FC<AdditionalInfoProps> = ({
  logo,
  images = [],
  name,
  location,
  date,
  website,
  sponsors,
  meteo,
  participationTagText,
  participationTagColor,
  onInputChange,
}) => {
  const [showTrackConditionModal, setShowTrackConditionModal] = React.useState(false);
  const [showColorModal, setShowColorModal] = React.useState(false);

  // Predefined color palette
  const colorPalette = [
    '#E10600', // Red (theme color)
    '#000000', // Black
    '#FFFFFF', // White
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#6366F1', // Indigo
    '#EF4444', // Red (lighter)
    '#14B8A6', // Teal
    '#A855F7', // Violet
    '#F43F5E', // Rose
  ];

  // Vérifier si l'événement est passé
  const isPastEvent = new Date(date) < new Date();

  const handleMeteoChange = (field: 'trackCondition' | 'circuitName' | 'expectedParticipants', value: any) => {
    const currentMeteo = meteo || {};
    const newMeteo = {
      ...currentMeteo,
      [field]: value,
    };
    onInputChange('meteo' as keyof Event, newMeteo);
  };

  const getTrackConditionDisplay = () => {
    if (!meteo?.trackCondition) return 'Select track condition';
    const condition = TRACK_CONDITIONS.find(c => c.value === meteo.trackCondition);
    return condition ? `${condition.emoji} ${condition.label}` : meteo.trackCondition;
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Additional Details</Text>
      <Text style={styles.stepDescription}>
        Final information to complete your event
      </Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Website</Text>
        <CustomTextInput
          style={styles.input as TextStyle}
          placeholder="www.example.com"
          value={website}
          onChangeText={(text) => onInputChange("website", text)}
          returnKeyType="next"
          blurOnSubmit={false}
          keyboardType="url"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sponsors</Text>
        <CustomTextInput
          style={styles.input as TextStyle}
          placeholder="Sponsor names separated by commas"
          value={sponsors}
          onChangeText={(text) => onInputChange('sponsors', text)}
          returnKeyType="next"
          blurOnSubmit={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Participation Tag</Text>
        <Text style={[styles.label, { fontSize: 12, color: '#666', marginBottom: 4 }]}>
          This tag will appear next to participants&apos; usernames on their profiles
        </Text>
        <CustomTextInput
          style={styles.input as TextStyle}
          placeholder="e.g., Karting Champion 2025"
          value={participationTagText || ''}
          onChangeText={(text) => onInputChange('participationTagText' as keyof Event, text)}
          returnKeyType="next"
          blurOnSubmit={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tag Color</Text>
        <Text style={[styles.label, { fontSize: 12, color: '#666', marginBottom: 4 }]}>
          Color of the participation tag
        </Text>
        <TouchableOpacity
          style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 } as ViewStyle, styles.input as ViewStyle]}
          onPress={() => setShowColorModal(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            {participationTagColor && /^#[0-9A-Fa-f]{6}$/.test(participationTagColor) ? (
              <>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: participationTagColor,
                    borderWidth: 1,
                    borderColor: '#ddd',
                  }}
                />
                <Text style={{ color: '#000', fontSize: 16, flex: 1 }}>
                  {participationTagColor}
                </Text>
              </>
            ) : (
              <Text style={{ color: '#999', fontSize: 16 }}>
                Select a color
              </Text>
            )}
          </View>
          <FontAwesome name="chevron-down" size={14} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Circuit Name</Text>
        <Text style={[styles.label, { fontSize: 12, color: '#666', marginBottom: 4 }]}>
          Name of the circuit/track (will pre-fill for participants)
        </Text>
        <CustomTextInput
          style={styles.input as TextStyle}
          placeholder="e.g., Circuit de Spa-Francorchamps"
          value={meteo?.circuitName || ''}
          onChangeText={(text) => {
            handleMeteoChange('circuitName' as any, text);
          }}
          returnKeyType="next"
          blurOnSubmit={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expected Participants</Text>
        <Text style={[styles.label, { fontSize: 12, color: '#666', marginBottom: 4 }]}>
          Expected number of participants (will pre-fill for participants)
        </Text>
        <CustomTextInput
          style={styles.input as TextStyle}
          placeholder="e.g., 30"
          value={meteo?.expectedParticipants != null ? String(meteo.expectedParticipants) : ''}
          onChangeText={(text) => {
            const t = text.trim();
            if (t === '') {
              handleMeteoChange('expectedParticipants' as any, undefined);
              return;
            }
            const num = parseInt(t, 10);
            if (!isNaN(num) && num >= 0 && num <= 99999) {
              handleMeteoChange('expectedParticipants' as any, num);
            }
          }}
          keyboardType="number-pad"
          returnKeyType="done"
          blurOnSubmit={true}
          maxLength={5}
        />
      </View>

      {/* Track Condition - Only visible for past events */}
      {isPastEvent && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Track Condition</Text>
          <Text style={[styles.label, { fontSize: 12, color: '#666', marginBottom: 4 }]}>
            Fill this to help participants pre-fill their performance forms
          </Text>
            <TouchableOpacity
              style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 } as ViewStyle, styles.input as ViewStyle]}
              onPress={() => setShowTrackConditionModal(true)}
            >
              <Text style={{ color: meteo?.trackCondition ? '#000' : '#999', fontSize: 16 }}>
                {getTrackConditionDisplay()}
              </Text>
              <FontAwesome name="chevron-down" size={14} color="#666" />
            </TouchableOpacity>
        </View>
      )}
      <View style={styles.previewSection}>
        <Text style={styles.title}>Preview</Text>
        <View style={styles.previewCard}>
          <AspectBannerImage
            sourceUri={images[0] || null}
            placeholder={
              <View style={[styles.previewBannerPlaceholder, { position: 'absolute' as const, left: 0, top: 0, right: 0, bottom: 0 }]}>
                <FontAwesome name="image" size={28} color="rgba(255,255,255,0.7)" />
              </View>
            }
            fallbackHeight={80}
            minHeight={60}
            maxHeight={140}
            containerStyle={{ marginBottom: 12, borderRadius: 8 }}
          />
          {logo ? (
            <Image source={{ uri: logo }} style={styles.previewLogo} />
          ) : (
            <View style={styles.previewLogoPlaceholder}>
              <FontAwesome name="calendar" size={32} color="#E53935" />
            </View>
          )}
          <Text style={styles.previewTitle}>{name || "Event Name"}</Text>
          <Text style={styles.previewInfo}>
            <FontAwesome name="map-marker" size={14} color="#666" />
            {location || "Location"}
          </Text>
          <Text style={styles.previewInfo}>
            <FontAwesome name="calendar" size={14} color="#666" />
            {date.toLocaleDateString("en-US")}
          </Text>
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>Ready to publish!</Text>
          </View>
        </View>
      </View>

      {/* Color Selection Modal */}
      <Modal
        visible={showColorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowColorModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ backgroundColor: '#fff', borderRadius: 16, width: '85%', maxWidth: 400, padding: 20 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>Select Tag Color</Text>
            </View>
            
            {/* Color Palette Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              {colorPalette.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 12,
                    backgroundColor: color,
                    borderWidth: participationTagColor === color ? 3 : 1,
                    borderColor: participationTagColor === color ? '#E10600' : '#ddd',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => {
                    onInputChange('participationTagColor' as keyof Event, color);
                    setShowColorModal(false);
                  }}
                >
                  {participationTagColor === color && (
                    <FontAwesome name="check" size={20} color={color === '#FFFFFF' ? '#000' : '#fff'} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Color Input */}
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }}>
                Or enter custom color (hex):
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CustomTextInput
                  style={[styles.input as TextStyle, { flex: 1 }]}
                  placeholder="#E10600"
                  value={participationTagColor || ''}
                  onChangeText={(text) => {
                    // Validate hex color format - allow partial input while typing
                    if (text === '' || (text.startsWith('#') && /^#[0-9A-Fa-f]{0,6}$/.test(text))) {
                      onInputChange('participationTagColor' as keyof Event, text);
                    }
                  }}
                  returnKeyType="done"
                  maxLength={7}
                />
                {participationTagColor && /^#[0-9A-Fa-f]{6}$/.test(participationTagColor) && (
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: participationTagColor,
                      borderWidth: 1,
                      borderColor: '#ddd',
                    }}
                  />
                )}
              </View>
            </View>

            <TouchableOpacity
              style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 16 }}
              onPress={() => {
                onInputChange('participationTagColor' as keyof Event, '');
                setShowColorModal(false);
              }}
            >
              <Text style={{ fontSize: 16, color: '#999', textAlign: 'center' }}>Clear</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Track Condition Modal - Simple and clean design */}
      <Modal
        visible={showTrackConditionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTrackConditionModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowTrackConditionModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ backgroundColor: '#fff', borderRadius: 16, width: '85%', maxWidth: 400 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>Select Track Condition</Text>
            </View>
            <View>
              {TRACK_CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition.value}
                  style={{
                    padding: 16,
                    borderBottomWidth: condition.value !== TRACK_CONDITIONS[TRACK_CONDITIONS.length - 1].value ? 1 : 0,
                    borderBottomColor: '#f0f0f0',
                    backgroundColor: meteo?.trackCondition === condition.value ? '#FFF5F5' : 'transparent',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => {
                    handleMeteoChange('trackCondition', condition.value);
                    setShowTrackConditionModal(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 24, marginRight: 12 }}>{condition.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: meteo?.trackCondition === condition.value ? '#E10600' : '#1E232C', fontWeight: meteo?.trackCondition === condition.value ? '600' : '400' }}>
                        {condition.label}
                      </Text>
                      {condition.description && (
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                          {condition.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  {meteo?.trackCondition === condition.value && (
                    <FontAwesome name="check" size={18} color="#E10600" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}
              onPress={() => {
                handleMeteoChange('trackCondition', undefined);
                setShowTrackConditionModal(false);
              }}
            >
              <Text style={{ fontSize: 16, color: '#999', textAlign: 'center' }}>Clear</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default AdditionalInfo;
