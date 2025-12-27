// Web shim for MapMarkerNativeComponent used by react-native-maps deep imports
import React from 'react';

// Mock the native component interface
export interface MapMarkerNativeComponentInterface {
  showCallout: () => void;
  hideCallout: () => void;
  redrawCallout: () => void;
  animateMarkerToCoordinate: (coordinate: any, duration: number) => void;
}

// Mock component
export const MapMarkerNativeComponent = React.forwardRef((props: any, ref: any) => {
  return React.createElement('div', null, 'Marker');
});

// Default export
export default MapMarkerNativeComponent;
