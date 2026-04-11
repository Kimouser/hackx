import * as Location from 'expo-location';

export const getCurrentDeviceLocation = async () => {
  try {
    // 1. Request hardware permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission denied by user.');
      return null;
    }

    // 2. Fetch the live coordinates
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const lat = location.coords.latitude;
    const lng = location.coords.longitude;

    // 3. Reverse geocode to get the city and state name
    const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    let locationName = 'Unknown Location';
    
    if (geocode.length > 0) {
      const place = geocode[0];
      // Grabs the city and the state abbreviation
      locationName = `${place.city || place.subregion}, ${place.region}`;
    }

    return { lat, lng, name: locationName };

  } catch (error) {
    console.error("Error fetching device location:", error);
    return null;
  }
};