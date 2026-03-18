// Centralized image assets for better bundling and management
// Using require() for all platforms for consistent behavior

export const AppImages = {
  // Main logo - use require() for consistent behavior
  logoRounded: require('./images/logoGearConnect.png'),
  icon: require('./images/icon.png'),
  splashIcon: require('./images/splash-icon.png'),
  adaptiveIcon: require('./images/adaptive-icon.png'),

  // Social logos
  googleLogo: require('./images/Google-logo.png'),
  appleLogo: require('./images/Apple-logo.png'),
  facebook: require('./images/facebook.png'),

  // Other assets
  formula1: require('./images/Formula1.png'),
  error: require('./images/error.png'),
  favicon: require('./images/favicon.png'),

  // React logos (dev)
  reactLogo: require('./images/react-logo.png'),
  partialReactLogo: require('./images/partial-react-logo.png'),
};

// Type safety for image keys
export type ImageKey = keyof typeof AppImages;
