import React, { useEffect, useState } from "react";
import { View, Image, ImageProps, ViewStyle } from "react-native";

interface AspectBannerImageProps {
  sourceUri: string | null;
  placeholder?: React.ReactNode;
  fallbackHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  /** Force un format carré (hauteur = largeur), adapté aux images carrées du formulaire. */
  forceSquare?: boolean;
  containerStyle?: ViewStyle;
  imageStyle?: ImageProps["style"];
  children?: React.ReactNode;
}

/**
 * Bannière qui respecte le ratio de l'image (format du formulaire) sans rogner.
 * Utilise Image.getSize pour obtenir les dimensions et resizeMode="contain".
 * Si forceSquare=true, la bannière est carrée (hauteur = largeur).
 */
export const AspectBannerImage: React.FC<AspectBannerImageProps> = ({
  sourceUri,
  placeholder,
  fallbackHeight = 120,
  minHeight = 88,
  maxHeight = 220,
  forceSquare = false,
  containerStyle,
  imageStyle,
  children,
}) => {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    if (forceSquare || !sourceUri || typeof sourceUri !== "string" || !sourceUri.trim()) {
      setAspect(null);
      return;
    }
    Image.getSize(
      sourceUri,
      (w, h) => setAspect(h / w),
      () => setAspect(9 / 16)
    );
  }, [sourceUri, forceSquare]);

  const height =
    layoutWidth > 0 && aspect != null
      ? Math.max(minHeight, Math.min(maxHeight, layoutWidth * aspect))
      : fallbackHeight;

  return (
    <View
      onLayout={forceSquare ? undefined : (e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setLayoutWidth(w);
      }}
      style={[
        {
          width: "100%",
          backgroundColor: "#f0f0f0",
          overflow: "hidden",
          position: "relative",
        },
        forceSquare ? { aspectRatio: 1 } : { height },
        containerStyle,
      ]}
    >
      {sourceUri ? (
        <Image
          source={{ uri: sourceUri }}
          style={[{ width: "100%", height: "100%" }, imageStyle]}
          resizeMode="contain"
        />
      ) : (
        placeholder
      )}
      {children}
    </View>
  );
};

export default AspectBannerImage;
