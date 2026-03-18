import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import verificationService, { VerificationRequest } from '@/services/verificationService';
import { CloudinaryAvatar } from '@/components/media/CloudinaryImage';
import theme from '@/styles/config/theme';

export default function VerificationDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth() || {};
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user?.id) return;

    try {
      const pendingRequests = await verificationService.getPendingRequests(
        parseInt(user.id.toString())
      );
      setRequests(pendingRequests);
    } catch (error: any) {
      console.error('Error loading verification requests:', error);
      Alert.alert('Error', 'Failed to load verification requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleAccept = async (requestId: number) => {
    if (!user?.id) return;

    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this verification request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setProcessingId(requestId);
            try {
              await verificationService.acceptRequest(requestId, parseInt(user.id.toString()));
              Alert.alert('Success', 'Verification request accepted');
              loadRequests();
            } catch (error: any) {
              console.error('Error accepting request:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to accept request'
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestId: number) => {
    if (!user?.id) return;

    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this verification request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(requestId);
            try {
              await verificationService.rejectRequest(requestId, parseInt(user.id.toString()));
              Alert.alert('Success', 'Verification request rejected');
              loadRequests();
            } catch (error: any) {
              console.error('Error rejecting request:', error);
              Alert.alert(
                'Error',
                error.response?.data?.error || 'Failed to reject request'
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderRequestItem = ({ item }: { item: VerificationRequest }) => {
    const isProcessing = processingId === item.id;

    return (
      <View
        style={{
          backgroundColor: theme.colors.background.paper,
          borderRadius: 12,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          borderWidth: 1,
          borderColor: theme.colors.border.light,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <CloudinaryAvatar
            publicId={item.user.profilePicturePublicId}
            fallbackUri={item.user.profilePicture}
            size={50}
          />
          <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>
              {item.user.name}
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
              @{item.user.username}
            </Text>
          </View>
        </View>

        {item.message && (
          <Text
            style={{
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
              lineHeight: 20,
            }}
          >
            {item.message}
          </Text>
        )}

        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.sm,
          }}
        >
          Requested on {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#4CAF50',
              borderRadius: 8,
              padding: theme.spacing.sm,
              alignItems: 'center',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onPress={() => handleAccept(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '600' }}>Accept</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#F44336',
              borderRadius: 8,
              padding: theme.spacing.sm,
              alignItems: 'center',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onPress={() => handleReject(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '600' }}>Decline</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={{ marginTop: 16, color: theme.colors.text.secondary }}>
          Loading requests...
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
          Verification Requests
        </Text>
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          padding: theme.spacing.md,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: theme.spacing.xl,
            }}
          >
            <FontAwesome name="check-circle" size={48} color={theme.colors.text.secondary} />
            <Text
              style={{
                marginTop: theme.spacing.md,
                fontSize: 16,
                color: theme.colors.text.secondary,
                textAlign: 'center',
              }}
            >
              No pending verification requests
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
