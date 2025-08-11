// src/services/googleDirectionsService.ts
// Fetch route geometry and directions from Google Directions API

const GOOGLE_API_KEY = 'AIzaSyAJonjxDsKHATA7GznRH-7idVM0p3PYBek';
const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

export async function fetchGoogleRoute({
  waypoints,
  mode = 'walking',
}: {
  waypoints: { lat: number; lng: number; }[];
  mode?: 'walking' | 'driving' | 'bicycling' | 'transit';
}) {
  if (waypoints.length < 2) throw new Error('Need at least start and end');
  const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
  const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
  const wp = waypoints.slice(1, -1).map(w => `${w.lat},${w.lng}`).join('|');
  const url = `${GOOGLE_DIRECTIONS_URL}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${wp ? `&waypoints=${encodeURIComponent(wp)}` : ''}&mode=${mode}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch directions');
  return res.json();
}
