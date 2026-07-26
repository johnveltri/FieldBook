import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import { FirstRunOnboardingScreen } from './FirstRunOnboardingScreen';

jest.mock('expo-font', () => ({ useFonts: () => [true] }));
jest.mock('../components/CanvasTiledBackground', () => ({ CanvasTiledBackground: () => null }));

describe('FirstRunOnboardingScreen', () => {
  it('teaches the first-job payoff and exposes both choices', () => {
    const onAddFirstJob = jest.fn();
    const onNotNow = jest.fn();
    const screen = render(
      <FirstRunOnboardingScreen onAddFirstJob={onAddFirstJob} onNotNow={onNotNow} />,
    );

    expect(screen.getByText('Start with one real job')).toBeTruthy();
    expect(screen.getByText('Add a recent job to track the work, time, materials, notes, and payment status.')).toBeTruthy();
    fireEvent.press(screen.getByText('ADD MY FIRST JOB'));
    fireEvent.press(screen.getByText('NOT NOW'));
    expect(onAddFirstJob).toHaveBeenCalledTimes(1);
    expect(onNotNow).toHaveBeenCalledTimes(1);
  });
});
