// Web shim for react-native/Libraries/Utilities/codegenNativeCommands
// This is a native-only module that doesn't work on web

// Mock the codegenNativeCommands function
export default function codegenNativeCommands(config) {
  // Return a mock object that matches the expected interface
  return {};
}

// Also export as named export in case it's imported differently
export { codegenNativeCommands };
export const codegenNativeCommands = () => ({});