import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import Constants from 'expo-constants';
import { mixpanelService } from '@/services/mixpanelService';
import { sessionReplayService } from '@/services/sessionReplayService';
import { useAuth } from '@/context/AuthContext';

// Check if running in Expo Go (where Session Replay is not available)
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient' ||
  !Constants.isDevice;

interface MixpanelContextType {
  track: (eventName: string, properties?: Record<string, any>) => void;
  identify: (userId: string) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  reset: () => void;
}

const MixpanelContext = createContext<MixpanelContextType | undefined>(undefined);

interface MixpanelProviderProps {
  children: ReactNode;
}

export const MixpanelProvider: React.FC<MixpanelProviderProps> = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user;
  const isAuthenticated = auth?.isAuthenticated ?? false;

  useEffect(() => {
    // Initialize Mixpanel and Session Replay on mount
    const initMixpanel = async () => {
      await mixpanelService.initialize();

      // Initialize Session Replay only if not in Expo Go
      // Session Replay requires a development build and is not compatible with Expo Go
      if (!isExpoGo) {
        const anonymousId = `anonymous_${Date.now()}`;
        await sessionReplayService.initialize(anonymousId);
      }

      // Wait a bit to ensure initialization is complete
      setTimeout(() => {
        // Track app launch event to verify connection
        mixpanelService.track('App Launched', {
          timestamp: new Date().toISOString(),
          platform: 'react-native',
        });

        // Flush immediately and multiple times to ensure events are sent
        mixpanelService.flush();

        // Flush again after a short delay to catch any queued events
        setTimeout(() => {
          mixpanelService.flush();
          console.log('📤 [Mixpanel] App Launched event sent and flushed (second attempt)');
        }, 2000);

        console.log('📤 [Mixpanel] App Launched event sent and flushed (first attempt)');
      }, 1000);
    };
    initMixpanel();
  }, []);

  useEffect(() => {
    // Identify user when authenticated
    if (isAuthenticated && user?.id) {
      const userId = String(user.id);

      // Identify in Mixpanel
      mixpanelService.identify(userId);

      // Identify in Session Replay (only if not in Expo Go)
      if (!isExpoGo) {
        sessionReplayService.identify(userId);
      }

      // Set user properties after a small delay to ensure identify is processed
      setTimeout(() => {
        const userProperties: Record<string, any> = {};

        if (user.email) {
          userProperties.$email = user.email; // Use $email for Mixpanel's reserved property
          userProperties.email = user.email; // Also set regular email property
        }

        if (user.name) {
          userProperties.$name = user.name; // Use $name for Mixpanel's reserved property
          userProperties.name = user.name;
        }

        if (user.username) {
          userProperties.username = user.username;
        }

        if (user.id) {
          userProperties.userId = String(user.id);
        }

        if (Object.keys(userProperties).length > 0) {
          mixpanelService.setUserProperties(userProperties);
          console.log('👤 [Mixpanel] User properties set:', userProperties);
        }
      }, 500);
    } else if (!isAuthenticated) {
      // Reset on logout
      mixpanelService.reset();
      // Session Replay will continue with anonymous ID
    }
  }, [isAuthenticated, user]);

  const value: MixpanelContextType = {
    track: (eventName: string, properties?: Record<string, any>) => {
      mixpanelService.track(eventName, properties);
    },
    identify: (userId: string) => {
      mixpanelService.identify(userId);
    },
    setUserProperties: (properties: Record<string, any>) => {
      mixpanelService.setUserProperties(properties);
    },
    reset: () => {
      mixpanelService.reset();
    },
  };

  return (
    <MixpanelContext.Provider value={value}>
      {children}
    </MixpanelContext.Provider>
  );
};

export const useMixpanel = (): MixpanelContextType => {
  const context = useContext(MixpanelContext);
  if (context === undefined) {
    throw new Error('useMixpanel must be used within a MixpanelProvider');
  }
  return context;
};
