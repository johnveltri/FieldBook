import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  buildFeedbackMailto,
  claimFeedbackPromptMilestone,
  markFeedbackSent,
} from './feedback';

describe('feedback', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('claims the first and third completion milestones once', async () => {
    await expect(claimFeedbackPromptMilestone('user-a', 1)).resolves.toBe(1);
    await expect(claimFeedbackPromptMilestone('user-a', 1)).resolves.toBeNull();
    await expect(claimFeedbackPromptMilestone('user-a', 2)).resolves.toBeNull();
    await expect(claimFeedbackPromptMilestone('user-a', 3)).resolves.toBe(3);
    await expect(claimFeedbackPromptMilestone('user-a', 3)).resolves.toBeNull();
  });

  it('does not prompt again after feedback is sent', async () => {
    await markFeedbackSent('user-a');
    await expect(claimFeedbackPromptMilestone('user-a', 1)).resolves.toBeNull();
    await expect(claimFeedbackPromptMilestone('user-a', 3)).resolves.toBeNull();
  });

  it('builds a prefilled support email', () => {
    const mailto = decodeURIComponent(buildFeedbackMailto('profile'));
    expect(mailto).toContain('mailto:support@fieldsoli.com?subject=FieldSoli feedback');
    expect(mailto).toContain('What was confusing or missing?');
    expect(mailto).toContain('Source: Profile');
  });
});
