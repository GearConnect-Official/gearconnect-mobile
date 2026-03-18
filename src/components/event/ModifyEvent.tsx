import * as React from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import BasicInfo from './BasicInfo';
import NavigationButtons from './NavigationButtons';
import { createEventStyles as styles } from '@/styles/screens';
import eventService, { Event } from '@/services/eventService';
import { useAuth } from '@/context/AuthContext';
import MediaInfo from './MediaInfo';
import AdditionalInfo from './AdditionalInfo';

interface ModifyEventProps {
  onCancel: () => void;
  onSuccess: () => void;
  eventData: Event;
  eventId: string;
}

// Custom hook to manage form state and validation
const useEventForm = (initialData: Event) => {
  const [formData, setFormData] = React.useState<Event>(initialData);
  const [error, setError] = React.useState<string | null>(null);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Event name is required');
      return false;
    }

    if (!formData.location.trim()) {
      setError('Event location is required');
      return false;
    }

    setError(null);
    return true;
  };

  const handleInputChange = (field: keyof Event, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = (url: string, publicId: string) => {
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), url],
      imagePublicIds: [...(prev.imagePublicIds || []), publicId],
    }));
  };

  return {
    formData,
    error,
    setError,
    validateForm,
    handleInputChange,
    handleAddImage,
  };
};

const ModifyEvent: React.FC<ModifyEventProps> = ({
  onCancel,
  onSuccess,
  eventData,
  eventId,
}) => {
  const auth = useAuth();
  const user = auth?.user;
  const [loading, setLoading] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(1);
  const totalSteps = 3;
  // Initialize form with event data
  const initialFormData: Event & { organizers?: { userId: number | null; name: string }[] } = {
    name: eventData?.name || '',
    creators: eventData?.creators || '',
    location: eventData?.location || '',
    date: eventData?.date ? new Date(eventData.date) : new Date(),
    sponsors: eventData?.sponsors || '',
    website: eventData?.website || '',
    rankings: eventData?.rankings || '',
    logo: eventData?.logo || '',
    images: eventData?.images || [],
    description: eventData?.description || '',
    logoPublicId: eventData?.logoPublicId || '',
    imagePublicIds: eventData?.imagePublicIds || [],
    creatorId: eventData?.creatorId,
    meteo: eventData?.meteo || {},
    participationTagText: eventData?.participationTagText || '',
    participationTagColor: eventData?.participationTagColor || '',
    organizers: (eventData as any)?.organizers || [],
  };

  const {
    formData,
    error,
    setError,
    validateForm,
    handleInputChange,
    handleAddImage,
  } = useEventForm(initialFormData);
  const handleSubmit = async () => {
    console.log('🚀 Starting event update process...');
    setLoading(true);

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      setLoading(false);
      return;
    }

    if (!user) {
      console.log('❌ User not logged in');
      setError('You must be logged in to update this event');
      setLoading(false);
      return;
    }

    if (!eventId) {
      console.log('❌ Event ID is missing');
      setError('Event ID is missing');
      setLoading(false);
      return;
    }

    console.log('📋 Form data before processing:', formData);
    console.log('🆔 Event ID:', eventId);
    console.log('👤 User:', user);

    try {
      // Format date properly
      const formattedDate = new Date(formData.date);
      console.log('📅 Formatted date:', formattedDate);

      // S'assurer que le créateur est toujours dans la liste des organisateurs
      const organizers = (formData as any).organizers || [];
      const creatorId = eventData?.creatorId;
      let finalOrganizers = organizers;
      
      if (creatorId) {
        // Récupérer le nom du créateur depuis eventData ou user
        const creatorName = (eventData as any)?.creator?.name || 
                           (eventData as any)?.creator?.username || 
                           user?.username || 
                           user?.name || 
                           'Event Creator';
        const creatorExists = organizers.some((org: { userId: number | null; name: string }) => org.userId === creatorId);
        if (!creatorExists) {
          finalOrganizers = [{ userId: creatorId, name: creatorName }, ...organizers];
        }
      }

      // Create a clean object with properties that need to be updated
      // Only include fields that are explicitly provided (allow partial updates)
      // For tag fields, send empty string if they exist but are empty (backend will convert to null)
      const updatedData: Partial<Event> & { organizers?: { userId: number | null; name: string }[] } = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        rankings: formData.rankings?.trim() || '',
        website: formData.website?.trim() || '',
        sponsors: formData.sponsors?.trim() || '',
        date: formattedDate,
        description: formData.description ? formData.description.trim() : '',
        logo: formData.logo || '',
        logoPublicId: formData.logoPublicId || undefined,
        images: formData.images || [],
        imagePublicIds: formData.imagePublicIds || [],
        meteo: formData.meteo || {},
        // Always include tag fields (even if empty) so they can be updated
        participationTagText: formData.participationTagText || '',
        participationTagColor: formData.participationTagColor || '',
        organizers: finalOrganizers,
      };

      console.log('📤 Data to be sent for update:', updatedData);

      // Update the event details
      console.log('🔄 Calling eventService.updateEvent...');
      const result = await eventService.updateEvent(eventId, updatedData);
      console.log('✅ Update result:', result);

      Alert.alert('Success', 'Event has been updated successfully!', [
        { text: 'OK', onPress: onSuccess },
      ]);
    } catch (err: any) {
      console.error('❌ Error updating event:', err);
      console.error('📋 Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });

      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'An unexpected error occurred. Please try again.';

      console.log('📝 Final error message:', errorMessage);
      setError(`Error: ${errorMessage}`);
      Alert.alert(
        'Error',
        'Unable to update the event. Please check your data and try again.'
      );
    } finally {
      setLoading(false);
      console.log('🏁 Update process finished');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfo
            name={formData.name}
            creators={formData.creators}
            organizers={(formData as any).organizers || []}
            location={formData.location}
            date={formData.date}
            onInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <MediaInfo
            logo={formData.logo || ''}
            logoPublicId={formData.logoPublicId}
            images={formData.images || []}
            imagePublicIds={formData.imagePublicIds || []}
            description={formData.description || ''}
            onInputChange={handleInputChange}
            onAddImage={handleAddImage}
            onLogoChange={(url: string, publicId: string) => {
              handleInputChange('logo', url);
              handleInputChange('logoPublicId', publicId);
            }}
          />
        );
      case 3:
        return (
          <AdditionalInfo
            logo={formData.logo || ''}
            images={formData.images || []}
            name={formData.name}
            location={formData.location}
            date={formData.date}
            website={formData.website}
            sponsors={formData.sponsors}
            meteo={formData.meteo as any}
            participationTagText={formData.participationTagText}
            participationTagColor={formData.participationTagColor}
            onInputChange={handleInputChange}
          />
        );
      default:
        return null;
    }
  };  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
      enabled
    >
      <View style={[styles.container, { flex: 1 }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          removeClippedSubviews={false}
          scrollEnabled={true}
          bounces={true}
        >          
        {renderStepContent()}
        </ScrollView> 
        
        <NavigationButtons
          currentStep={currentStep}
          isLastStep={currentStep === totalSteps}
          loading={loading}
          onPrev={prevStep}
          onNext={nextStep}
          onSubmit={handleSubmit}
          isEditing={true}
        />
        
        {error && (
          <Text style={styles.errorText}>
            {error}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ModifyEvent;
