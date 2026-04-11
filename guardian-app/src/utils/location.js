import * as Location from 'expo-location';

export const AHMEDABAD = {
  latitude: 23.0225,
  longitude: 72.5714,
};

export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

export const getCurrentLocation = async () => {
  const granted = await requestLocationPermission();
  if (!granted) return AHMEDABAD;

  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    return AHMEDABAD;
  }
};
