// Loads the Google Maps JS API with the Places library for web
declare global {
  interface Window {
    google?: any;
  }
}

export function loadGoogleMapsScript(apiKey: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.google && window.google.maps && window.google.maps.places) return; // already loaded
  const scriptId = 'google-maps-js';
  if (document.getElementById(scriptId)) return;
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}
