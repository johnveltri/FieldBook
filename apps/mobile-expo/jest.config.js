/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/**/*.test.ts', '<rootDir>/**/*.test.tsx'],
  moduleNameMapper: {
    '^@fieldbook/api-client$': '<rootDir>/../../packages/api-client/src/index.ts',
    '^@fieldbook/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
    '^@fieldbook/design-system/(.*)$': '<rootDir>/../../packages/design-system/$1',
    '^@fieldbook/design-system$': '<rootDir>/../../packages/design-system/src/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-modules-core|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-safe-area-context|react-native-svg))',
  ],
};
