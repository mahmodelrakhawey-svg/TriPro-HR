import '@testing-library/jest-dom';

// Mock Capacitor Plugins to prevent Jest ES module import errors
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}));

jest.mock('@capgo/capacitor-native-biometric', () => ({
  NativeBiometric: {
    isAvailable: jest.fn().mockResolvedValue({ isAvailable: false }),
    verifyIdentity: jest.fn(),
    getCredentials: jest.fn(),
    setCredentials: jest.fn(),
    deleteCredentials: jest.fn(),
  },
}));

jest.mock('@capacitor/device', () => ({
  Device: {
    getId: jest.fn().mockResolvedValue({ uuid: 'mock-device-id' }),
    getInfo: jest.fn().mockResolvedValue({ platform: 'web' }),
  },
}));

