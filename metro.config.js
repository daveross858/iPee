const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Shims to prevent native-only modules from breaking web bundling
const extraNodeModules = {
  'react-native-maps': path.resolve(__dirname, 'src/shims/react-native-maps'),
  'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'src/shims/react-native/Libraries/Utilities/codegenNativeCommands.js'),
  '../../src/private/devsupport/rndevtools/ReactDevToolsSettingsManager': path.resolve(__dirname, 'src/shims/react-native/src/private/devsupport/rndevtools/ReactDevToolsSettingsManager.js'),
  'missing-asset-registry-path': path.resolve(__dirname, 'src/shims/missing-asset-registry-path'),
  'react-native': path.resolve(__dirname, 'src/shims/react-native')
};

// Custom resolver to handle platform-specific imports and native modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.extraNodeModules = extraNodeModules;

// Add a custom resolver that intercepts problematic imports
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Intercept react-native-maps deep imports on web
  if (platform === 'web' && moduleName.includes('react-native-maps')) {
    if (moduleName.includes('MapMarkerNativeComponent') || moduleName.includes('codegenNativeCommands')) {
      return {
        filePath: path.resolve(__dirname, 'src/shims/react-native-maps/index.js'),
        type: 'sourceFile',
      };
    }
  }
  
  // Intercept codegenNativeCommands imports on web
  if (platform === 'web' && moduleName.includes('codegenNativeCommands')) {
    return {
      filePath: path.resolve(__dirname, 'src/shims/react-native/Libraries/Utilities/codegenNativeCommands.js'),
      type: 'sourceFile',
    };
  }
  
  // Intercept React DevTools settings manager imports on web  
  if (platform === 'web' && moduleName.includes('ReactDevToolsSettingsManager')) {
    return {
      filePath: path.resolve(__dirname, 'src/shims/react-native/src/private/devsupport/rndevtools/ReactDevToolsSettingsManager.js'),
      type: 'sourceFile',
    };
  }
  
  // Fall back to the original resolver
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
