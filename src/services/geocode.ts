
import * as Location from 'expo-location';
import Constants from 'expo-constants';
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function geocodeAddressAsync(address: string) {
  try {
    // Use expo-location for native, Google Maps API for web
    if (typeof window === 'undefined' || !window.fetch) {
      // Native
      const results = await Location.geocodeAsync(address);
      if (results && results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }
      return null;
    } else {
      // Web: Google Maps Geocoding API
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('No Google Maps API key set for geocoding.');
        return null;
      }
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return {
          latitude: loc.lat,
          longitude: loc.lng,
        };
      } else {
        console.error('Google Maps geocode failed:', data.status, data.error_message);
        return null;
      }
    }
  } catch (e) {
    console.error('Geocode error:', e);
    return null;
  }
}
