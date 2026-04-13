import { color } from '@fieldbook/design-system/lib/tokens';
import type { JobDetailWorkStatus } from '@fieldbook/shared-types';

export type JobCtaResolved = {
  label: string;
  backgroundColor: string;
  labelColor: string;
  shadowColor: string;
  shadowOpacity: number;
  borderWidth?: number;
  borderColor?: string;
};

/**
 * Primary job action — fills use `Semantic/Action/Primary`; flat shadow (`shadowOpacity` 0) per Fieldbook CTA spec.
 */
export function jobDetailCtaConfig(status: JobDetailWorkStatus): JobCtaResolved {
  const surfaceWhite = color('Foundation/Surface/White');
  const textPrimary = color('Foundation/Text/Primary');
  const canvasWarm = color('Foundation/Background/CanvasWarm');
  const primary = color('Semantic/Action/Primary');

  switch (status) {
    case 'notStarted':
    case 'onHold':
      return {
        label: 'MARK IN PROGRESS',
        backgroundColor: primary,
        labelColor: surfaceWhite,
        shadowColor: primary,
        shadowOpacity: 0,
      };
    case 'inProgress':
      return {
        label: 'MARK COMPLETED',
        backgroundColor: primary,
        labelColor: surfaceWhite,
        shadowColor: primary,
        shadowOpacity: 0,
      };
    case 'completed':
      return {
        label: 'MARK PAID',
        backgroundColor: primary,
        labelColor: surfaceWhite,
        shadowColor: primary,
        shadowOpacity: 0,
      };
    case 'paid':
      return {
        label: 'MARK UNPAID',
        backgroundColor: surfaceWhite,
        labelColor: textPrimary,
        shadowColor: color('Foundation/Shadow/Ambient'),
        shadowOpacity: 0,
        borderWidth: 1,
        borderColor: color('Foundation/Border/Subtle'),
      };
    case 'cancelled':
      return {
        label: 'REOPEN JOB',
        backgroundColor: textPrimary,
        labelColor: canvasWarm,
        shadowColor: textPrimary,
        shadowOpacity: 0,
      };
  }
}
