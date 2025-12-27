// Web shim for ReactDevToolsSettingsManager
// This is a dev-only module that doesn't work on web

export default {};

// Mock the settings manager interface
export const ReactDevToolsSettingsManager = {
  getGlobalHook: () => null,
  setGlobalHook: () => {},
};