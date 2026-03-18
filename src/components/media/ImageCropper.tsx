import { View, Image, TouchableOpacity, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { publicationStyles as styles } from '@/styles/screens';

interface ImageCropperProps {
  imageUri: string;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUri,
  onCropComplete,
  onCancel,
}) => {
  return (
    <View style={styles.cropperContainer}>
      <View style={styles.cropperHeader}>
        <TouchableOpacity onPress={onCancel}>
          <FontAwesome name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onCropComplete(imageUri)}>
          <Text style={styles.nextButton}>Next</Text>
        </TouchableOpacity>
      </View>
      <Image 
        source={{ uri: imageUri }}
        style={styles.cropperImage}
        resizeMode="contain"
      />
      <View style={styles.cropperTools}>
        <TouchableOpacity style={styles.cropperTool}>
          <FontAwesome name="expand" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cropperTool}>
          <FontAwesome name="crop" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ImageCropper; 