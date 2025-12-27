const path = require('path');

// Explicit resolver aliases to prevent Metro from pulling native-only
// implementations when bundling for web. Map package names to our shims.
const extraNodeModules = {
  'react-native-maps': path.resolve(__dirname, 'src/shims/react-native-maps'),
  'react-native-maps/src': path.resolve(__dirname, 'src/shims/react-native-maps/src'),
  // explicit deep import aliases to avoid Metro resolving native internals on web
  'react-native-maps/src/MapMarkerNativeComponent': path.resolve(__dirname, 'src/shims/react-native-maps/mapMarkerNativeComponent.js'),
  'react-native-maps/src/MapMarkerNativeComponent.ts': path.resolve(__dirname, 'src/shims/react-native-maps/src/MapMarkerNativeComponent.ts'),
  'react-native-maps/src/specs/NativeComponentMarker': path.resolve(__dirname, 'src/shims/react-native-maps/nativeComponentMarker.js'),
  'react-native-maps/src/specs/NativeComponentMarker.ts': path.resolve(__dirname, 'src/shims/react-native-maps/src/specs/NativeComponentMarker.ts'),
  'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'src/shims/react-native/Libraries/Utilities/codegenNativeCommands.js'),
  'missing-asset-registry-path': path.resolve(__dirname, 'src/shims/missing-asset-registry-path'),
  'react-native': path.resolve(__dirname, 'src/shims/react-native')
};

module.exports = {
  resolver: {
    extraNodeModules,
    /*
    // The original proxy approach could remain, but explicit aliases are
    // more predictable for deep imports inside node_modules.
    extraNodeModules: new Proxy({}, {
      get: (target, name) => path.join(process.cwd(), `src/shims/${name}`)
    })
    */
  }
};
