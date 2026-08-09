import { useHasLiveSession } from '../../context/LiveSessionContext';
import { useQuickActionsFlow } from '../../shell/QuickActionsFlowContext';
import type { ShellMainTab } from '../../shell/shellTabRoutes';
import { PlatformBottomDock } from '../platform/PlatformBottomDock';

export type { ShellMainTab } from '../../shell/shellTabRoutes';

export {
  shellBottomNavBottomPadding,
  shellBottomNavOuterHeight,
  shellDockBottomPadding,
  shellDockOuterHeight,
  shellLiveSessionBarBottom,
} from '../platform/shellDockMetrics';

export type ShellBottomNavProps = {
  selected: ShellMainTab;
  onSelect: (tab: ShellMainTab) => void;
};

/** Floating platform dock: connected Home / Jobs / Earnings + primary action. */
export function ShellBottomNav({ selected, onSelect }: ShellBottomNavProps) {
  const { handlePrimaryAction } = useQuickActionsFlow();
  const hasLiveSession = useHasLiveSession();

  return (
    <PlatformBottomDock
      selected={selected}
      onSelect={onSelect}
      hidePrimaryAction={hasLiveSession}
      onPrimaryAction={handlePrimaryAction}
    />
  );
}
