import React, { useRef, useEffect } from 'react';

// @ts-ignore
// eslint-disable-next-line import/no-extraneous-dependencies
import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAJonjxDsKHATA7GznRH-7idVM0p3PYBek';

export type LatLng = { latitude: number; longitude: number; name?: string; id?: string };
export type Bathroom = { id: string; name: string; latitude: number; longitude: number };

interface RouteMapGoogleProps {
  start: LatLng;
  end: LatLng;
  bathrooms: Bathroom[];
  navigationStep?: number | null;
  onDirectionsReady?: (steps: Array<{ instruction: string; distance: string; duration: string }>) => void;
}

export default function RouteMapGoogle({ start, end, bathrooms, navigationStep, onDirectionsReady }: RouteMapGoogleProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const directionsRef = useRef<HTMLDivElement>(null);
  // @ts-ignore
  const markersRef = useRef<any[]>([]);
  // @ts-ignore
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!start || !end) return;
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });
  // @ts-ignore
  let map: any;
  // @ts-ignore
  let directionsService: any;
  // @ts-ignore
  let directionsRenderer: any;
    loader.load().then(() => {
      if (!mapRef.current) return;
      map = new window.google.maps.Map(mapRef.current, {
        center: { lat: start.latitude, lng: start.longitude },
        zoom: 14,
      });
      mapInstance.current = map;
      directionsService = new window.google.maps.DirectionsService();
      directionsRenderer = new window.google.maps.DirectionsRenderer({
        map,
        panel: directionsRef.current || undefined,
        suppressMarkers: false,
      });
      const waypoints = bathrooms.map((b) => ({
        location: { lat: b.latitude, lng: b.longitude },
        stopover: true,
      }));
      directionsService.route(
        {
          origin: { lat: start.latitude, lng: start.longitude },
          destination: { lat: end.latitude, lng: end.longitude },
          waypoints,
          travelMode: window.google.maps.TravelMode.WALKING,
        },
        (result: any, status: any) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
            // Extract step-by-step directions
            if (onDirectionsReady && result.routes && result.routes[0] && result.routes[0].legs) {
              const allSteps: Array<{ instruction: string; distance: string; duration: string }> = [];
              result.routes[0].legs.forEach((leg: any) => {
                leg.steps.forEach((step: any) => {
                  allSteps.push({
                    instruction: step.instructions,
                    distance: step.distance.text,
                    duration: step.duration.text,
                  });
                });
              });
              onDirectionsReady(allSteps);
            }
            // Place custom markers for navigation steps
            markersRef.current.forEach(m => m.setMap(null));
            markersRef.current = [];
            const steps = [
              { lat: start.latitude, lng: start.longitude, label: 'Start' },
              ...bathrooms.map((b, i) => ({ lat: b.latitude, lng: b.longitude, label: `Bathroom ${i + 1}` })),
              { lat: end.latitude, lng: end.longitude, label: 'End' },
            ];
            steps.forEach((s, idx) => {
              const marker = new window.google.maps.Marker({
                position: { lat: s.lat, lng: s.lng },
                map,
                label: s.label,
                icon: idx === navigationStep ? {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#4A90E2',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#fff',
                } : undefined,
                zIndex: idx === navigationStep ? 999 : 1,
              });
              markersRef.current.push(marker);
            });
            // Pan to current step
            if (typeof navigationStep === 'number' && steps[navigationStep]) {
              map.panTo({ lat: steps[navigationStep].lat, lng: steps[navigationStep].lng });
            }
          } else {
            if (directionsRef.current) directionsRef.current.innerHTML = '<div style="color:red">Failed to fetch route</div>';
          }
        }
      );
    });
    return () => {
      if (directionsRenderer) directionsRenderer.setMap(null);
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };
  }, [start, end, bathrooms, navigationStep]);

  return (
    <div style={{ margin: '24px 0' }}>
      <div ref={mapRef} style={{ height: 400, width: '100%', borderRadius: 16 }} />
      <div ref={directionsRef} style={{ marginTop: 16, background: '#fff', borderRadius: 8, padding: 16, maxHeight: 300, overflowY: 'auto' }} />
    </div>
  );
}
