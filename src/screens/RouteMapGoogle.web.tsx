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
}

export default function RouteMapGoogle({ start, end, bathrooms }: RouteMapGoogleProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const directionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!start || !end) return;
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places']
    });
    let map: google.maps.Map;
    let directionsService: google.maps.DirectionsService;
    let directionsRenderer: google.maps.DirectionsRenderer;
    loader.load().then(() => {
      if (!mapRef.current) return;
      map = new window.google.maps.Map(mapRef.current, {
        center: { lat: start.latitude, lng: start.longitude },
        zoom: 14,
      });
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
        (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
          } else {
            if (directionsRef.current) directionsRef.current.innerHTML = '<div style="color:red">Failed to fetch route</div>';
          }
        }
      );
    });
    return () => {
      if (directionsRenderer) directionsRenderer.setMap(null);
    };
  }, [start, end, bathrooms]);

  return (
    <div style={{ margin: '24px 0' }}>
      <div ref={mapRef} style={{ height: 400, width: '100%', borderRadius: 16 }} />
      <div ref={directionsRef} style={{ marginTop: 16, background: '#fff', borderRadius: 8, padding: 16, maxHeight: 300, overflowY: 'auto' }} />
    </div>
  );
}
