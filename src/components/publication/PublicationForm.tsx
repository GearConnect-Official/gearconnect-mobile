import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { publicationStyles as styles } from '@/styles/screens';
import {
  publicationFormStyles,
  MAX_DESCRIPTION_LENGTH,
  SUGGESTED_TAGS,
} from '@/styles/components/publicationFormStyles';
import theme from '@/theme';
import CloudinaryMedia from '@/components/media/CloudinaryMedia';

const SCREEN_WIDTH = Dimensions.get("window").width;

interface PublicationFormProps {
  imageUri: string;
  username: string;
  userAvatar: string;
  title: string;
  description: string;
  tags: string[];
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setTags: (tags: string[]) => void;
  isLoading?: boolean;
  mediaType?: "image" | "video";
  publicId?: string;
}

const PublicationForm: React.FC<PublicationFormProps> = ({
  imageUri,
  username,
  userAvatar,
  title,
  description,
  tags,
  setTitle,
  setDescription,
  setTags,
  isLoading = false,
  mediaType,
  publicId,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [tagInput, setTagInput] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Debug logs
  console.log("PublicationForm rendered with:", {
    tags: tags,
    tagsLength: tags.length,
    setTagsType: typeof setTags,
    isLoading: isLoading,
    tagInput: tagInput,
    tagInputTrimmed: tagInput.trim(),
    buttonDisabled: isLoading || !tagInput.trim(),
  });

  const handleAddTag = () => {
    console.log("=== handleAddTag DEBUT ===");
    console.log("tagInput raw:", JSON.stringify(tagInput));
    console.log("tagInput length:", tagInput.length);
    console.log("tagInput trimmed:", JSON.stringify(tagInput.trim()));
    console.log("tagInput trimmed length:", tagInput.trim().length);
    console.log("current tags:", JSON.stringify(tags));
    console.log("tag already exists?", tags.includes(tagInput.trim()));

    const trimmedInput = tagInput.trim();
    if (trimmedInput && !tags.includes(trimmedInput)) {
      console.log("✅ CONDITIONS REMPLIES - Adding tag:", trimmedInput);
      const newTags = [...tags, trimmedInput];
      console.log("New tags array:", JSON.stringify(newTags));
      setTags(newTags);
      setTagInput("");
      console.log("✅ setTags called and tagInput cleared");
    } else {
      console.log("❌ CONDITIONS NON REMPLIES:", {
        hasContent: !!trimmedInput,
        contentLength: trimmedInput.length,
        notAlreadyIncluded: !tags.includes(trimmedInput),
        currentTags: tags,
        inputValue: trimmedInput,
      });
    }
    console.log("=== handleAddTag FIN ===");
  };

  const handleRemoveTag = (index: number) => {
    console.log("handleRemoveTag called with index:", index);
    const newTags = [...tags];
    newTags.splice(index, 1);
    console.log("New tags after removal:", newTags);
    setTags(newTags);
  };

  const handleAddSuggestedTag = (tag: string) => {
    console.log("handleAddSuggestedTag called with:", tag);
    if (!tags.includes(tag)) {
      console.log("Adding suggested tag:", tag);
      setTags([...tags, tag]);
    } else {
      console.log("Suggested tag already exists:", tag);
    }
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const descriptionCharactersLeft = MAX_DESCRIPTION_LENGTH - description.length;
  const isDescriptionLimitWarning = descriptionCharactersLeft <= 50;
  const filteredSuggestions = SUGGESTED_TAGS.filter(
    (tag) =>
      !tags.includes(tag) && tag.toLowerCase().includes(tagInput.toLowerCase())
  );

  if (isPreviewMode) {
    return (
      <View style={styles.formContainer}>
        <View style={publicationFormStyles.previewHeader}>
          <Text style={publicationFormStyles.previewTitle}>Post Preview</Text>
          <TouchableOpacity
            style={publicationFormStyles.previewCloseButton}
            onPress={togglePreviewMode}
          >
            <FontAwesome
              name="edit"
              size={18}
              color={theme.colors.primary.main}
            />
            <Text style={publicationFormStyles.previewCloseText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView>
          <View style={styles.formImagePreview}>
            {publicId ? (
              <CloudinaryMedia
                publicId={publicId}
                mediaType={mediaType || "auto"}
                width={SCREEN_WIDTH}
                height={SCREEN_WIDTH}
                quality="auto:best"
                crop="fill"
                style={styles.formImagePreview}
                fallbackUrl={imageUri}
                shouldPlay={mediaType === "video"}
                isMuted={true}
                useNativeControls={mediaType === "video"}
                isLooping={mediaType === "video"}
              />
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={styles.formImagePreview}
                resizeMode="cover"
              />
            )}
          </View>

          <View style={publicationFormStyles.previewContent}>
            <View style={publicationFormStyles.previewUserInfo}>
              <Image source={{ uri: userAvatar }} style={styles.userAvatar} />
              <Text style={styles.headerText}>{username}</Text>
            </View>

            <Text style={publicationFormStyles.previewPostTitle}>
              {title || "Untitled"}
            </Text>

            {description ? (
              <Text style={publicationFormStyles.previewDescription}>
                {description}
              </Text>
            ) : (
              <Text style={publicationFormStyles.previewNoContent}>
                No description
              </Text>
            )}

            {tags.length > 0 ? (
              <View style={publicationFormStyles.previewTags}>
                {tags.map((tag, index) => (
                  <Text key={index} style={publicationFormStyles.previewTag}>
                    #{tag}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={publicationFormStyles.previewNoContent}>
                No tags
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.formContainer}
        contentContainerStyle={{ paddingBottom: (50) }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formImagePreview}>
          {publicId ? (
            <CloudinaryMedia
              publicId={publicId}
              mediaType={mediaType || "auto"}
              width={SCREEN_WIDTH}
              height={SCREEN_WIDTH}
              quality="auto:best"
              crop="fill"
              style={styles.formImagePreview}
              fallbackUrl={imageUri}
              shouldPlay={mediaType === "video"}
              isMuted={true}
              useNativeControls={mediaType === "video"}
              isLooping={mediaType === "video"}
            />
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.formImagePreview}
              resizeMode="cover"
            />
          )}
          {/* Debug info */}
          <Text style={publicationFormStyles.debugInfo}>
            {mediaType || "unknown"}{" "}
            {publicId ? `(${publicId})` : "(no publicId)"}
          </Text>
        </View>

        <View style={styles.formContent}>
          <View style={styles.userInfoContainer}>
            <TouchableOpacity
              style={publicationFormStyles.previewButton}
              onPress={togglePreviewMode}
              disabled={isLoading}
            >
              <FontAwesome
                name="eye"
                size={16}
                color={theme.colors.primary.main}
              />
              <Text style={publicationFormStyles.previewButtonText}>
                Preview
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={publicationFormStyles.inputSection}>
              <Text style={publicationFormStyles.inputLabel}>Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter your title"
                placeholderTextColor={theme.colors.text.secondary}
                value={title}
                onChangeText={setTitle}
                editable={!isLoading}
                maxLength={100}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 550, animated: true }), 100)}
              />
            </View>

            <View style={publicationFormStyles.inputSection}>
              <View style={publicationFormStyles.labelRow}>
                <Text style={publicationFormStyles.inputLabel}>
                  Description
                </Text>
                <Text
                  style={[
                    publicationFormStyles.charCounter,
                    isDescriptionLimitWarning &&
                      publicationFormStyles.charCounterWarning,
                  ]}
                >
                  {descriptionCharactersLeft}
                </Text>
              </View>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Write your description"
                placeholderTextColor={theme.colors.text.secondary}
                value={description}
                onChangeText={(text) =>
                  setDescription(text.slice(0, MAX_DESCRIPTION_LENGTH))
                }
                multiline
                editable={!isLoading}
                onFocus={() => setTimeout(() => scrollViewRef.current?.scrollTo({ y: 650, animated: true }), 100)}
              />
              <Text style={publicationFormStyles.helperText}>
                Share details about your photo, the circuit, the event...
              </Text>
            </View>

            <View style={publicationFormStyles.inputSection}>
              <Text style={publicationFormStyles.inputLabel}>Tags</Text>

              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <View key={index} style={styles.tagItem}>
                      <Text style={styles.tagText}>#{tag}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveTag(index)}
                        disabled={isLoading}
                      >
                        <FontAwesome
                          name="times"
                          size={14}
                          color={theme.colors.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add tags"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={tagInput}
                  onChangeText={(text) => {
                    console.log(
                      "🔄 Tag input changed to:",
                      JSON.stringify(text)
                    );
                    console.log("🔄 Text length:", text.length);
                    setTagInput(text);
                    console.log(
                      "🔄 setTagInput called with:",
                      JSON.stringify(text)
                    );
                  }}
                  onSubmitEditing={() => {
                    console.log("Tag input submitted");
                    handleAddTag();
                  }}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.addTagButton,
                  (!tagInput.trim() || isLoading) &&
                    publicationFormStyles.disabledButton,
                ]}
                onPress={() => {
                  console.log("Add tag button pressed");
                  handleAddTag();
                }}
                disabled={isLoading || !tagInput.trim()}
              >
                <Text style={styles.addTagButtonText}>Add</Text>
              </TouchableOpacity>

              {tagInput.trim() && filteredSuggestions.length > 0 ? (
                <View style={publicationFormStyles.suggestionsContainer}>
                  <Text style={publicationFormStyles.suggestionsTitle}>
                    Suggestions:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={publicationFormStyles.suggestionsList}>
                      {filteredSuggestions.map((tag, index) => (
                        <TouchableOpacity
                          key={index}
                          style={publicationFormStyles.suggestionTag}
                          onPress={() => handleAddSuggestedTag(tag)}
                          disabled={isLoading}
                        >
                          <Text style={publicationFormStyles.suggestionTagText}>
                            #{tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ) : !tagInput.trim() ? (
                <View style={publicationFormStyles.suggestionsContainer}>
                  <Text style={publicationFormStyles.suggestionsTitle}>
                    Popular tags:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={publicationFormStyles.suggestionsList}>
                      {SUGGESTED_TAGS.filter((tag) => !tags.includes(tag))
                        .slice(0, 8)
                        .map((tag, index) => (
                          <TouchableOpacity
                            key={index}
                            style={publicationFormStyles.suggestionTag}
                            onPress={() => handleAddSuggestedTag(tag)}
                            disabled={isLoading}
                          >
                            <Text
                              style={publicationFormStyles.suggestionTagText}
                            >
                              #{tag}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </View>

          {isLoading && (
            <View style={publicationFormStyles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary.main}
              />
              <Text style={publicationFormStyles.loadingText}>
                Publishing...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PublicationForm;
