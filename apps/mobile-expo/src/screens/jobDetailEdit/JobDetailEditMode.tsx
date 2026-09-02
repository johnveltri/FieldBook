import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ScrollView,
} from 'react-native';
import { color, radius, space } from '@fieldsolo/design-system/lib/tokens';
import type { JobDetailViewModel } from '@fieldsolo/shared-types';
import {
  formatLocalDateLabel,
  formatSessionDurationLabel,
  formatSessionTimeLabel,
  JOB_DETAIL_EMPTY_LABELS,
} from '@fieldsolo/api-client';

import {
  EditAddRow,
  EditEntityBlockScope,
  EditFieldInput,
  EditIconGroup,
  EditIconRow,
  EditKeyboardScrollProvider,
  EditModeScrollView,
  EDIT_KEYBOARD_BOTTOM_CLEARANCE,
  EditMaterialBreakdownRow,
  EditSheet,
  EditSplitFields,
  EditSplitTimeRow,
  EditTappableValue,
  EditTitleField,
  editSheetRowSeparator,
} from '../../components/ds/edit-mode/EditFormRows';
import { EditIconLink, EditIconLocation, EditIconPerson } from '../../components/ds/edit-mode/EditModeIcons';
import { EditSwipeableRow } from '../../components/ds/edit-mode/EditSwipeableRow';
import { PlatformHeaderAction } from '../../components/platform/PlatformHeaderAction';
import {
  JobDetailIconSectionMaterials,
  JobDetailIconSectionNotes,
  JobDetailIconSectionOtherCosts,
  JobDetailIconSectionSessions,
  JobDetailIconTopClose,
} from '../../components/figma-icons/JobDetailScreenIcons';
import { formatUsdCombined } from '../../lib/formatUsd';
import { otherCostTypeLabel, type JobOtherCostType } from '../../lib/otherCostTypes';
import { bg, cardShadowRn, fg } from '../../theme/nativeTokens';
import type { TextStyles } from '../../theme/nativeTokens';
import {
  JobDetailEditPickers,
  type EditPickerTarget,
} from './JobDetailEditPickers';
import {
  buildMaterialUnitPriceBlurPatch,
  materialHasBreakdown,
  useJobEditDraft,
  type DraftMaterialRow,
  type DraftNoteRow,
  type DraftOtherCostRow,
  type DraftSessionRow,
} from './useJobEditDraft';

type JobDetailEditModeProps = {
  job: JobDetailViewModel;
  typography: TextStyles;
  headerTopPad: number;
  bottomInset: number;
  columnStyle: object;
  saving: boolean;
  onBack: () => void;
  onDone: () => void;
  onDeleteJob: () => void;
  editApi: ReturnType<typeof useJobEditDraft>;
};

const iconColor = fg.secondary;

function parseRevenueInput(text: string): number | null {
  const trimmed = text.trim().replace(/[@$,\s]/g, '');
  if (trimmed.length === 0) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function centsToEditText(cents: number): string {
  return (cents / 100).toFixed(2);
}

function revenueCentsToInput(cents: number | null): string {
  if (cents == null || cents <= 0) return '';
  return formatUsdCombined(cents);
}

function formatMoneyFieldOnBlur(text: string, setText: (value: string) => void) {
  const cents = parseRevenueInput(text);
  setText(cents != null && cents > 0 ? formatUsdCombined(cents) : '');
}

function formatUnitPriceFieldOnBlur(text: string, setText: (value: string) => void) {
  const cents = parseRevenueInput(text);
  setText(cents != null ? `@ ${formatUsdCombined(cents)}` : '');
}

function parseQuantityInput(text: string): number | null {
  const cleaned = text.trim().replace(/[^0-9.]/g, '');
  if (cleaned.length === 0 || cleaned === '.') return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function quantityToInput(quantity: number, explicit = false): string {
  if (quantity <= 0 && !explicit) return '';
  return String(quantity);
}

function formatQuantityFieldOnBlur(text: string, setText: (value: string) => void) {
  const quantity = parseQuantityInput(text);
  setText(quantity != null ? String(quantity) : '');
}

function SessionAttachRow({
  typography,
  sessions,
  value,
  onPress,
}: {
  typography: TextStyles;
  sessions: { id: string; dateLabel: string }[];
  value: string | null;
  onPress: () => void;
}) {
  const session = value ? sessions.find((s) => s.id === value) : undefined;
  const displayValue = session ? `${session.dateLabel} Session` : '';

  return (
    <EditTappableValue
      typography={typography}
      value={displayValue}
      placeholder="Unassigned"
      accessibilityLabel="Attach to session"
      onPress={onPress}
    />
  );
}

export function JobDetailEditMode({
  typography,
  headerTopPad,
  bottomInset,
  columnStyle,
  saving,
  onBack,
  onDone,
  onDeleteJob,
  editApi,
}: JobDetailEditModeProps) {
  const {
    draft,
    validation,
    updateDraft,
    addSession,
    addNote,
    addMaterial,
    addOtherCost,
    removeRow,
    updateSession,
    updateNote,
    updateMaterial,
    updateOtherCost,
  } = editApi;

  const [pickerTarget, setPickerTarget] = useState<EditPickerTarget | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const [revenueText, setRevenueText] = useState(() =>
    revenueCentsToInput(draft?.revenueCents ?? null),
  );
  const numericFieldFocusedRef = useRef(false);
  const numericBlurCommitPendingRef = useRef(false);
  const doneWaitingForNumericBlurRef = useRef(false);
  const openPicker = useCallback((target: EditPickerTarget) => {
    Keyboard.dismiss();
    setPickerTarget(target);
  }, []);
  const closePicker = useCallback(() => setPickerTarget(null), []);

  const endedSessionsForPicker = useMemo(
    () =>
      (draft?.sessions ?? [])
        .filter((s) => !s.removed)
        .map((s) => ({
          id: s.id,
          dateLabel: s.date
            ? formatLocalDateLabel(s.date)
            : JOB_DETAIL_EMPTY_LABELS.sessionDate,
        })),
    [draft?.sessions],
  );

  const confirmDeleteJob = useCallback(() => {
    Alert.alert('Delete this job?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete job', style: 'destructive', onPress: onDeleteJob },
    ]);
  }, [onDeleteJob]);

  const handleNumericFieldFocus = useCallback(() => {
    numericFieldFocusedRef.current = true;
  }, []);
  const handleNumericFieldBlur = useCallback(() => {
    numericFieldFocusedRef.current = false;
    numericBlurCommitPendingRef.current = true;
    setTimeout(() => {
      numericBlurCommitPendingRef.current = false;
    }, 0);
    if (!doneWaitingForNumericBlurRef.current) return;

    doneWaitingForNumericBlurRef.current = false;
    // The blur handler has just queued the local-input commit. Save on the
    // next turn so buildPayload observes that committed draft value.
    setTimeout(onDone, 0);
  }, [onDone]);
  const handleDonePress = useCallback(() => {
    if (!numericFieldFocusedRef.current) {
      if (numericBlurCommitPendingRef.current) {
        // Native may blur before it dispatches the Done press. Preserve the
        // same barrier in that ordering as well.
        setTimeout(onDone, 0);
        return;
      }
      onDone();
      return;
    }

    doneWaitingForNumericBlurRef.current = true;
    Keyboard.dismiss();
  }, [onDone]);

  if (!draft) return null;

  const doneDisabled = !validation.canDone || saving;
  const visibleSessions = draft.sessions.filter((s) => !s.removed);
  const visibleMaterials = draft.materials.filter((m) => !m.removed);
  const visibleOtherCosts = draft.otherCosts.filter((c) => !c.removed);
  const visibleNotes = draft.notes.filter((n) => !n.removed);

  return (
    <>
    <View style={styles.flex}>
      <EditKeyboardScrollProvider
        scrollViewRef={scrollRef}
        scrollContentRef={scrollContentRef}
        scrollYRef={scrollYRef}
      >
      <EditModeScrollView
        scrollViewRef={scrollRef}
        scrollYRef={scrollYRef}
        style={styles.flex}
        contentContainerStyle={{
          paddingTop: headerTopPad + space('Spacing/4'),
          paddingBottom: space('Spacing/32') + bottomInset + EDIT_KEYBOARD_BOTTOM_CLEARANCE,
        }}
      >
        <View ref={scrollContentRef} style={columnStyle} collapsable={false}>
          <View style={styles.topHeader}>
            <PlatformHeaderAction
              accessibilityLabel="Close"
              onPress={() => {
                if (!saving) onBack();
              }}
              style={saving ? styles.controlDisabled : undefined}
            >
              <JobDetailIconTopClose color={fg.primary} />
            </PlatformHeaderAction>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              disabled={doneDisabled}
              onPress={handleDonePress}
              style={({ pressed }) => [
                styles.doneButton,
                doneDisabled && styles.doneButtonDisabled,
                pressed && !doneDisabled && styles.pressed,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={bg.canvasWarm} size="small" />
              ) : (
                <Text style={[typography.pillCompact, styles.doneLabel]}>Done</Text>
              )}
            </Pressable>
          </View>

          <EditSheet>
            <EditTitleField
              typography={typography}
              accessibilityLabel="Job title"
              placeholder="Job title"
              value={draft.shortDescription}
              onChangeText={(t) => updateDraft({ shortDescription: t })}
            />
          </EditSheet>

          <EditSheet>
            <EditIconRow icon={<EditIconPerson color={iconColor} />}>
              <EditFieldInput
                typography={typography}
                placeholder="Customer"
                value={draft.customerName}
                opticalNudgeY={-3}
                onChangeText={(t) => updateDraft({ customerName: t })}
              />
            </EditIconRow>
            <EditIconRow icon={<EditIconLocation color={iconColor} />}>
              <EditFieldInput
                typography={typography}
                placeholder="Address"
                value={draft.serviceAddress}
                onChangeText={(t) => updateDraft({ serviceAddress: t })}
                multiline
              />
            </EditIconRow>
            <EditIconRow icon={<JobDetailIconSectionOtherCosts color={iconColor} />}>
              <EditFieldInput
                typography={typography}
                placeholder="Revenue"
                value={revenueText}
                opticalNudgeY={-5}
                keyboardType="decimal-pad"
                inputMode="decimal"
                onFocus={() => {
                  if (draft.revenueCents != null && draft.revenueCents > 0) {
                    setRevenueText(centsToEditText(draft.revenueCents));
                  }
                  handleNumericFieldFocus();
                }}
                onBlur={() => {
                  const revenueCents = parseRevenueInput(revenueText);
                  formatMoneyFieldOnBlur(revenueText, setRevenueText);
                  updateDraft({ revenueCents });
                  handleNumericFieldBlur();
                }}
                onChangeText={setRevenueText}
              />
            </EditIconRow>
          </EditSheet>

          <EditSheet>
            {visibleSessions.map((row, index) => (
                <SessionEditBlock
                  key={row.id}
                  row={row}
                  typography={typography}
                  showTopBorder={index > 0}
                  onDelete={() => {
                    if (!saving) removeRow('sessions', row.id);
                  }}
                  onOpenPicker={openPicker}
                />
              ))}
            <EditAddRow
              typography={typography}
              icon={<JobDetailIconSectionSessions color={iconColor} />}
              label="Add session"
              onPress={addSession}
              showTopBorder={visibleSessions.length > 0}
            />
          </EditSheet>

          <EditSheet>
            {visibleMaterials.map((row, index) => (
                <MaterialEditBlock
                  key={row.id}
                  row={row}
                  typography={typography}
                  sessions={endedSessionsForPicker}
                  showTopBorder={index > 0}
                  onDelete={() => {
                    if (!saving) removeRow('materials', row.id);
                  }}
                  onChange={(patch) => updateMaterial(row.id, patch)}
                  onOpenPicker={openPicker}
                  onNumericFieldFocus={handleNumericFieldFocus}
                  onNumericFieldBlur={handleNumericFieldBlur}
                />
              ))}
            <EditAddRow
              typography={typography}
              icon={<JobDetailIconSectionMaterials color={iconColor} />}
              label="Add material"
              onPress={addMaterial}
              showTopBorder={visibleMaterials.length > 0}
            />
          </EditSheet>

          <EditSheet>
            {visibleOtherCosts.map((row, index) => (
                <OtherCostEditBlock
                  key={row.id}
                  row={row}
                  typography={typography}
                  sessions={endedSessionsForPicker}
                  showTopBorder={index > 0}
                  onDelete={() => {
                    if (!saving) removeRow('otherCosts', row.id);
                  }}
                  onChange={(patch) => updateOtherCost(row.id, patch)}
                  onOpenPicker={openPicker}
                  onNumericFieldFocus={handleNumericFieldFocus}
                  onNumericFieldBlur={handleNumericFieldBlur}
                />
              ))}
            <EditAddRow
              typography={typography}
              icon={<JobDetailIconSectionOtherCosts color={iconColor} />}
              label="Add other cost"
              onPress={addOtherCost}
              showTopBorder={visibleOtherCosts.length > 0}
            />
          </EditSheet>

          <EditSheet>
            {visibleNotes.map((row, index) => (
                <NoteEditBlock
                  key={row.id}
                  row={row}
                  typography={typography}
                  sessions={endedSessionsForPicker}
                  showTopBorder={index > 0}
                  onDelete={() => {
                    if (!saving) removeRow('notes', row.id);
                  }}
                  onChange={(patch) => updateNote(row.id, patch)}
                  onOpenPicker={openPicker}
                />
              ))}
            <EditAddRow
              typography={typography}
              icon={<JobDetailIconSectionNotes color={iconColor} />}
              label="Add note"
              onPress={addNote}
              showTopBorder={visibleNotes.length > 0}
            />
          </EditSheet>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete job"
            disabled={saving}
            onPress={confirmDeleteJob}
            style={({ pressed }) => [
              styles.deleteJob,
              saving && styles.controlDisabled,
              pressed && !saving && styles.pressed,
            ]}
          >
            <Text style={[typography.body, { color: color('Semantic/Status/Error/Text') }]}>
              Delete job
            </Text>
          </Pressable>
        </View>
      </EditModeScrollView>
      </EditKeyboardScrollProvider>
    </View>

    <JobDetailEditPickers
      typography={typography}
      target={pickerTarget}
      draft={draft}
      onClose={closePicker}
      onUpdateSession={updateSession}
      onUpdateMaterial={updateMaterial}
      onUpdateNote={updateNote}
      onUpdateOtherCost={updateOtherCost}
    />
    </>
  );
}

function EntityBlock({
  typography,
  onDelete,
  accessibilityLabel,
  showTopBorder = false,
  dockRef,
  children,
}: {
  typography: TextStyles;
  onDelete: () => void;
  accessibilityLabel: string;
  showTopBorder?: boolean;
  dockRef?: React.RefObject<View | null>;
  children: React.ReactNode;
}) {
  return (
    <EditSwipeableRow
      typography={typography}
      onDelete={onDelete}
      accessibilityLabel={accessibilityLabel}
    >
      <EditEntityBlockScope dockRef={dockRef}>
        <View style={showTopBorder ? editSheetRowSeparator : undefined}>{children}</View>
      </EditEntityBlockScope>
    </EditSwipeableRow>
  );
}

function SessionEditBlock({
  row,
  typography,
  showTopBorder,
  onDelete,
  onOpenPicker,
}: {
  row: DraftSessionRow;
  typography: TextStyles;
  showTopBorder?: boolean;
  onDelete: () => void;
  onOpenPicker: (target: EditPickerTarget) => void;
}) {
  const openSessionStartTime = () =>
    onOpenPicker({ kind: 'sessionStartTime', sessionId: row.id });
  const openSessionEndTime = () => onOpenPicker({ kind: 'sessionEndTime', sessionId: row.id });

  return (
    <EntityBlock
      typography={typography}
      showTopBorder={showTopBorder}
      onDelete={onDelete}
      accessibilityLabel="Session"
    >
      <EditIconGroup icon={<JobDetailIconSectionSessions color={iconColor} />}>
        <EditTappableValue
          typography={typography}
          value={row.date ? formatLocalDateLabel(row.date) : ''}
          placeholder="Date"
          accessibilityLabel="Session date"
          onPress={() => onOpenPicker({ kind: 'sessionDate', sessionId: row.id })}
        />
        <EditTappableValue
          typography={typography}
          value={row.durationHours > 0 ? formatSessionDurationLabel(row.durationHours) : ''}
          placeholder="Duration"
          accessibilityLabel="Session duration"
          onPress={() => onOpenPicker({ kind: 'sessionDuration', sessionId: row.id })}
        />
        <EditSplitTimeRow
          typography={typography}
          startValue={row.explicitStartClock ? formatSessionTimeLabel(row.startedAt) : ''}
          endValue={row.explicitEndClock ? formatSessionTimeLabel(row.endedAt) : ''}
          onPressStart={openSessionStartTime}
          onPressEnd={openSessionEndTime}
        />
      </EditIconGroup>
    </EntityBlock>
  );
}

function MaterialEditBlock({
  row,
  typography,
  sessions,
  showTopBorder,
  onDelete,
  onChange,
  onOpenPicker,
  onNumericFieldFocus,
  onNumericFieldBlur,
}: {
  row: DraftMaterialRow;
  typography: TextStyles;
  sessions: { id: string; dateLabel: string }[];
  showTopBorder?: boolean;
  onDelete: () => void;
  onChange: (patch: Partial<DraftMaterialRow>) => void;
  onOpenPicker: (target: EditPickerTarget) => void;
  onNumericFieldFocus: () => void;
  onNumericFieldBlur: () => void;
}) {
  const [totalCostText, setTotalCostText] = useState(() =>
    revenueCentsToInput(row.totalCostCents),
  );
  const [unitPriceText, setUnitPriceText] = useState(() =>
    row.unitCostExplicit ? `@ ${formatUsdCombined(row.unitCostCents)}` : '',
  );
  const [quantityText, setQuantityText] = useState(() =>
    quantityToInput(row.quantity, row.quantityExplicit),
  );
  const [isTotalCostFocused, setIsTotalCostFocused] = useState(false);
  const hasCompleteBreakdown = row.quantityExplicit && row.unitCostExplicit;
  const displayedTotalCents = hasCompleteBreakdown
    ? Math.round(row.quantity * row.unitCostCents)
    : row.totalCostCents;
  const totalCostDisplay =
    displayedTotalCents > 0 || hasCompleteBreakdown
      ? `${formatUsdCombined(displayedTotalCents)} total`
      : '';

  useEffect(() => {
    if (!materialHasBreakdown(row)) return;
    setTotalCostText(revenueCentsToInput(row.totalCostCents));
  }, [row.quantity, row.unitCostCents, row.totalCostCents, row.showBreakdown, row.unit]);

  return (
    <EntityBlock
      typography={typography}
      showTopBorder={showTopBorder}
      onDelete={onDelete}
      accessibilityLabel="Material"
    >
      <EditIconGroup icon={<JobDetailIconSectionMaterials color={iconColor} />}>
        <EditFieldInput
          typography={typography}
          value={row.description}
          opticalNudgeY={-4}
          onChangeText={(description) => onChange({ description })}
          placeholder="Material"
        />
        <EditFieldInput
          typography={typography}
          placeholder="Total cost"
          accessibilityLabel="Total cost"
          value={
            isTotalCostFocused && !hasCompleteBreakdown ? totalCostText : totalCostDisplay
          }
          keyboardType="decimal-pad"
          inputMode="decimal"
          editable={!hasCompleteBreakdown}
          style={hasCompleteBreakdown ? { color: fg.secondary } : undefined}
          onFocus={() => {
            if (row.totalCostCents > 0) {
              setTotalCostText(centsToEditText(row.totalCostCents));
            }
            setIsTotalCostFocused(true);
            onNumericFieldFocus();
          }}
          onBlur={() => {
            formatMoneyFieldOnBlur(totalCostText, setTotalCostText);
            onChange({ totalCostCents: parseRevenueInput(totalCostText) ?? 0 });
            setIsTotalCostFocused(false);
            onNumericFieldBlur();
          }}
          onChangeText={setTotalCostText}
        />
        <EditMaterialBreakdownRow
          unitPrice={
            <EditFieldInput
              typography={typography}
              placeholder="Unit Price"
              accessibilityLabel="Unit price"
              value={unitPriceText}
              keyboardType="decimal-pad"
              inputMode="decimal"
              onFocus={() => {
                if (row.unitCostExplicit) {
                  setUnitPriceText(centsToEditText(row.unitCostCents));
                }
                onNumericFieldFocus();
              }}
              onBlur={() => {
                const unitCostCents = parseRevenueInput(unitPriceText) ?? 0;
                const unitCostExplicit = unitPriceText.trim().length > 0;
                formatUnitPriceFieldOnBlur(unitPriceText, setUnitPriceText);
                onChange(
                  buildMaterialUnitPriceBlurPatch(
                    row,
                    unitCostCents,
                    unitCostExplicit,
                  ),
                );
                onNumericFieldBlur();
              }}
              onChangeText={setUnitPriceText}
            />
          }
          quantity={
            <EditFieldInput
              typography={typography}
              placeholder="Quantity"
              accessibilityLabel="Quantity"
              value={quantityText}
              keyboardType="decimal-pad"
              inputMode="decimal"
              onFocus={onNumericFieldFocus}
              onBlur={() => {
                const quantity = parseQuantityInput(quantityText) ?? 0;
                const quantityExplicit = quantityText.trim().length > 0;
                formatQuantityFieldOnBlur(quantityText, setQuantityText);
                const keepBreakdown =
                  quantityExplicit || row.unitCostExplicit || !!row.unit.trim();
                const patch: Partial<DraftMaterialRow> = {
                  quantity,
                  quantityExplicit,
                  showBreakdown: keepBreakdown,
                };
                onChange(patch);
                onNumericFieldBlur();
              }}
              onChangeText={(text) => {
                setQuantityText(text);
              }}
            />
          }
          unit={
            <EditTappableValue
              typography={typography}
              value={row.unit}
              placeholder="UOM"
              accessibilityLabel="Unit of measure"
              opticalNudgeY={2}
              onPress={() => onOpenPicker({ kind: 'materialUnit', materialId: row.id })}
            />
          }
        />
      </EditIconGroup>
      <EditIconRow icon={<EditIconLink color={iconColor} />}>
        <SessionAttachRow
          typography={typography}
          sessions={sessions}
          value={row.sessionId}
          onPress={() =>
            onOpenPicker({ kind: 'attachSession', entity: 'material', entityId: row.id })
          }
        />
      </EditIconRow>
    </EntityBlock>
  );
}

function OtherCostEditBlock({
  row,
  typography,
  sessions,
  showTopBorder,
  onDelete,
  onChange,
  onOpenPicker,
  onNumericFieldFocus,
  onNumericFieldBlur,
}: {
  row: DraftOtherCostRow;
  typography: TextStyles;
  sessions: { id: string; dateLabel: string }[];
  showTopBorder?: boolean;
  onDelete: () => void;
  onChange: (patch: Partial<DraftOtherCostRow>) => void;
  onOpenPicker: (target: EditPickerTarget) => void;
  onNumericFieldFocus: () => void;
  onNumericFieldBlur: () => void;
}) {
  const [amountText, setAmountText] = useState(() => revenueCentsToInput(row.costCents));

  return (
    <EntityBlock
      typography={typography}
      showTopBorder={showTopBorder}
      onDelete={onDelete}
      accessibilityLabel="Other cost"
    >
      <EditIconGroup icon={<JobDetailIconSectionOtherCosts color={iconColor} />}>
        <EditTappableValue
          typography={typography}
          value={
            row.costType ? otherCostTypeLabel(row.costType as JobOtherCostType) : ''
          }
          placeholder="Cost type"
          accessibilityLabel="Cost type"
          onPress={() => onOpenPicker({ kind: 'costType', otherCostId: row.id })}
        />
        <EditFieldInput
          typography={typography}
          placeholder="Amount"
          accessibilityLabel="Amount"
          value={amountText}
          opticalNudgeY={-5}
          keyboardType="decimal-pad"
          inputMode="decimal"
          onFocus={() => {
            if (row.costCents > 0) {
              setAmountText(centsToEditText(row.costCents));
            }
            onNumericFieldFocus();
          }}
          onBlur={() => {
            formatMoneyFieldOnBlur(amountText, setAmountText);
            onChange({ costCents: parseRevenueInput(amountText) ?? 0 });
            onNumericFieldBlur();
          }}
          onChangeText={setAmountText}
        />
        <EditFieldInput
          typography={typography}
          value={row.description}
          onChangeText={(description) => onChange({ description })}
          placeholder="Description"
        />
      </EditIconGroup>
      <EditIconRow icon={<EditIconLink color={iconColor} />}>
        <SessionAttachRow
          typography={typography}
          sessions={sessions}
          value={row.sessionId}
          onPress={() =>
            onOpenPicker({ kind: 'attachSession', entity: 'otherCost', entityId: row.id })
          }
        />
      </EditIconRow>
    </EntityBlock>
  );
}

function NoteEditBlock({
  row,
  typography,
  sessions,
  showTopBorder,
  onDelete,
  onChange,
  onOpenPicker,
}: {
  row: DraftNoteRow;
  typography: TextStyles;
  sessions: { id: string; dateLabel: string }[];
  showTopBorder?: boolean;
  onDelete: () => void;
  onChange: (patch: Partial<DraftNoteRow>) => void;
  onOpenPicker: (target: EditPickerTarget) => void;
}) {
  const dockRef = useRef<View>(null);

  return (
    <EntityBlock
      typography={typography}
      showTopBorder={showTopBorder}
      onDelete={onDelete}
      accessibilityLabel="Note"
      dockRef={dockRef}
    >
      <EditIconGroup icon={<JobDetailIconSectionNotes color={iconColor} />}>
        <EditFieldInput
          typography={typography}
          value={row.body}
          onChangeText={(body) => onChange({ body })}
          placeholder="Note"
          multiline
        />
      </EditIconGroup>
      <EditIconRow icon={<EditIconLink color={iconColor} />}>
        <View ref={dockRef} collapsable={false}>
          <SessionAttachRow
            typography={typography}
            sessions={sessions}
            value={row.sessionId}
            onPress={() => onOpenPicker({ kind: 'attachSession', entity: 'note', entityId: row.id })}
          />
        </View>
      </EditIconRow>
    </EntityBlock>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space('Spacing/4'),
  },
  doneButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space('Spacing/16'),
    paddingVertical: space('Spacing/8'),
    borderRadius: radius('Radius/12'),
    backgroundColor: color('Brand/Primary'),
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadowRn,
  },
  doneButtonDisabled: {
    opacity: 0.45,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  doneLabel: {
    color: bg.canvasWarm,
  },
  pressed: { opacity: 0.75 },
  deleteJob: {
    marginTop: space('Spacing/24'),
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
});
