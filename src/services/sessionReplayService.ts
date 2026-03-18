import Constants from 'expo-constants';

// Check if running in Expo Go (where native modules are not available)
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient' ||
  !Constants.isDevice;

// Dynamic import for ESM module compatibility
let MPSessionReplay: any;
let MPSessionReplayConfig: any;
let MPSessionReplayMask: any;
let moduleLoadAttempted: boolean = false;

// Lazy load the module
const loadSessionReplayModule = async () => {
  if (isExpoGo) {
    return { MPSessionReplay: null, MPSessionReplayConfig: null, MPSessionReplayMask: null };
  }

  if (moduleLoadAttempted) {
    return { MPSessionReplay, MPSessionReplayConfig, MPSessionReplayMask };
  }

  if (!MPSessionReplay) {
    moduleLoadAttempted = true;
    try {
      const module = await Promise.resolve(import('@mixpanel/react-native-session-replay')).catch(() => null);
      if (module) {
        MPSessionReplay = module.MPSessionReplay;
        MPSessionReplayConfig = module.MPSessionReplayConfig;
        MPSessionReplayMask = module.MPSessionReplayMask;
      } else {
        MPSessionReplay = null;
        MPSessionReplayConfig = null;
        MPSessionReplayMask = null;
      }
    } catch (error: any) {
      MPSessionReplay = null;
      MPSessionReplayConfig = null;
      MPSessionReplayMask = null;
    }
  }
  return { MPSessionReplay, MPSessionReplayConfig, MPSessionReplayMask };
};

class SessionReplayService {
  private isInitialized: boolean = false;
  private distinctId: string | null = null;

  async initialize(distinctId: string): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ [Session Replay] Already initialized');
      return;
    }

    if (isExpoGo) {
      return;
    }

    const mixpanelToken = Constants.expoConfig?.extra?.mixpanelToken || process.env.MIXPANEL_TOKEN;

    if (!mixpanelToken) {
      console.warn('⚠️ [Session Replay] MIXPANEL_TOKEN not found. Session Replay will not be initialized.');
      return;
    }

    try {
      const { MPSessionReplay: MP, MPSessionReplayConfig: Config, MPSessionReplayMask: Mask } = await loadSessionReplayModule();

      if (!MP || !Config || !Mask) {
        return;
      }

      const config = new Config({
        wifiOnly: false,
        recordingSessionsPercent: 100,
        autoStartRecording: true,
        autoMaskedViews: [
          Mask.Text,
          Mask.Image,
        ],
        flushInterval: 5,
        enableLogging: true,
      });

      await MP.initialize(mixpanelToken, distinctId, config).catch((error: any) => {
        console.error('❌ [Session Replay] Initialization failed:', error);
        throw error;
      });

      this.isInitialized = true;
      this.distinctId = distinctId;
      console.log('✅ [Session Replay] Initialized successfully');
      console.log('🔧 [Session Replay] Config:', {
        wifiOnly: false,
        recordingSessionsPercent: 100,
        autoStartRecording: true,
        autoMaskedViews: ['Text', 'Image'],
        flushInterval: 5,
      });
    } catch (error) {
      console.error('❌ [Session Replay] Initialization error:', error);
    }
  }

  async startRecording(): Promise<void> {
    if (!this.isInitialized || isExpoGo) {
      return;
    }

    try {
      const { MPSessionReplay: MP } = await loadSessionReplayModule();
      if (!MP) return;
      await MP.startRecording();
      console.log('🎬 [Session Replay] Recording started');
    } catch (error) {
      console.error('❌ [Session Replay] Failed to start recording:', error);
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isInitialized || isExpoGo) {
      return;
    }

    try {
      const { MPSessionReplay: MP } = await loadSessionReplayModule();
      if (!MP) return;
      await MP.stopRecording();
      console.log('⏹️ [Session Replay] Recording stopped');
    } catch (error) {
      console.error('❌ [Session Replay] Failed to stop recording:', error);
    }
  }

  async isRecording(): Promise<boolean> {
    if (!this.isInitialized || isExpoGo) {
      return false;
    }

    try {
      const { MPSessionReplay: MP } = await loadSessionReplayModule();
      if (!MP) return false;
      const recording = await MP.isRecording();
      return recording;
    } catch (error) {
      console.error('❌ [Session Replay] Failed to check recording status:', error);
      return false;
    }
  }

  async identify(distinctId: string): Promise<void> {
    if (!this.isInitialized || isExpoGo) {
      return;
    }

    try {
      const { MPSessionReplay: MP } = await loadSessionReplayModule();
      if (!MP) return;
      await MP.identify(distinctId);
      this.distinctId = distinctId;
      console.log('👤 [Session Replay] User identified:', distinctId);
    } catch (error) {
      console.error('❌ [Session Replay] Failed to identify user:', error);
    }
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const sessionReplayService = new SessionReplayService();
export default sessionReplayService;
