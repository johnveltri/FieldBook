import AsyncStorage from '@react-native-async-storage/async-storage';

type FirstRunOnboardingState = 'dismissed' | 'completed';

const keyForUser = (userId: string) => `fieldsolo.first-run-onboarding.v1:${userId}`;

export async function getFirstRunOnboardingState(
  userId: string,
): Promise<FirstRunOnboardingState | null> {
  const value = await AsyncStorage.getItem(keyForUser(userId));
  return value === 'dismissed' || value === 'completed' ? value : null;
}

export async function setFirstRunOnboardingState(
  userId: string,
  state: FirstRunOnboardingState,
): Promise<void> {
  await AsyncStorage.setItem(keyForUser(userId), state);
}
