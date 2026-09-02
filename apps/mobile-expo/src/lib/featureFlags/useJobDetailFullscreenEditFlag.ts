import { useEffect, useState } from 'react';

import { JOB_DETAIL_FULLSCREEN_EDIT_FLAG } from './constants';
import { isJobDetailFullscreenEditDevOverrideEnabled } from './devOverrides';
import { fetchPostHogBooleanFlag } from './posthogFlags';

export type JobDetailFullscreenEditFlagState = {
  enabled: boolean;
  ready: boolean;
};

export function useJobDetailFullscreenEditFlag(
  userId: string | null | undefined,
): JobDetailFullscreenEditFlagState {
  const devOverride = isJobDetailFullscreenEditDevOverrideEnabled();
  const [enabled, setEnabled] = useState(devOverride);
  const [ready, setReady] = useState(devOverride);

  useEffect(() => {
    if (devOverride) {
      setEnabled(true);
      setReady(true);
      return;
    }

    const distinctId = (userId ?? '').trim();
    if (!distinctId) {
      setEnabled(false);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    setEnabled(false);

    void fetchPostHogBooleanFlag(JOB_DETAIL_FULLSCREEN_EDIT_FLAG, {
      distinctId,
    }).then((value) => {
      if (cancelled) return;
      setEnabled(value);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [devOverride, userId]);

  return { enabled, ready };
}
