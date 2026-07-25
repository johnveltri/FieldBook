import { type ReactNode } from 'react';
import { OverlaySlideHost } from './OverlaySlideHost';

type PushScreenFrameProps = {
  children: ReactNode;
  visible: boolean;
  onRequestClose: () => void;
  onExited?: () => void;
};

/** Horizontal push overlay for nested back-arrow screens (Help, Privacy, etc.). */
export function PushScreenFrame({
  children,
  visible,
  onRequestClose,
  onExited,
}: PushScreenFrameProps) {
  if (!visible) {
    return null;
  }
  return (
    <OverlaySlideHost
      visible={visible}
      axis="horizontal"
      onRequestClose={onRequestClose}
      onExited={onExited}
    >
      {children}
    </OverlaySlideHost>
  );
}
