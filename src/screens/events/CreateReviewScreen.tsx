import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import styles from "@/styles/reviewStyles";
import { useAuth } from "@/context/AuthContext";
import eventService from "@/services/eventService";
import { SafeAreaView } from "react-native-safe-area-context";

const CreateReviewScreen: React.FC = () => {
  const auth = useAuth();
  if (!auth) {
    throw new Error("CreateReviewScreen must be used within AuthProvider.");
  }
  const { user } = auth;
  const router = useRouter();
  const { eventId: eventIdParam } = useLocalSearchParams<{
    eventId?: string | string[];
  }>();
  const eventIdValue = Array.isArray(eventIdParam)
    ? Number(eventIdParam[0])
    : Number(eventIdParam);
  const eventId = Number.isFinite(eventIdValue) ? eventIdValue : undefined;
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const maxReviewLength = 190;
  const isSubmitDisabled = !reviewText.trim() || rating === 0 || loading;

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    console.log("Submitting review:", { eventId, reviewText, rating });
    if (!eventId) {
      setError("Missing event information. Please reopen this screen.");
      setLoading(false);
      return;
    }
    if (!reviewText.trim()) {
      setError("Please enter a review text.");
      setLoading(false);
      return;
    }
    if (reviewText.length > maxReviewLength) {
      setError(`Review text cannot exceed ${maxReviewLength} characters.`);
      setLoading(false);
      return;
    }
    if (!rating) {
      setError("Please select a rating.");
      setLoading(false);
      return;
    }
    if (!user || !user.id) {
      setError("User not authenticated. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const reviewData = {
        eventId,
        userId: user.id,
        note: rating,
        description: reviewText,
      };
      const createdReview = await eventService.createEventReview(reviewData);
      console.log("Review created successfully:", createdReview);
      router.back();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      setError("Error submitting review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Star rating component
  const RatingSelector = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Your Rating:</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <FontAwesome
                name={rating >= star ? "star" : "star-o"}
                size={30}
                color={rating >= star ? "#FFD700" : "#aaa"}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.titleBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <FontAwesome name="arrow-left" size={24} color="#1E232C" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Review</Text>
          <View style={styles.placeholderRight} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.reviewContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1}}
          keyboardShouldPersistTaps="handled"
        >
        <View>
          <RatingSelector />
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder={`Write your review here... (max ${maxReviewLength} characters)`}
              placeholderTextColor="#A0A0A0"
              multiline={true}
              value={reviewText}
              onChangeText={setReviewText}
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={maxReviewLength}
            />
            <Text style={styles.characterCounter}>
              {reviewText.length}/{maxReviewLength}
            </Text>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitDisabled && styles.disabledButton,
          ]}
          onPress={onSubmit}
          disabled={isSubmitDisabled}
        >
          <Text style={styles.submitButtonText}>
            {loading
              ? "Posting Review..."
              : reviewText.trim() && rating > 0
              ? "Post Review"
              : "Add Rating & Review"}
          </Text>
          {reviewText.trim() && rating > 0 && !loading && (
            <FontAwesome
              name="paper-plane"
              size={16}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateReviewScreen;
