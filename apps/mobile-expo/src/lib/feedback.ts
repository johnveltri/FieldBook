import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

import { SUPPORT_EMAIL } from './legal-versions';

export type FeedbackPromptMilestone = 1 | 3;

type FeedbackPromptState = {
  promptedMilestones: FeedbackPromptMilestone[];
  feedbackSent: boolean;
};

const defaultState = (): FeedbackPromptState => ({
  promptedMilestones: [],
  feedbackSent: false,
});

const keyForUser = (userId: string) => `fieldsolo.feedback-prompt.v1:${userId}`;

async function readState(userId: string): Promise<FeedbackPromptState> {
  const raw = await AsyncStorage.getItem(keyForUser(userId));
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw) as Partial<FeedbackPromptState>;
    return {
      promptedMilestones: (parsed.promptedMilestones ?? []).filter(
        (value): value is FeedbackPromptMilestone => value === 1 || value === 3,
      ),
      feedbackSent: parsed.feedbackSent === true,
    };
  } catch {
    return defaultState();
  }
}

async function writeState(userId: string, state: FeedbackPromptState): Promise<void> {
  await AsyncStorage.setItem(keyForUser(userId), JSON.stringify(state));
}

/**
 * Returns a prompt milestone once, after the user's first or third completed job.
 * Marking the milestone before showing avoids repeated prompts after navigation or retry.
 */
export async function claimFeedbackPromptMilestone(
  userId: string,
  completedJobCount: number,
): Promise<FeedbackPromptMilestone | null> {
  const milestone: FeedbackPromptMilestone | null =
    completedJobCount === 1 ? 1 : completedJobCount === 3 ? 3 : null;
  if (milestone == null) return null;

  const state = await readState(userId);
  if (state.feedbackSent || state.promptedMilestones.includes(milestone)) return null;

  await writeState(userId, {
    ...state,
    promptedMilestones: [...state.promptedMilestones, milestone],
  });
  return milestone;
}

export async function markFeedbackSent(userId: string): Promise<void> {
  const state = await readState(userId);
  await writeState(userId, { ...state, feedbackSent: true });
}

export function buildFeedbackMailto(source: 'profile' | 'completion_prompt'): string {
  const subject = encodeURIComponent('FieldSolo feedback');
  const body = encodeURIComponent(
    [
      'What were you trying to do?',
      '',
      '',
      'What was confusing or missing?',
      '',
      '',
      'What would make you use FieldSolo again?',
      '',
      '',
      '---',
      `Source: ${source === 'profile' ? 'Profile' : 'Job completion prompt'}`,
      `Device: ${Platform.OS} ${String(Platform.Version)}`,
    ].join('\n'),
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export async function openFeedbackEmail(
  source: 'profile' | 'completion_prompt',
): Promise<void> {
  await Linking.openURL(buildFeedbackMailto(source));
}
