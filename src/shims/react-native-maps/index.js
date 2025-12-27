// Web shim for react-native-maps
import React from 'react';

// Mock MapView component for web
export const MapView = ({ children, style, ...props }) => {
  return React.createElement('div', {
    style: {
      ...style,
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ccc'
    }
  }, 'Map not available on web - use native app');
};

// Mock Marker component
export const Marker = ({ children, ...props }) => {
  return null; // Don't render markers on web mock
};

// Mock other components that might be imported
export const Callout = ({ children, ...props }) => null;
export const Circle = ({ ...props }) => null;
export const Polygon = ({ ...props }) => null;
export const Polyline = ({ ...props }) => null;
export const Overlay = ({ ...props }) => null;

// Default export
export default {
  MapView,
  Marker,
  Callout,
  Circle,
  Polygon,
  Polyline,
  Overlay
};