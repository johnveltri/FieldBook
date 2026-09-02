import { useEffect, useState } from 'react';

import { JOB_DETAIL_FULLSCREEN_EDIT_FLAG } from './constants';
import { fetchPostHogBooleanFlag, normalizeDebugEmail } from './posthogFlags';

export type JobDetailFullscreenEditFlagState = {
  enabled: boolean;
  ready: boolean;
};

export function useJobDetailFullscreenEditFlag(
  userId: string | null | undefined,
  email: string | null | undefined,
): JobDetailFullscreenEditFlagState {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const distinctId = (userId ?? '').trim();
    if (!distinctId) {
      setEnabled(false);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    setEnabled(false);

    const debugEmail = normalizeDebugEmail(email);
    void fetchPostHogBooleanFlag(JOB_DETAIL_FULLSCREEN_EDIT_FLAG, {
      distinctId,
      personProperties: debugEmail ? { debug_email: debugEmail } : undefined,
    }).then((value) => {
      if (cancelled) return;
      setEnabled(value);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [email, userId]);

  return { enabled, ready };
}
