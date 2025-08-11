import * as Location from 'expo-location';

export async function reverseGeocodeAsync(latitude: number, longitude: number) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results && results.length > 0) {
      const { name, street, city, region, postalCode, country } = results[0];
      return [name, street, city, region, postalCode, country].filter(Boolean).join(', ');
    }
    return '';
  } catch (e) {
    return '';
  }
}
