import 'dotenv/config';

export default {
  expo: {
    name: "GearConnect",
    slug: "gearconnect",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/images/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./src/assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gearconnect.app",
      infoPlist: {
        NSContactsUsageDescription: "We need access to your contacts to share them in conversations.",
        NSLocationWhenInUseUsageDescription: "We need access to your location to share it in conversations.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "We need access to your location to share it in conversations.",
        NSCameraUsageDescription: "We need access to your camera to take photos and videos to share in conversations.",
        NSPhotoLibraryUsageDescription: "We need access to your photo library to share photos and videos in conversations.",
        NSPhotoLibraryAddUsageDescription: "We need access to save photos and videos to your library.",
        NSMicrophoneUsageDescription: "We need access to your microphone to record voice messages.",
        NSCalendarsUsageDescription: "We need access to your calendar to add appointments shared in conversations.",
        NSCalendarsWriteOnlyUsageDescription: "We need access to add appointments to your calendar."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./src/assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.gearconnect.app",
      permissions: [
        "android.permission.READ_CONTACTS",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO",
        "android.permission.READ_CALENDAR",
        "android.permission.WRITE_CALENDAR",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.AUDIO_RECORD"
      ]
    },
    extra: {
      apiProtocol: process.env.API_PROTOCOL,
      apiHost: process.env.API_HOST,
      apiPort: parseInt(process.env.API_PORT, 10),
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
      cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      mixpanelToken: process.env.MIXPANEL_TOKEN,
      mixpanelServerURL: process.env.MIXPANEL_SERVER_URL || 'https://api-eu.mixpanel.com',
      eas: {
        projectId: "ca893aec-0abe-4342-8ed4-2deb3ba8ff2a"
      }
    },
    scheme: "gearconnect",
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./src/assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "We need access to your location to share it in conversations."
        }
      ],
      [
        "expo-calendar",
        {
          calendarPermission: "We need access to your calendar to add appointments shared in conversations."
        }
      ],
      "expo-document-picker",
      [
        "expo-media-library",
        {
          photosPermission: "We need access to your photo library to share photos and videos.",
          savePhotosPermission: "We need access to save photos and videos to your library.",
          isAccessMediaLocationEnabled: true,
          granularPermissions: ["photo", "video"]
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};
