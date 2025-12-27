// Web shim for react-native/Libraries/Utilities/codegenNativeCommands
// This is a native-only module that doesn't work on web

// Mock the codegenNativeCommands function
function codegenNativeCommands(config) {
  // Return a mock object that matches the expected interface
  return {};
}

// Export as both default and named export
export default codegenNativeCommands;
export { codegenNativeCommands };