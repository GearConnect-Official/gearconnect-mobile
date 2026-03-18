import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import verificationService, { VerificationRequest } from '@/services/verificationService';
import theme from '@/styles/config/theme';

export default function VerificationRequestScreen() {
  const router = useRouter();
  const { user } = useAuth() || {};
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingRequest, setExistingRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    checkExistingRequest();
  }, [user?.id]);

  const checkExistingRequest = async () => {
    if (!user?.id) {
      setChecking(false);
      return;
    }

    try {
      const request = await verificationService.checkUserRequest(parseInt(user.id.toString()));
      setExistingRequest(request);
    } catch (error) {
      // Silently handle errors - checkUserRequest already returns null on error
      // This prevents showing errors when backend routes are not yet implemented
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    if (existingRequest) {
      Alert.alert(
        'Request Already Submitted',
        existingRequest.status === 'PENDING'
          ? 'You already have a pending verification request. Please wait for a response.'
          : existingRequest.status === 'ACCEPTED'
          ? 'Your account is already verified!'
          : 'Your previous request was rejected. You can submit a new request.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      await verificationService.createRequest({
        userId: parseInt(user.id.toString()),
        message: message.trim() || undefined,
      });
      Alert.alert(
        'Request Submitted',
        'Your verification request has been submitted successfully. We will review it and get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      // Check if it's a 404 (route not implemented yet) - don't log it
      // Check multiple possible error formats
      const is404 = 
        error?.status === 404 || 
        error?.response?.status === 404 || 
        error?.isNotImplemented === true || 
        error?.type === 'NOT_FOUND' ||
        (error?.originalError?.response?.status === 404) ||
        (error?.originalError?.status === 404);
      
      if (is404) {
        Alert.alert(
          'Feature Not Available',
          'The verification request feature is not yet available. Please try again later.'
        );
      } else {
        // Only log other errors
        console.error('Error submitting verification request:', error);
        const errorMessage = 
          error?.response?.data?.error || 
          error?.message || 
          error?.originalError?.message ||
          'Failed to submit verification request. Please try again.';
        
        Alert.alert('Error', errorMessage);
      }
    } finally {
      // Always reset loading state, even if there's an error
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={{ marginTop: 16, color: theme.colors.text.secondary }}>
          Checking existing request...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
          backgroundColor: theme.colors.background.paper,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: theme.spacing.xs }}
        >
          <FontAwesome name="arrow-left" size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginLeft: theme.spacing.sm,
          }}
        >
          Request Verification
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.md,
        }}
      >
        {existingRequest ? (
          <View
            style={{
              backgroundColor: theme.colors.background.paper,
              borderRadius: 12,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <FontAwesome
                name={
                  existingRequest.status === 'PENDING'
                    ? 'clock-o'
                    : existingRequest.status === 'ACCEPTED'
                    ? 'check-circle'
                    : 'times-circle'
                }
                size={24}
                color={
                  existingRequest.status === 'PENDING'
                    ? '#FFA500'
                    : existingRequest.status === 'ACCEPTED'
                    ? '#4CAF50'
                    : '#F44336'
                }
              />
              <Text
                style={{
                  marginLeft: theme.spacing.sm,
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                }}
              >
                {existingRequest.status === 'PENDING'
                  ? 'Request Pending'
                  : existingRequest.status === 'ACCEPTED'
                  ? 'Account Verified'
                  : 'Request Rejected'}
              </Text>
            </View>
            {existingRequest.message && (
              <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing.xs }}>
                {existingRequest.message}
              </Text>
            )}
            <Text
              style={{
                color: theme.colors.text.secondary,
                fontSize: 12,
                marginTop: theme.spacing.sm,
              }}
            >
              Submitted on {new Date(existingRequest.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.md,
                lineHeight: 24,
              }}
            >
              Apply for account verification to get a verified badge on your profile. Verified
              accounts have access to special features and increased visibility.
            </Text>

            <View style={{ marginBottom: theme.spacing.md }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Message (Optional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.colors.background.paper,
                  borderRadius: 8,
                  padding: theme.spacing.sm,
                  minHeight: 120,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: theme.colors.border.light,
                  color: theme.colors.text.primary,
                }}
                placeholder="Tell us why you should be verified..."
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={6}
                value={message}
                onChangeText={setMessage}
                maxLength={500}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.xs,
                  textAlign: 'right',
                }}
              >
                {message.length}/500
              </Text>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: '#E10600',
                borderRadius: 8,
                padding: theme.spacing.md,
                alignItems: 'center',
                marginTop: theme.spacing.md,
                opacity: loading ? 0.6 : 1,
              }}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  Submit Request
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
