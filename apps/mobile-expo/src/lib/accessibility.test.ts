import { AccessibilityInfo } from 'react-native';
import { describe, expect, it, jest, beforeEach } from '@jest/globals';

import { announceAccessibilityMessage, screenHeaderA11y } from './accessibility';

describe('accessibility helpers', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  });

  it('screenHeaderA11y marks a header with optional label', () => {
    expect(screenHeaderA11y()).toEqual({ accessibilityRole: 'header' });
    expect(screenHeaderA11y('FieldSolo')).toEqual({
      accessibilityRole: 'header',
      accessibilityLabel: 'FieldSolo',
    });
  });

  it('announceAccessibilityMessage skips empty strings', () => {
    announceAccessibilityMessage('   ');
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();

    announceAccessibilityMessage('Invalid password');
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Invalid password');
  });
});
