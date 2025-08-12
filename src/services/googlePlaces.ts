// Google Places Autocomplete and Place Details API helpers
// Only for web (fetches from Google Places API)


import Constants from 'expo-constants';
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Use JS API for web, REST API for native
export async function fetchPlaceSuggestions(input: string): Promise<any[]> {
  if (!input) return [];
  // @ts-ignore
  if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
    return new Promise((resolve) => {
      // @ts-ignore
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions({ input }, (predictions: any[], status: string) => {
        if (status === 'OK' && predictions) {
          resolve(predictions);
        } else {
          resolve([]);
        }
      });
    });
  } else {
    // fallback for native (or if JS API not loaded)
    if (!GOOGLE_MAPS_API_KEY) return [];
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK') {
      return data.predictions;
    }
    return [];
  }
}

export async function fetchPlaceDetails(placeId: string): Promise<any | null> {
  if (!placeId) return null;
  // @ts-ignore
  if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
    return new Promise((resolve) => {
      // Create a dummy div for the PlacesService (not added to DOM)
      const dummyDiv = document.createElement('div');
      // @ts-ignore
      const service = new window.google.maps.places.PlacesService(dummyDiv);
      service.getDetails({ placeId }, (result: any, status: string) => {
        if (status === 'OK' && result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  } else {
    // fallback for native (or if JS API not loaded)
    if (!GOOGLE_MAPS_API_KEY) return null;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK') {
      return data.result;
    }
    return null;
  }
}
