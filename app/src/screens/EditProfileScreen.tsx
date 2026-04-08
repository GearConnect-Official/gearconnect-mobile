import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import CustomTextInput from "../components/ui/CustomTextInput";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from "expo-router";
import userService from "../services/userService";
import styles from "../styles/Profile/editProfileStyles";
import { useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import MessageService from "../services/messageService";
import ProfilePictureUpload from "../components/Profile/ProfilePictureUpload";
import { trackProfile, trackScreenView } from "../utils/mixpanelTracking";

interface FormData {
  username: string;
  name: string;
  description: string;
  profilePicture: string;
  profilePicturePublicId?: string;
}

const EditProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, updateUser } = useAuth() || {};
  const { showMessage, showError } = useMessage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<FormData>({
    username: "",
    name: "",
    description: "",
    profilePicture: "",
    profilePicturePublicId: "",
  });

  useEffect(() => {
    trackScreenView('Edit Profile');
    
    if (!user?.id) {
      showError("You must be logged in to edit your profile");
      router.back();
      return;
    }
    fetchUserProfile();
  }, [user?.id]);

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await userService.getProfile(Number(user.id));
      if (response.success && response.data) {
        setFormData({
          username: response.data.username || "",
          name: response.data.name || "",
          description: response.data.description || "",
          profilePicture: response.data.profilePicture || "",
          profilePicturePublicId: response.data.profilePicturePublicId || "",
        });
      } else {
        setError(response.error || "Failed to load profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureUpload = async (cloudinaryUrl: string, publicId: string) => {
    try {
      setError(null);
      console.log('🔄 EditProfileScreen: Updating profile picture...', {
        cloudinaryUrl,
        publicId,
        userId: user?.id
      });

      const response = await userService.updateProfilePictureCloudinary(
        Number(user?.id),
        cloudinaryUrl,
        publicId
      );

      console.log('📸 EditProfileScreen: Profile picture update response:', response);
      
      // Track profile picture update
      if (response.success && response.data) {
        trackProfile.pictureUpdated();
      }

      if (response.success && response.data) {
        // Mettre à jour le formData local
        setFormData((prev) => ({
          ...prev,
          profilePicture: cloudinaryUrl,
          profilePicturePublicId: publicId,
        }));

        // Mettre à jour le contexte d'authentification si disponible
        if (updateUser) {
          updateUser({
            ...user,
            profilePicture: cloudinaryUrl,
            profilePicturePublicId: publicId,
          });
        }

        // Rafraîchir les données du profil depuis le serveur
        await fetchUserProfile();

        console.log('✅ EditProfileScreen: Profile picture updated successfully');
      } else {
        console.error('❌ EditProfileScreen: Failed to update profile picture:', response.error);
        setError(response.error || "Failed to update profile picture");
      }
    } catch (error: any) {
      console.error("❌ EditProfileScreen: Error updating profile picture:", error);
      setError("An unexpected error occurred while updating profile picture");
    }
  };

  const handleProfilePictureError = (error: string) => {
    setError(error);
  };

  const validateForm = async () => {
    if (!user?.id) {
      setError("You must be logged in to edit your profile");
      return false;
    }

    try {
      const response = await userService.getProfile(Number(user.id));
      const currentData =
        response.success && response.data ? response.data : null;

      if (currentData) {
        const hasChanges =
          formData.username !== (currentData.username || "") ||
          formData.name !== (currentData.name || "") ||
          formData.description !== (currentData.description || "");

        if (!hasChanges) {
          setIsLoading(false);
          router.back();
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("Error validating form:", error);
      return true;
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError("You must be logged in to edit your profile");
      return;
    }

    setIsLoading(true);
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const updateResponse = await userService.updateProfile(Number(user.id), {
        username: formData.username || undefined,
        name: formData.name || undefined,
        description: formData.description || undefined,
      });

      setIsLoading(false);

      if (updateResponse.success) {
        // Track profile edit - determine which fields changed
        const changedFields: string[] = [];
        if (formData.username) changedFields.push('username');
        if (formData.name) changedFields.push('name');
        if (formData.description) changedFields.push('description');
        if (changedFields.length > 0) {
          trackProfile.edited(changedFields);
        }
        
        if (updateUser) {
          updateUser({
            username: formData.username || null,
            name: formData.name || null,
          });
        }

        await fetchUserProfile();
        showMessage(MessageService.SUCCESS.PROFILE_UPDATED);
      } else {
        setError(updateResponse.error || "Failed to update profile");
        showError(updateResponse.error || "Failed to update profile");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error updating profile:", error);
      setError("An unexpected error occurred while updating the profile");
      showError("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E10600" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 40}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.form}>
          <ProfilePictureUpload
            currentProfilePicture={formData.profilePicture}
            currentPublicId={formData.profilePicturePublicId}
            onUploadComplete={handleProfilePictureUpload}
            onUploadError={handleProfilePictureError}
            userId={Number(user?.id)}
            size={120}
          />

          <View style={styles.formSection}>
            <Text style={styles.label}>Username</Text>
            <CustomTextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, username: text }))
              }
              placeholder="Enter your username"
              onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 400, animated: true }), 100)}
            />

            <Text style={styles.label}>Name</Text>
            <CustomTextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, name: text }))
              }
              placeholder="Enter your name"
              onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 500, animated: true }), 100)}
            />

            <Text style={styles.label}>Bio</Text>
            <CustomTextInput
              style={[styles.input, styles.bioInput]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, description: text }))
              }
              placeholder="Write something about yourself"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 600, animated: true }), 100)}
            />
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
