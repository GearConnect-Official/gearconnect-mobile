import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import axios from 'axios';
import { API_URL_HEALTH } from '@/config';

interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isServerReachable: boolean | null;
  isInitializing: boolean;
  lastChecked: Date | null;
}

/**
 * Custom hook to monitor network connection and
 * backend availability.
 */
const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    isInternetReachable: null,
    isServerReachable: null,
    isInitializing: true,
    lastChecked: null,
  });

  // Function to check if the server is accessible
  const checkServerReachability = useCallback(async (): Promise<boolean> => {
    try {
      // Simple ping to the server with a short timeout
      await axios.get(`${API_URL_HEALTH}`, {
        timeout: 5000,
        // Don't redirect automatically to avoid waiting too long
        maxRedirects: 0,
        // Don't send credentials to optimize the request
        withCredentials: false
      });
      return true;
    } catch (error) {
      // Check if the error is related to a network problem
      // or if it's another server error (in this case, the server is accessible)
      if (axios.isAxiosError(error) && error.response) {
        // If we have a response from the server (even if it's an error),
        // it means the server is accessible
        return true;
      }

      // Silent error - don't display the connection error
      return false;
    }
  }, []);

  // Function to update the complete connection status
  const updateConnectionStatus = useCallback(async (netInfoState: NetInfoState) => {
    const { isConnected, isInternetReachable } = netInfoState;

    // Only check server availability if we have an internet connection
    const serverReachable = (isConnected && isInternetReachable)
      ? await checkServerReachability()
      : false;

    setStatus(prev => ({
      ...prev,
      isConnected,
      isInternetReachable,
      isServerReachable: serverReachable,
      isInitializing: false,
      lastChecked: new Date(),
    }));
  }, [checkServerReachability]);

  // Manually check the connection (can be used after a user action)
  const checkConnection = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();
      await updateConnectionStatus(netInfo);
      return status.isServerReachable;
    } catch (error) {
      // Silent error - don't display the error
      return false;
    }
  }, [updateConnectionStatus, status.isServerReachable]);

  // Listen to application state changes
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Check the connection when the application comes back to the foreground
      if (nextAppState === 'active') {
        await checkConnection();
      }
    };

    // Subscribe to application state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Cleanup: unsubscribe
      if (Platform.OS === 'ios' || parseInt(Platform.Version as string, 10) >= 29) {
        // For iOS and Android 29+
        subscription.remove();
      }
    };
  }, [checkConnection]);

  // Listen to connection state changes
  useEffect(() => {
    setStatus(prev => ({ ...prev, isInitializing: true }));

    // Initial check
    const initialCheck = async () => {
      await checkConnection();
    };
    initialCheck();

    // Subscribe to connection state changes
    const unsubscribe = NetInfo.addEventListener(updateConnectionStatus);

    return () => {
      // Cleanup: unsubscribe
      unsubscribe();
    };
  }, [checkConnection, updateConnectionStatus]);

  return {
    ...status,
    checkConnection,
    // Shorthand method to check if we are fully connected
    isOnline: status.isServerReachable === true,
    // Shorthand method to check if we can make network requests
    canMakeRequests: status.isConnected === true && status.isInternetReachable === true
  };
};

export default useNetworkStatus;
