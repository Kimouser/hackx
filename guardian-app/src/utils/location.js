import * as Location from 'expo-location';

export const MUMBAI = {
  latitude: 19.0760,
  longitude: 72.8777,
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
  if (!granted) return MUMBAI;

  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  } catch {
    return MUMBAI;
  }
};
