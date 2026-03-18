import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import userService from '@/services/userService';

interface UsernameWithTagProps {
  username: string;
  userId?: number;
  usernameStyle?: any;
  tagStyle?: any;
}

const UsernameWithTag: React.FC<UsernameWithTagProps> = ({
  username,
  userId,
  usernameStyle,
  tagStyle,
}) => {
  const router = useRouter();
  const [tag, setTag] = useState<{ text: string; color: string; isOrganizer?: boolean; eventId?: number } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchTag = async () => {
      try {
        const response = await userService.getNextEventTag(userId);
        if (response.success && response.data?.tag && response.data?.event) {
          setTag({
            ...response.data.tag,
            eventId: response.data.event.id,
          });
        }
      } catch (error) {
        console.error('Error fetching tag for username:', error);
      }
    };

    fetchTag();
  }, [userId]);

  const handleTagPress = () => {
    if (tag?.eventId) {
      router.push({
        pathname: '/(app)/eventDetail',
        params: { eventId: tag.eventId.toString() },
      });
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <Text style={usernameStyle}>{username}</Text>
      {tag && (
        <TouchableOpacity
          onPress={handleTagPress}
          activeOpacity={0.7}
          disabled={!tag.eventId}
        >
          <View
            style={[
              {
                backgroundColor: tag.color,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              },
              tagStyle,
            ]}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {tag.isOrganizer ? `Organizer of ${tag.text}` : tag.text}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UsernameWithTag;
