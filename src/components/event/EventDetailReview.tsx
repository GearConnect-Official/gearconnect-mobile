import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { eventDetailStyles as styles } from '@/styles/screens';
import { EventInterface } from '@/services/EventInterface';

// Create a star rating component
const StarRating: React.FC<{ rating: number; maxRating?: number }> = ({
  rating,
  maxRating = 5,
}) => {
  return (
    <View style={styles.starContainer}>
      {Array.from({ length: maxRating }).map((_, index) => (
        <Ionicons
          key={`star-${index}`}
          name={index < rating ? 'star' : 'star-outline'}
          size={14}
          color={index < rating ? '#FFD700' : '#aaa'}
          style={{ marginHorizontal: 1 }}
        />
      ))}
    </View>
  );
};

// Create a separate functional component for review items
const ReviewItem: React.FC<{
  item: EventInterface['reviews'][0];
  isCurrentUserReview?: boolean;
}> = ({ item, isCurrentUserReview = false }) => {
  const router = useRouter();
  const [showFullText, setShowFullText] = useState(false);
  const [textExceedsLimit, setTextExceedsLimit] = useState(false);
  const maxLines = 3;
  const description = item.description || '';

  const handleProfilePress = () => {
    if (item.userId) {
      router.push({
        pathname: '/userProfile',
        params: { userId: item.userId.toString() },
      });
    }
  };

  React.useEffect(() => {
    if (description.length > 120) {
      setTextExceedsLimit(true);
    }
  }, [description]);
  
  const cardStyle = showFullText 
    ? [styles.reviewCard, { minHeight: 150, maxHeight: 300 }] 
    : styles.reviewCard;

  const onTextLayout = (e: any) => {
    const { lines } = e.nativeEvent;
    if (lines && lines.length > maxLines) {
      setTextExceedsLimit(true);
    }
  };

  return (
    <View style={cardStyle}>
      <View style={styles.reviewHeader}>
        <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
          <Image
            source={
              item.avatar
                ? { uri: item.avatar }
                : require('@/assets/images/logo-rounded.png')
            }
            style={styles.reviewAvatar}
          />
        </TouchableOpacity>
        <View style={styles.reviewUserInfo}>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
            <Text style={styles.reviewUser}>{item.username}</Text>
          </TouchableOpacity>
          <StarRating rating={item.note} />
        </View>
      </View>
      <Text 
        style={styles.reviewDescription}
        numberOfLines={showFullText ? undefined : maxLines}
        ellipsizeMode="tail"
        onTextLayout={onTextLayout}
      >
        {description}
      </Text>
      {textExceedsLimit && (
        <TouchableOpacity
          onPress={() => setShowFullText(!showFullText)}
          style={styles.showMoreButton}
        >
          <Text style={styles.showMoreButtonText}>
            {showFullText ? 'Show less' : 'Show more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface EventDetailReviewProps {
  eventId: string | number;
  reviews: EventInterface['reviews'];
  userReview: EventInterface['reviews'][0] | null;
  user: any;
  isOrganizer: boolean;
}

const EventDetailReview: React.FC<EventDetailReviewProps> = ({
  eventId,
  reviews,
  userReview,
  user,
  isOrganizer,
}) => {
  const hasReviews = reviews && reviews.length > 0;
  
  function handleReviewPress(): void {
    if (userReview) {
      if (user?.id !== undefined && user?.id !== null) {
        const userId = Number(user.id);
        router.push({
          pathname: '/(app)/modifyEventReview',
          params: { eventId, userId },
        });
      }
    } else {
      router.push({
        pathname: '/(app)/createEventReview',
        params: { eventId },
      });
    }
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Reviews</Text>

      {!hasReviews ? (
        <View style={styles.noReviewsContainer}>
          <Text style={styles.noReviewsText}>
            {isOrganizer
              ? 'No users have reviewed your event yet.'
              : 'No reviews yet. Be the first to leave a review!'}
          </Text>
          {!isOrganizer && (
            <TouchableOpacity
              style={styles.createReviewButton}
              onPress={handleReviewPress}
            >
              <Text style={styles.createReviewButtonText}>Write a Review</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          horizontal
          data={reviews}
          keyExtractor={(item, index) => `review-index-${index}`}
          renderItem={({ item }) => (
            <ReviewItem
              item={item}
              isCurrentUserReview={
                userReview !== null && item.userId === userReview.userId
              }
            />
          )}
        />
      )}
    </View>
  );
};

export default EventDetailReview;