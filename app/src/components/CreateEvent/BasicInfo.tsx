import * as React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import CustomTextInput from '../ui/CustomTextInput';
import { FontAwesome } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from "@react-native-community/datetimepicker";
import { createEventStyles as styles } from "../../styles/screens";
import { Event } from "../../services/eventService";
import { useAuth } from "../../context/AuthContext";

interface BasicInfoProps {
  name: string;
  creators: string;
  organizers?: { userId: number | null; name: string }[];
  location: string;
  date: Date;
  onInputChange: (field: keyof Event, value: any) => void;
}

const BasicInfo: React.FC<BasicInfoProps> = ({
  name,
  creators,
  organizers = [],
  location,
  date,
  onInputChange,
}) => {
  const router = useRouter();
  const auth = useAuth();
  const currentUser = auth?.user;
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  
  // S'assurer que le créateur est toujours dans la liste
  const ensureCreatorInList = React.useCallback((orgs: { userId: number | null; name: string }[]) => {
    if (!currentUser?.id) return orgs;
    const creatorId = Number(currentUser.id);
    const creatorName = currentUser.username || currentUser.name || 'You';
    const creatorExists = orgs.some(org => org.userId === creatorId);
    if (!creatorExists) {
      return [{
        userId: creatorId,
        name: creatorName,
      }, ...orgs];
    }
    return orgs;
  }, [currentUser]);

  const [currentOrganizers, setCurrentOrganizers] = React.useState<{ userId: number | null; name: string }[]>(
    ensureCreatorInList(organizers)
  );
  const organizersRef = React.useRef<string>(JSON.stringify(organizers));
  const isInitialMount = React.useRef(true);

  const handleSelectOrganizers = async () => {
    // S'assurer que le créateur est dans la liste avant de naviguer
    const organizersWithCreator = ensureCreatorInList(currentOrganizers);
    await AsyncStorage.setItem('currentOrganizers', JSON.stringify(organizersWithCreator));
    router.push({
      pathname: '/(app)/selectOrganizers',
      params: {
        organizers: JSON.stringify(organizersWithCreator),
      },
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadSelectedOrganizers = async () => {
        try {
          const stored = await AsyncStorage.getItem('selectedOrganizers');
          if (stored) {
            const selected = JSON.parse(stored);
            const selectedWithCreator = ensureCreatorInList(selected);
            setCurrentOrganizers(selectedWithCreator);
            organizersRef.current = JSON.stringify(selectedWithCreator);
            onInputChange('organizers' as keyof Event, selectedWithCreator);
            // Nettoyer après utilisation
            await AsyncStorage.removeItem('selectedOrganizers');
          }
        } catch (e) {
          console.error('Error loading selected organizers:', e);
        }
      };
      loadSelectedOrganizers();
    }, [onInputChange, ensureCreatorInList])
  );

  // Ne mettre à jour que si les organisateurs ont réellement changé (comparaison par référence JSON)
  React.useEffect(() => {
    // Ignorer la première exécution (mount initial)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const organizersStr = JSON.stringify(organizers);
    if (organizersRef.current !== organizersStr) {
      organizersRef.current = organizersStr;
      setCurrentOrganizers(organizers);
    }
  }, [organizers]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      onInputChange("date", selectedDate);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepDescription}>
        Let&apos;s start with the essential details of your event
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Name*</Text>
        <CustomTextInput
          style={styles.input}
          placeholder="Enter event name"
          value={name}
          onChangeText={(text) => onInputChange("name", text)}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => {}}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Organizers</Text>
        <TouchableOpacity
          style={[styles.input, { justifyContent: 'center', minHeight: 50 }]}
          onPress={handleSelectOrganizers}
        >
          {currentOrganizers.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {currentOrganizers.map((org, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: '#E10600',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                    {org.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#999' }}>Tap to select organizers</Text>
          )}
          <FontAwesome name="chevron-right" size={16} color="#666" style={{ position: 'absolute', right: 12 }} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location*</Text>
        <CustomTextInput
          style={styles.input}
          placeholder="Enter event location"
          value={location}
          onChangeText={(text) => onInputChange("location", text)}
          returnKeyType="done"
          blurOnSubmit={true}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date*</Text>
        <TouchableOpacity 
          style={styles.datePicker}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{date.toLocaleDateString('en-US')}</Text>
          <FontAwesome name="calendar" size={20} color="#666" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    </View>
  );
};

export default BasicInfo; 