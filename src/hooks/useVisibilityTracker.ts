import { useState, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';

interface ViewabilityConfig {
  minimumViewTime: number;
  itemVisiblePercentThreshold: number;
}

interface VisibilityTrackerState {
  visiblePosts: Set<string>;
  currentlyVisiblePost: string | null;
}

const useVisibilityTracker = (config?: Partial<ViewabilityConfig>) => {
  const [visibilityState, setVisibilityState] = useState<VisibilityTrackerState>({
    visiblePosts: new Set(),
    currentlyVisiblePost: null,
  });

  const defaultConfig: ViewabilityConfig = {
    minimumViewTime: 500, // 500ms minimum pour être considéré comme visible
    itemVisiblePercentThreshold: 50, // 50% de l'item doit être visible
  };

  const finalConfig = { ...defaultConfig, ...config };

  // Configuration pour FlatList
  const viewabilityConfig = useRef({
    minimumViewTime: finalConfig.minimumViewTime,
    itemVisiblePercentThreshold: finalConfig.itemVisiblePercentThreshold,
  }).current;

  // Callback pour gérer les changements de visibilité
  const onViewableItemsChanged = useCallback(
    ({ viewableItems, changed }: any) => {
      console.log('📱 Viewability changed:', {
        viewableItems: viewableItems.map((item: any) => item.key),
        changed: changed.map((item: any) => ({ key: item.key, isViewable: item.isViewable })),
      });

      const newVisiblePosts = new Set<string>();
      let newCurrentlyVisiblePost: string | null = null;

      // Traiter les éléments visibles
      viewableItems.forEach((item: any) => {
        if (item.isViewable) {
          newVisiblePosts.add(item.key);
          // Le premier élément visible devient le post actuellement visible
          if (!newCurrentlyVisiblePost) {
            newCurrentlyVisiblePost = item.key;
          }
        }
      });

      // Mettre à jour l'état
      setVisibilityState(prevState => {
        const hasChanged =
          prevState.visiblePosts.size !== newVisiblePosts.size ||
          prevState.currentlyVisiblePost !== newCurrentlyVisiblePost ||
          Array.from(prevState.visiblePosts).some(id => !newVisiblePosts.has(id));

        if (hasChanged) {
          console.log('📱 Visibility state updated:', {
            previousVisible: Array.from(prevState.visiblePosts),
            newVisible: Array.from(newVisiblePosts),
            previousCurrent: prevState.currentlyVisiblePost,
            newCurrent: newCurrentlyVisiblePost,
          });

          return {
            visiblePosts: newVisiblePosts,
            currentlyVisiblePost: newCurrentlyVisiblePost,
          };
        }

        return prevState;
      });
    },
    [finalConfig]
  );

  // Référence pour le callback (requis par FlatList)
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig,
      onViewableItemsChanged,
    },
  ]).current;

  // Fonctions utilitaires
  const isPostVisible = useCallback(
    (postId: string) => visibilityState.visiblePosts.has(postId),
    [visibilityState.visiblePosts]
  );

  const isPostCurrentlyVisible = useCallback(
    (postId: string) => visibilityState.currentlyVisiblePost === postId,
    [visibilityState.currentlyVisiblePost]
  );

  const getVisiblePostsCount = useCallback(
    () => visibilityState.visiblePosts.size,
    [visibilityState.visiblePosts]
  );

  return {
    // État
    visiblePosts: visibilityState.visiblePosts,
    currentlyVisiblePost: visibilityState.currentlyVisiblePost,

    // Configuration pour FlatList
    viewabilityConfigCallbackPairs,

    // Fonctions utilitaires
    isPostVisible,
    isPostCurrentlyVisible,
    getVisiblePostsCount,
  };
};

export default useVisibilityTracker;
