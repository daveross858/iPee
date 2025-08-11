// src/services/routingService.ts
// Service to fetch route geometry and directions from OpenRouteService

const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY || '<YOUR_ORS_API_KEY_HERE>';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking';

export async function fetchRouteGeoJSON({ coordinates }: { coordinates: [number, number][] }) {
  const body = {
    coordinates,
    instructions: true,
    geometry: true,
    preference: 'recommended',
  };
  const res = await fetch(ORS_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': ORS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to fetch route');
  return res.json();
}
