import React, { useState, useEffect } from "react";
import { View, Alert, StatusBar } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import styles from "@/styles/screens/social/publicationStyles";
import postService from "@/services/postService";
import FeedbackMessage, {
  FeedbackType,
} from "@/components/ui/FeedbackMessage";
import { useAuth } from "@/context/AuthContext";
import { CloudinaryUploadResponse } from "@/services/cloudinary.service";
import { useMessage } from "@/context/MessageContext";
import { QuickMessages } from "@/utils/messageUtils";
import { trackPost, trackScreenView } from "@/utils/mixpanelTracking";
import Header from "@/components/publication/Header";
import MediaSection from "@/components/publication/MediaSection";
import PublicationForm from "@/components/publication/PublicationForm";

/**
 * Écran de publication de post
 *
 * TODO: Fonctionnalités à implémenter dans les prochaines itérations:
 * 1. Gestion des images: intégration complète avec Cloudinary pour le stockage et l'optimisation
 *
 * Implémentation actuelle:
 * - Création de posts avec titre et description
 * - Upload automatique vers Cloudinary avec optimisation
 * - Gestion des tags: implémentation côté client qui crée les tags et tente de les associer aux posts
 * - URLs optimisées pour les images avec transformations automatiques
 */

const PublicationScreen: React.FC = () => {
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImagePublicId, setSelectedImagePublicId] = useState<
    string | null
  >(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resourceType, setResourceType] = useState<string>("image");
  const [feedback, setFeedback] = useState({
    visible: false,
    message: "",
    type: FeedbackType.SUCCESS,
  });

  const [username, setUsername] = useState("Username");
  const [userAvatar, setUserAvatar] = useState(
    "https://via.placeholder.com/32"
  );
  const { showMessage, showError, showConfirmation } = useMessage();

  // Track screen view
  useEffect(() => {
    trackScreenView('Create Post');
  }, []);

  // Mettre à jour les informations utilisateur lorsqu'ils sont disponibles
  useEffect(() => {
    if (user) {
      setUsername(user.username || "Username");
      setUserAvatar(user.photoURL || "https://via.placeholder.com/32");
    }
  }, [user]);

  const handleGoBack = () => {
    if (step !== "select") {
      Alert.alert(
        "Discard Post?",
        "If you go back now, you will lose your post.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setSelectedImage(null);
              setTitle("");
              setDescription("");
              setTags([]);
              setStep("select");
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const hideFeedback = () => {
    setFeedback((prev) => ({ ...prev, visible: false }));
  };

  const handleShare = async () => {
    const imageToShare =  selectedImage;

    if (!imageToShare || !title.trim()) {
      showError("Please add an image and title");
      return;
    }

    if (!user) {
      showError("You must be logged in to create a post");
      return;
    }

    try {
      setIsLoading(true);

      // Objet post avec informations Cloudinary
      const newPost = {
        title: title,
        body: description,
        userId: typeof user.id === "string" ? parseInt(user.id, 10) : user.id,
        // Inclure les informations Cloudinary directement
        cloudinaryUrl: imageToShare,
        cloudinaryPublicId: selectedImagePublicId || undefined,
        // Métadonnées pour l'optimisation (en JSON string)
        imageMetadata: JSON.stringify({
          originalUrl: selectedImage,
          optimizedUrl: imageToShare,
          publicId: selectedImagePublicId,
          uploadedAt: new Date().toISOString(),
          resource_type: resourceType,
          format: resourceType === "video" ? "mp4" : "auto",
          mediaType: resourceType,
        }),
      };

      console.log("Sending post data with Cloudinary info:", newPost);
      console.log("With tags:", tags);

      // Appeler l'API pour créer le post avec les tags
      const createdPost = await postService.createPostWithTags(newPost, tags);
      
      // Track post creation
      const postId = createdPost?.id?.toString() || 'unknown';
      const hasImage = resourceType === 'image';
      const hasVideo = resourceType === 'video';
      trackPost.created(postId, hasImage, hasVideo, tags.length);

      // Réinitialiser le formulaire
      setSelectedImage(null);
      setSelectedImagePublicId(null);
      setTitle("");
      setDescription("");
      setTags([]);
      setStep("select");

      showMessage(
        QuickMessages.success(
          "Post created successfully with optimized images!"
        )
      );

      // Rediriger vers la page d'accueil après un court délai
      setTimeout(() => {
        router.replace("/(app)/(tabs)");
      }, 1500);
    } catch (error) {
      console.error("Error creating post:", error);
      showError("Failed to create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelected = (
    cloudinaryResponse: CloudinaryUploadResponse
  ) => {
    console.log("📸 Media selected from Cloudinary:", {
      resource_type: cloudinaryResponse.resource_type,
      format: cloudinaryResponse.format,
      secure_url: cloudinaryResponse.secure_url,
      public_id: cloudinaryResponse.public_id,
    });

    setSelectedImage(cloudinaryResponse.secure_url);
    setSelectedImagePublicId(cloudinaryResponse.public_id);

    // Stocker le type de ressource pour les métadonnées
    const resourceType = cloudinaryResponse.resource_type || "image";
    setResourceType(resourceType);
    console.log("📸 Resource type set to:", resourceType);

    // Aller directement au formulaire (plus d'étape crop)
    console.log("📸 Media selected, going to form");
    setStep("form");
  };

  const handleNext = () => {
    if (step === "select") {
      if (!selectedImage) {
        showError("Please select an image first");
        return;
      }
      setStep("form");
    }
  };

  const handleBack = () => {
    switch (step) {
      case "form":
        setStep("select");
        break;
      default:
        handleGoBack();
    }
  };

  const handleTagsChange = (newTags: string[]) => {
    console.log("handleTagsChange called with:", newTags);
    console.log("Current tags before update:", tags);
    setTags(newTags);
    console.log("Tags updated in PublicationScreen");
  };

  const renderContent = () => {
    switch (step) {
      case "select":
        return <MediaSection onImageSelected={handleImageSelected} />;

      case "form":
        const imageToShow = selectedImage;
        return imageToShow ? (
          <PublicationForm
            imageUri={imageToShow}
            username={username}
            userAvatar={userAvatar}
            title={title}
            description={description}
            tags={tags}
            setTitle={setTitle}
            setDescription={setDescription}
            setTags={handleTagsChange}
            isLoading={isLoading}
            mediaType={resourceType as "image" | "video"}
            publicId={selectedImagePublicId || undefined}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <Header
          isCropping={false}
          isLastStep={step === "form"}
          onBack={handleBack}
          onConfirm={handleNext}
          onNext={step === "form" ? handleShare : handleNext}
          onGoBack={handleGoBack}
          isLoading={isLoading}
        />
        <View style={styles.contentContainer}>{renderContent()}</View>
        <FeedbackMessage
          visible={feedback.visible}
          message={feedback.message}
          type={feedback.type}
          onDismiss={hideFeedback}
        />
      </View>
    </SafeAreaView>
  );
};

export default PublicationScreen;
