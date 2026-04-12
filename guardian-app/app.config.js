export default {
  expo: {
    name: 'Project Guardian',
    slug: 'guardian-app',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    splash: {
      backgroundColor: '#0a0a0a',
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Project Guardian needs your location to show nearby safe zones and threat areas.',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#0a0a0a',
      },
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    },
    web: {
      bundler: 'metro',
    },
    extra: {
      geminiApiKey: 'AIzaSyANFBUiRSg8GY-yQYgvqlMnWa-D7Yl6w5c',
    },
    plugins: ['expo-location'],
  },
};
