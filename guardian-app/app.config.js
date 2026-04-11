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
      config: {
        googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#0a0a0a',
      },
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      config: {
        googleMaps: {
          apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
        },
      },
    },
    web: {
      bundler: 'metro',
    },
    plugins: ['expo-location'],
  },
};
