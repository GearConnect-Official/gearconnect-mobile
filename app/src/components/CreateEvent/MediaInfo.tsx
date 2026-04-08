import * as React from "react";
import { View, Text, FlatList } from "react-native";
import CustomTextInput from '../ui/CustomTextInput';
import { CloudinaryImage, CloudinaryImageUpload } from "../";
import { CloudinaryUploadResponse } from "../../services/cloudinary.service";
import ImageUpload from "./ImageUpload";
import { createEventStyles as styles } from "../../styles/screens";
import { Event } from "../../services/eventService";

interface MediaInfoProps {
  logo: string;
  logoPublicId?: string;
  images: string[];
  imagePublicIds?: string[];
  description: string;
  onInputChange: (field: keyof Event, value: any) => void;
  onAddImage: (url: string, publicId: string) => void;
  onLogoChange: (url: string, publicId: string) => void;
}

const MediaInfo: React.FC<MediaInfoProps> = ({
  logo,
  logoPublicId,
  images,
  imagePublicIds = [],
  description,
  onInputChange,
  onAddImage,
  onLogoChange,
}) => {
  const handleAdditionalImageUpload = (response: CloudinaryUploadResponse) => {
    onAddImage(response.secure_url, response.public_id);
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Media & Description</Text>
      <Text style={styles.stepDescription}>
        Add visuals to attract more participants
      </Text>

      <View style={styles.mediaSection}>
        <ImageUpload
          title="Event Logo"
          buttonText="Upload"
          onImageSelected={onLogoChange}
          folder="events/logos"
          tags={['event', 'logo']}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Event Description</Text>
        <CustomTextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your event in detail..."
          value={description}
          onChangeText={(text) => onInputChange("description", text)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          returnKeyType="done"
          blurOnSubmit={true}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.mediaSection}>
        <Text style={styles.label}>Additional Photos</Text>
        <View style={styles.imagesRow}>
          <FlatList 
            data={[...images, '__ADD_BUTTON__']}
            horizontal 
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
              if (item === '__ADD_BUTTON__') {
                return (
                  <CloudinaryImageUpload
                    onUploadComplete={handleAdditionalImageUpload}
                    folder="events/gallery"
                    tags={['event', 'gallery']}
                    allowMultiple={false}
                    buttonText="+"
                    showPreview={false}
                    style={styles.addImageButton}
                    allowsEditing={false}
                  />
                );
              }
              
              const publicId = imagePublicIds[index];
              return publicId ? (
                <CloudinaryImage
                  publicId={publicId}
                  width={100}
                  height={100}
                  style={styles.imagePreview}
                />
              ) : (
                <CloudinaryImage
                  publicId=""
                  fallbackUrl={item}
                  width={100}
                  height={100}
                  style={styles.imagePreview}
                />
              );
            }}
            contentContainerStyle={{ paddingRight: 20 }}
            ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          />
        </View>
      </View>
    </View>
  );
};

export default MediaInfo; 