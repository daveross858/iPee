
import * as Location from 'expo-location';
import Constants from 'expo-constants';
// Use Google Maps Geocoding API as a fallback for web
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function reverseGeocodeAsync(latitude: number, longitude: number) {
  try {
    // Use expo-location for native, fallback to Google Maps API for web
    if (typeof window === 'undefined' || !window.fetch) {
      // Native
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const { name, street, city, region, postalCode, country } = results[0];
        return [name, street, city, region, postalCode, country].filter(Boolean).join(', ');
      }
      return '';
    } else {
      // Web fallback: Google Maps Geocoding API
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('No Google Maps API key set for reverse geocoding.');
        return '';
      }
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.error('Google Maps reverse geocode failed:', data.status, data.error_message);
        return '';
      }
    }
  } catch (e) {
    console.error('Reverse geocode error:', e);
    return '';
  }
}
