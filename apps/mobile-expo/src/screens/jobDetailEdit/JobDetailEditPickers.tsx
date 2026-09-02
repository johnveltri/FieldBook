import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { space } from '@fieldsolo/design-system/lib/tokens';
import {
  DURATION_CHIP_HOURS,
  durationHoursBetween,
  formatDurationChipLabel,
  formatLocalDateLabel,
  formatSessionDurationLabel,
  formatSessionTimeLabel,
  JOB_DETAIL_EMPTY_LABELS,
  resolveSessionDraftTimes,
  todayLocalDateString,
} from '@fieldsolo/api-client';
import type { DropdownBottomSheetOption } from '../../components/ds/DropdownBottomSheet';
import { DropdownBottomSheet } from '../../components/ds/DropdownBottomSheet';
import { ChooseSessionBottomSheet } from '../../components/ds/ChooseSessionBottomSheet';
import { InlineMonthCalendar } from '../../components/ds/InlineMonthCalendar';
import { BottomSheetShell } from '../../components/ds/BottomSheetShell';
import { EditPickerSheetHeader } from '../../components/ds/edit-mode/EditPickerSheetHeader';
import { OTHER_COST_TYPE_OPTIONS } from '../../lib/otherCostTypes';
import { bg, fg } from '../../theme/nativeTokens';
import type { TextStyles } from '../../theme/nativeTokens';
import type {
  DraftMaterialRow,
  DraftNoteRow,
  DraftOtherCostRow,
  DraftSessionRow,
  JobEditDraft,
} from './useJobEditDraft';
import {
  combineDateAndTime,
  dateToLocalDateString,
  localDateStringToDate,
  startOfDay,
} from './sessionPickerUtils';

const UNIT_OPTIONS = (['ea', 'ft', 'pcs', 'kit', 'lb', 'gal', 'lot'] as const).map((u) => ({
  id: u,
  label: u,
  value: u,
}));

const DURATION_OPTIONS: DropdownBottomSheetOption[] = DURATION_CHIP_HOURS.map((hours) => ({
  id: String(hours),
  label: formatDurationChipLabel(hours),
  value: String(hours),
}));

function formatDurationPickerValue(hours: number): string | null {
  if (hours <= 0) return null;
  const preset = DURATION_CHIP_HOURS.find((chip) => Math.abs(chip - hours) < 0.005);
  if (preset != null) return String(preset);
  return String(Math.round(hours * 100) / 100);
}

export type EditPickerTarget =
  | { kind: 'sessionDate'; sessionId: string }
  | { kind: 'sessionDuration'; sessionId: string }
  | { kind: 'sessionStartTime'; sessionId: string }
  | { kind: 'sessionEndTime'; sessionId: string }
  | { kind: 'attachSession'; entity: 'material' | 'note' | 'otherCost'; entityId: string }
  | { kind: 'costType'; otherCostId: string }
  | { kind: 'materialUnit'; materialId: string };

type JobDetailEditPickersProps = {
  typography: TextStyles;
  target: EditPickerTarget | null;
  draft: JobEditDraft;
  onClose: () => void;
  onUpdateSession: (id: string, patch: Partial<DraftSessionRow>) => void;
  onUpdateMaterial: (id: string, patch: Partial<DraftMaterialRow>) => void;
  onUpdateNote: (id: string, patch: Partial<DraftNoteRow>) => void;
  onUpdateOtherCost: (id: string, patch: Partial<DraftOtherCostRow>) => void;
};

function sessionHasExplicitClocks(row: DraftSessionRow): boolean {
  return row.explicitStartClock || row.explicitEndClock;
}

/** Shared synthesis requires a date; keep undated sessions undated in the
 * draft while using today only as an internal wall-clock calculation base. */
function sessionWithSafeDate(row: DraftSessionRow, patch: Partial<DraftSessionRow> = {}) {
  return {
    ...row,
    date: row.date.trim() || todayLocalDateString(),
    ...patch,
  };
}

function sessionListFromDraft(draft: JobEditDraft) {
  return draft.sessions
    .filter((s) => !s.removed)
    .map((s) => ({
      id: s.id,
      dateLabel: s.date
        ? formatLocalDateLabel(s.date)
        : JOB_DETAIL_EMPTY_LABELS.sessionDate,
      durationLabel: s.durationHours > 0 ? formatSessionDurationLabel(s.durationHours) : '',
    }));
}

export function JobDetailEditPickers({
  typography,
  target,
  draft,
  onClose,
  onUpdateSession,
  onUpdateMaterial,
  onUpdateNote,
  onUpdateOtherCost,
}: JobDetailEditPickersProps) {
  const sessionRow = useMemo(
    () =>
      target?.kind === 'sessionDate' ||
      target?.kind === 'sessionDuration' ||
      target?.kind === 'sessionStartTime' ||
      target?.kind === 'sessionEndTime'
        ? draft.sessions.find((s) => s.id === target.sessionId)
        : undefined,
    [draft.sessions, target],
  );

  const costTypeOptions = useMemo<DropdownBottomSheetOption[]>(
    () =>
      OTHER_COST_TYPE_OPTIONS.map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
      })),
    [],
  );

  if (!target) return null;

  if (target.kind === 'sessionDate' && sessionRow) {
    return (
      <SessionDatePickerSheet
        typography={typography}
        visible
        date={
          sessionRow.date
            ? localDateStringToDate(sessionRow.date)
            : new Date()
        }
        onClose={onClose}
        onClear={() => onUpdateSession(sessionRow.id, { date: '' })}
        onSelect={(picked) => {
          const date = dateToLocalDateString(picked);
          if (sessionHasExplicitClocks(sessionRow)) {
            const start = sessionRow.explicitStartClock
              ? combineDateAndTime(picked, new Date(sessionRow.startedAt))
              : null;
            const end = sessionRow.explicitEndClock
              ? combineDateAndTime(picked, new Date(sessionRow.endedAt))
              : null;
            const startedAt = start?.toISOString() ?? sessionRow.startedAt;
            const endedAt = end?.toISOString() ?? sessionRow.endedAt;
            onUpdateSession(sessionRow.id, {
              date,
              startedAt,
              endedAt,
              durationHours:
                sessionRow.explicitStartClock && sessionRow.explicitEndClock
                  ? durationHoursBetween(startedAt, endedAt)
                  : sessionRow.durationHours,
            });
          } else {
            const resolved = resolveSessionDraftTimes({ ...sessionRow, date });
            onUpdateSession(sessionRow.id, {
              date,
              startedAt: resolved.startedAt,
              endedAt: resolved.endedAt,
            });
          }
          onClose();
        }}
      />
    );
  }

  if (target.kind === 'sessionDuration' && sessionRow) {
    return (
      <DropdownBottomSheet
        typography={typography}
        visible
        title="Duration"
        options={DURATION_OPTIONS}
        currentValue={formatDurationPickerValue(sessionRow.durationHours)}
        allowCustom
        customPlaceholder="Hours"
        customMaxLength={6}
        customKeyboardType="decimal-pad"
        customInputMode="decimal"
        onClose={onClose}
        onClear={() => {
          const hasExplicit = sessionRow.explicitStartClock || sessionRow.explicitEndClock;
          if (hasExplicit) {
            onUpdateSession(sessionRow.id, { durationHours: 0 });
            return;
          }
          const resolved = resolveSessionDraftTimes({
            ...sessionWithSafeDate(sessionRow),
            durationHours: 0,
            clockTimesExplicit: false,
          });
          onUpdateSession(sessionRow.id, {
            durationHours: 0,
            startedAt: resolved.startedAt,
            endedAt: resolved.endedAt,
          });
        }}
        onSelect={(value) => {
          const n = Number(value);
          if (!Number.isFinite(n) || n <= 0) {
            onClose();
            return;
          }
          const hours = Math.round(n * 100) / 100;
          if (sessionRow.explicitStartClock) {
            const startedAt = sessionRow.startedAt;
            const endedAt = new Date(
              new Date(startedAt).getTime() + hours * 3_600_000,
            ).toISOString();
            onUpdateSession(sessionRow.id, {
              durationHours: hours,
              clockTimesExplicit: false,
              explicitEndClock: false,
              startedAt,
              endedAt,
            });
          } else {
            const resolved = resolveSessionDraftTimes({
              ...sessionWithSafeDate(sessionRow),
              durationHours: hours,
              clockTimesExplicit: false,
            });
            onUpdateSession(sessionRow.id, {
              durationHours: hours,
              clockTimesExplicit: false,
              explicitEndClock: false,
              startedAt: resolved.startedAt,
              endedAt: resolved.endedAt,
            });
          }
          onClose();
        }}
      />
    );
  }

  if ((target.kind === 'sessionStartTime' || target.kind === 'sessionEndTime') && sessionRow) {
    const field = target.kind === 'sessionStartTime' ? 'start' : 'end';
    const pickerInstant =
      field === 'start'
        ? sessionRow.explicitStartClock
          ? sessionRow.startedAt
          : sessionRow.explicitEndClock
            ? new Date(
                new Date(sessionRow.endedAt).getTime() -
                  sessionRow.durationHours * 3_600_000,
              ).toISOString()
            : sessionRow.startedAt
        : sessionRow.explicitEndClock
          ? sessionRow.endedAt
          : new Date(
              new Date(sessionRow.startedAt).getTime() +
                sessionRow.durationHours * 3_600_000,
            ).toISOString();
    const value = new Date(pickerInstant);

    return (
      <SessionTimePickerSheet
        typography={typography}
        visible
        field={field}
        value={value}
        onClose={onClose}
        onSelect={(picked) => {
          const dateBase = sessionRow.date
            ? localDateStringToDate(sessionRow.date)
            : new Date();
          const startedAt =
            field === 'start'
              ? combineDateAndTime(dateBase, picked).toISOString()
              : sessionRow.startedAt;
          const endedAt =
            field === 'end'
              ? combineDateAndTime(dateBase, picked).toISOString()
              : sessionRow.endedAt;
          const explicitStartClock =
            field === 'start' ? true : sessionRow.explicitStartClock;
          const explicitEndClock = field === 'end' ? true : sessionRow.explicitEndClock;
          const bothClocks = explicitStartClock && explicitEndClock;
          onUpdateSession(sessionRow.id, {
            startedAt,
            endedAt,
            explicitStartClock,
            explicitEndClock,
            clockTimesExplicit: explicitStartClock || explicitEndClock,
            durationHours: bothClocks
              ? durationHoursBetween(startedAt, endedAt)
              : sessionRow.durationHours,
          });
          onClose();
        }}
        onClear={() => {
          const explicitStartClock =
            field === 'start' ? false : sessionRow.explicitStartClock;
          const explicitEndClock = field === 'end' ? false : sessionRow.explicitEndClock;
          const hasExplicit = explicitStartClock || explicitEndClock;
          const resolved = resolveSessionDraftTimes({
            ...sessionWithSafeDate(sessionRow),
            clockTimesExplicit: hasExplicit,
          });
          onUpdateSession(sessionRow.id, {
            explicitStartClock,
            explicitEndClock,
            clockTimesExplicit: explicitStartClock || explicitEndClock,
            startedAt: resolved.startedAt,
            endedAt: resolved.endedAt,
          });
        }}
      />
    );
  }

  if (target.kind === 'attachSession') {
    const sessions = sessionListFromDraft(draft);
    const material =
      target.entity === 'material'
        ? draft.materials.find((m) => m.id === target.entityId)
        : undefined;
    const note =
      target.entity === 'note' ? draft.notes.find((n) => n.id === target.entityId) : undefined;
    const otherCost =
      target.entity === 'otherCost'
        ? draft.otherCosts.find((c) => c.id === target.entityId)
        : undefined;
    const currentSessionId =
      material?.sessionId ?? note?.sessionId ?? otherCost?.sessionId ?? null;

    return (
      <ChooseSessionBottomSheet
        typography={typography}
        visible
        mode={currentSessionId ? 'edit' : 'attach'}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onClose={onClose}
        onClear={() => {
          if (target.entity === 'material') {
            onUpdateMaterial(target.entityId, { sessionId: null });
          } else if (target.entity === 'note') {
            onUpdateNote(target.entityId, { sessionId: null });
          } else {
            onUpdateOtherCost(target.entityId, { sessionId: null });
          }
        }}
        onSelect={(sessionId) => {
          if (target.entity === 'material') {
            onUpdateMaterial(target.entityId, { sessionId });
          } else if (target.entity === 'note') {
            onUpdateNote(target.entityId, { sessionId });
          } else {
            onUpdateOtherCost(target.entityId, { sessionId });
          }
          onClose();
        }}
        onRemove={() => {
          if (target.entity === 'material') {
            onUpdateMaterial(target.entityId, { sessionId: null });
          } else if (target.entity === 'note') {
            onUpdateNote(target.entityId, { sessionId: null });
          } else {
            onUpdateOtherCost(target.entityId, { sessionId: null });
          }
          onClose();
        }}
      />
    );
  }

  if (target.kind === 'costType') {
    const row = draft.otherCosts.find((c) => c.id === target.otherCostId);
    if (!row) return null;
    return (
      <DropdownBottomSheet
        typography={typography}
        visible
        title="Cost type"
        options={costTypeOptions}
        currentValue={row.costType || null}
        onClose={onClose}
        onClear={() => onUpdateOtherCost(target.otherCostId, { costType: '', costTypeExplicit: false })}
        onSelect={(value) => {
          onUpdateOtherCost(target.otherCostId, {
            costType: value as DraftOtherCostRow['costType'],
            costTypeExplicit: true,
          });
          onClose();
        }}
      />
    );
  }

  if (target.kind === 'materialUnit') {
    const row = draft.materials.find((m) => m.id === target.materialId);
    if (!row) return null;
    return (
      <DropdownBottomSheet
        typography={typography}
        visible
        options={UNIT_OPTIONS}
        currentValue={row.unit}
        allowCustom
        customPlaceholder="Custom unit"
        onClose={onClose}
        onSelect={(value) => {
          onUpdateMaterial(target.materialId, { unit: value, showBreakdown: true });
          onClose();
        }}
        onClear={() => {
          onUpdateMaterial(target.materialId, { unit: '' });
        }}
      />
    );
  }

  return null;
}

function SessionDatePickerSheet({
  typography,
  visible,
  date,
  onClose,
  onClear,
  onSelect,
}: {
  typography: TextStyles;
  visible: boolean;
  date: Date;
  onClose: () => void;
  onClear: () => void;
  onSelect: (date: Date) => void;
}) {
  const [value, setValue] = useState(() => startOfDay(date));

  useEffect(() => {
    if (!visible) return;
    setValue(startOfDay(date));
  }, [date, visible]);

  const pickDate = (picked: Date) => onSelect(startOfDay(picked));

  return (
    <BottomSheetShell visible={visible} onClose={() => pickDate(value)}>
      <View style={pickerStyles.body}>
        <EditPickerSheetHeader
          typography={typography}
          onClear={onClear}
          onClose={onClose}
          onDone={() => pickDate(value)}
        />
        <InlineMonthCalendar
          typography={typography}
          value={value}
          onChange={(picked) => {
            setValue(startOfDay(picked));
            pickDate(picked);
          }}
        />
      </View>
    </BottomSheetShell>
  );
}

function SessionTimePickerSheet({
  typography,
  visible,
  field,
  value,
  onClose,
  onSelect,
  onClear,
}: {
  typography: TextStyles;
  visible: boolean;
  field: 'start' | 'end';
  value: Date;
  onClose: () => void;
  onSelect: (time: Date) => void;
  onClear?: () => void;
}) {
  const safeValue =
    value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  const [picked, setPicked] = useState(safeValue);
  const androidOpenedRef = useRef(false);
  const title = field === 'start' ? 'Start time' : 'End time';

  useEffect(() => {
    if (!visible) return;
    setPicked(safeValue);
  }, [safeValue, visible]);

  useEffect(() => {
    if (!visible) {
      androidOpenedRef.current = false;
      return;
    }
    if (Platform.OS !== 'android' || androidOpenedRef.current) return;
    androidOpenedRef.current = true;
    DateTimePickerAndroid.open({
      value: safeValue,
      mode: 'time',
      is24Hour: false,
      onChange: (event: DateTimePickerEvent, selected?: Date) => {
        if (event.type === 'dismissed') {
          onClose();
          return;
        }
        if (selected) onSelect(selected);
      },
    });
  }, [onClose, onSelect, safeValue, visible]);

  if (Platform.OS === 'android') {
    return null;
  }

  const commitTime = () => onSelect(picked);

  return (
    <BottomSheetShell visible={visible} onClose={commitTime}>
      <View style={pickerStyles.body}>
        <EditPickerSheetHeader
          typography={typography}
          title={title}
          onClear={onClear}
          onClose={onClose}
          onDone={commitTime}
        />
        <View style={pickerStyles.timePickerWrap}>
          <DateTimePicker
            value={picked}
            mode="time"
            display="spinner"
            is24Hour={false}
            themeVariant="light"
            onChange={(_e, selected) => {
              if (selected) setPicked(selected);
            }}
            style={pickerStyles.timeSpinner}
            textColor={fg.primary}
          />
        </View>
      </View>
    </BottomSheetShell>
  );
}

const pickerStyles = StyleSheet.create({
  body: {
    width: '100%',
    gap: space('Spacing/12'),
  },
  timePickerWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  timeSpinner: {
    width: '100%',
    height: 216,
    backgroundColor: bg.canvasWarm,
  },
});
