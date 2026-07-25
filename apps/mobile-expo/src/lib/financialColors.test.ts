import { describe, expect, it } from '@jest/globals';
import { color } from '@fieldsolo/design-system/lib/tokens';

import {
  earningsSuccessNegativeColor,
  financialPositiveNegativeColor,
} from './financialColors';

describe('financialColors', () => {
  it('uses positive green for non-negative cents', () => {
    expect(financialPositiveNegativeColor(100)).toBe(color('Semantic/Financial/Positive'));
    expect(earningsSuccessNegativeColor(0)).toBe(color('Semantic/Status/Success/Text'));
  });

  it('uses negative red for negative cents', () => {
    expect(financialPositiveNegativeColor(-1)).toBe(color('Semantic/Financial/Negative'));
    expect(earningsSuccessNegativeColor(-500)).toBe(color('Semantic/Financial/Negative'));
  });
});
