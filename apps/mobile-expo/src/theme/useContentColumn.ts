import { useWindowDimensions } from 'react-native';

import {
  contentColumnMetrics,
  fabRightInset,
  scrollBottomInsetForFab,
} from '@fieldsolo/design-system/lib/responsiveLayout';

import { contentColumnStyleRn } from './nativeTokens';

/**
 * Window-aware content column + FAB insets for mobile screens.
 * Uses `useWindowDimensions` so orientation / split-view updates apply.
 */
export function useContentColumn() {
  const { width } = useWindowDimensions();
  const metrics = contentColumnMetrics(width);

  return {
    windowWidth: width,
    metrics,
    columnStyle: contentColumnStyleRn(width),
    fabRight: fabRightInset(width),
    scrollBottomInsetForFab,
  };
}
