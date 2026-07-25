import { jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View, ScrollView } = require('react-native');
  const passthrough = React.forwardRef(function Passthrough(
    props: { children?: React.ReactNode },
    _ref: unknown,
  ) {
    const { children, ...rest } = props;
    return React.createElement(View, rest, children);
  });
  return {
    GestureHandlerRootView: View,
    PanGestureHandler: passthrough,
    NativeViewGestureHandler: passthrough,
    ScrollView,
    State: { BEGAN: 2, ACTIVE: 4, END: 5, CANCELLED: 3, FAILED: 1 },
  };
});
