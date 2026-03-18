import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { trackScreenView } from '@/utils/mixpanelTracking';

/**
 * Hook pour tracker automatiquement les vues d'écrans
 * Utilise le pathname d'Expo Router pour identifier l'écran
 */
export const useScreenTracking = (screenName?: string) => {
  const pathname = usePathname();

  useEffect(() => {
    // Utiliser le screenName fourni ou déduire du pathname
    const screen = screenName || pathname?.replace(/^\//, '').replace(/\//g, '_') || 'unknown';
    trackScreenView(screen, { pathname });
  }, [pathname, screenName]);
};

export default useScreenTracking;
