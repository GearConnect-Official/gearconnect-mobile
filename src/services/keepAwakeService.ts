import * as KeepAwake from 'expo-keep-awake';

class KeepAwakeService {
  private isInitialized: boolean = false;
  private isActivated: boolean = false;

  /**
   * Initialize keep-awake service
   * This prevents the error "Unable to activate keep awake" from expo-av
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await KeepAwake.activateKeepAwakeAsync();
      this.isActivated = true;
      this.isInitialized = true;
      console.log('✅ [KeepAwake] Service initialized and activated');
    } catch (error: any) {
      console.warn('⚠️ [KeepAwake] Failed to activate (non-critical):', error?.message || error);
      this.isInitialized = true;
    }
  }

  /**
   * Activate keep-awake (useful when starting video playback)
   */
  async activate(): Promise<void> {
    if (this.isActivated) {
      return;
    }

    try {
      await KeepAwake.activateKeepAwakeAsync();
      this.isActivated = true;
      console.log('✅ [KeepAwake] Activated');
    } catch (error: any) {
      console.warn('⚠️ [KeepAwake] Failed to activate (non-critical):', error?.message || error);
    }
  }

  /**
   * Deactivate keep-awake (useful when stopping video playback)
   */
  async deactivate(): Promise<void> {
    if (!this.isActivated) {
      return;
    }

    try {
      await KeepAwake.deactivateKeepAwakeAsync();
      this.isActivated = false;
      console.log('✅ [KeepAwake] Deactivated');
    } catch (error: any) {
      console.warn('⚠️ [KeepAwake] Failed to deactivate (non-critical):', error?.message || error);
    }
  }

  /**
   * Get activation status
   */
  getStatus(): { isInitialized: boolean; isActivated: boolean } {
    return {
      isInitialized: this.isInitialized,
      isActivated: this.isActivated,
    };
  }
}

// Export singleton instance
export const keepAwakeService = new KeepAwakeService();
export default keepAwakeService;
