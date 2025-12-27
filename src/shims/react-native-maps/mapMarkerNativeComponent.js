// shim for web - noop MapMarkerNativeComponent
const React = require('react');

// Mock component
const MapMarkerNativeComponent = React.forwardRef((props, ref) => {
  return React.createElement('div', null, 'Marker');
});

module.exports = {
  MapMarkerNativeComponent,
  default: MapMarkerNativeComponent
};
