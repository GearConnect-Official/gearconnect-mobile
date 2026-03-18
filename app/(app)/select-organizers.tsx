import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL_USERS } from '@/config';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import { useAuth } from '@/context/AuthContext';

interface Organizer {
  userId: number | null;
  name: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  profilePicture?: string;
  profilePicturePublicId?: string;
}

const SelectOrganizersScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = useAuth();
  const currentUser = auth?.user;
  const creatorId = currentUser?.id ? Number(currentUser.id) : null;
  const creatorName = currentUser?.username || currentUser?.name || 'You';
  
  const initialOrganizers = params.organizers
    ? JSON.parse(params.organizers as string)
    : [];

  // S'assurer que le créateur est toujours dans la liste
  const ensureCreatorInList = (organizers: Organizer[]): Organizer[] => {
    if (!creatorId) return organizers;
    const creatorExists = organizers.some(org => org.userId === creatorId);
    if (!creatorExists) {
      return [{
        userId: creatorId,
        name: creatorName,
      }, ...organizers];
    }
    return organizers;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState<Organizer[]>(
    ensureCreatorInList(initialOrganizers)
  );
  const [externalOrganizers, setExternalOrganizers] = useState<string[]>([]);
  const [externalInput, setExternalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout if it exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length > 0) {
      const timeout = setTimeout(() => {
        searchUsers(searchQuery);
      }, 500);
      searchTimeoutRef.current = timeout;
      return () => {
        clearTimeout(timeout);
        searchTimeoutRef.current = null;
      };
    } else {
      setUsers([]);
      searchTimeoutRef.current = null;
    }
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL_USERS}/search?query=${encodeURIComponent(query)}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addUserOrganizer = (user: User) => {
    const organizer: Organizer = {
      userId: user.id,
      name: user.username || user.name,
    };
    if (
      !selectedOrganizers.some(
        (o) => o.userId === organizer.userId && o.userId !== null
      )
    ) {
      setSelectedOrganizers([...selectedOrganizers, organizer]);
    }
    setSearchQuery('');
    setUsers([]);
  };

  const addExternalOrganizer = () => {
    const trimmed = externalInput.trim();
    if (trimmed && !externalOrganizers.includes(trimmed)) {
      setExternalOrganizers([...externalOrganizers, trimmed]);
      const organizer: Organizer = {
        userId: null,
        name: trimmed,
      };
      setSelectedOrganizers([...selectedOrganizers, organizer]);
      setExternalInput('');
    }
  };

  const removeOrganizer = (index: number) => {
    const organizer = selectedOrganizers[index];
    // Ne pas permettre de supprimer le créateur
    if (organizer.userId === creatorId) {
      return;
    }
    if (organizer.userId === null) {
      setExternalOrganizers(
        externalOrganizers.filter((name) => name !== organizer.name)
      );
    }
    setSelectedOrganizers(selectedOrganizers.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // S'assurer que le créateur est toujours dans la liste avant de sauvegarder
    const finalOrganizers = ensureCreatorInList(selectedOrganizers);
    // Sauvegarder les organisateurs sélectionnés dans AsyncStorage
    await AsyncStorage.setItem('selectedOrganizers', JSON.stringify(finalOrganizers));
    router.back();
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedOrganizers.some(
      (o) => o.userId === item.id && o.userId !== null
    );

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          backgroundColor: isSelected ? '#FFF5F5' : '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        }}
        onPress={() => !isSelected && addUserOrganizer(item)}
        disabled={isSelected}
      >
        {item.profilePicturePublicId ? (
          <CloudinaryAvatar
            publicId={item.profilePicturePublicId}
            size={40}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
            }}
            fallbackUrl={item.profilePicture}
          />
        ) : item.profilePicture ? (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f0f0f0',
            }}
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <FontAwesome name="user" size={20} color="#999" />
          </View>
        )}
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
            {item.username || item.name}
          </Text>
          {item.name !== item.username && (
            <Text style={{ fontSize: 14, color: '#666' }}>{item.name}</Text>
          )}
        </View>
        {isSelected && (
          <FontAwesome name="check-circle" size={20} color="#E10600" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <FontAwesome name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '600', flex: 1 }}>
          Select Organizers
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: '#E10600',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Search Users
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            paddingHorizontal: 12,
            backgroundColor: '#f9f9f9',
          }}
        >
          <FontAwesome name="search" size={16} color="#999" />
          <TextInput
            style={{
              flex: 1,
              padding: 12,
              fontSize: 16,
            }}
            placeholder="Search by username..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {isLoading && <ActivityIndicator size="small" color="#E10600" />}
        </View>
      </View>

      {searchQuery.length > 0 && (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          style={{ flex: 1 }}
          ListEmptyComponent={
            !isLoading ? (
              <View
                style={{
                  padding: 32,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#999' }}>No users found</Text>
              </View>
            ) : null
          }
        />
      )}

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Add External Organizer
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 8,
            paddingHorizontal: 12,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              padding: 12,
              fontSize: 16,
            }}
            placeholder="Enter name (not on GearConnect)"
            value={externalInput}
            onChangeText={setExternalInput}
            onSubmitEditing={addExternalOrganizer}
          />
          <TouchableOpacity
            onPress={addExternalOrganizer}
            style={{
              backgroundColor: '#E10600',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              marginLeft: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectedOrganizers.length > 0 && (
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
            Selected Organizers ({selectedOrganizers.length})
          </Text>
          {selectedOrganizers.map((organizer, index) => {
            const isCreator = organizer.userId === creatorId;
            return (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: isCreator ? '#FFF5F5' : '#f9f9f9',
                  borderRadius: 8,
                  marginBottom: 8,
                  borderWidth: isCreator ? 1 : 0,
                  borderColor: isCreator ? '#E10600' : 'transparent',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500' }}>
                    {organizer.name}
                    {isCreator && (
                      <Text style={{ color: '#E10600', fontSize: 12, fontWeight: '600' }}> (Creator)</Text>
                    )}
                    {organizer.userId === null && (
                      <Text style={{ color: '#666', fontSize: 12 }}> (External)</Text>
                    )}
                  </Text>
                </View>
                {!isCreator && (
                  <TouchableOpacity onPress={() => removeOrganizer(index)}>
                    <FontAwesome name="times-circle" size={20} color="#E10600" />
                  </TouchableOpacity>
                )}
                {isCreator && (
                  <FontAwesome name="lock" size={16} color="#999" style={{ marginLeft: 8 }} />
                )}
              </View>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
};

export default SelectOrganizersScreen;
