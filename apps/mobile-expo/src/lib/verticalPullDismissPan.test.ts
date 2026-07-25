import { describe, expect, it } from '@jest/globals';
import type { PanResponderGestureState } from 'react-native';

import { shouldTakeVerticalPullDismiss } from './verticalPullDismissPan';

function gesture(partial: Pick<PanResponderGestureState, 'dy' | 'dx'>): PanResponderGestureState {
  return partial as PanResponderGestureState;
}

describe('shouldTakeVerticalPullDismiss', () => {
  it('allows downward pull at scroll top', () => {
    expect(shouldTakeVerticalPullDismiss(0, gesture({ dy: 12, dx: 1 }))).toBe(true);
  });

  it('blocks when scrolled down', () => {
    expect(shouldTakeVerticalPullDismiss(40, gesture({ dy: 20, dx: 0 }))).toBe(false);
  });

  it('blocks upward movement', () => {
    expect(shouldTakeVerticalPullDismiss(0, gesture({ dy: -10, dx: 0 }))).toBe(false);
  });
});
