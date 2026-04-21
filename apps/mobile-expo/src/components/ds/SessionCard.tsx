import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  color,
  colorWithAlpha,
  radius,
  space,
} from '@fieldbook/design-system/lib/tokens';

import type { JobDetailSession } from '@fieldbook/shared-types';
import { bg, border, fg } from '../../theme/nativeTokens';
import type { TextStyles } from '../../theme/nativeTokens';
import {
  JobDetailIconViewSessionChevron,
  SessionCaptureTileMaterialIcon,
  SessionCaptureTileNoteIcon,
  SessionCaptureTilePhotoIcon,
  SessionCaptureTileVoiceIcon,
  SessionCardEditPencilIcon,
} from '../figma-icons/JobDetailScreenIcons';

type SessionCardProps = {
  session: JobDetailSession;
  typography: TextStyles;
  expanded: boolean;
  onToggle: () => void;
  onEditPress: () => void;
};

type TileKind = 'note' | 'material' | 'photo' | 'voice';

const TILE_LABEL: Record<TileKind, string> = {
  note: 'Note',
  material: 'Material',
  photo: 'Photo',
  voice: 'Voice',
};

function tileIcon(kind: TileKind, tint: string): ReactNode {
  const props = { color: tint };
  switch (kind) {
    case 'note':
      return <SessionCaptureTileNoteIcon {...props} />;
    case 'material':
      return <SessionCaptureTileMaterialIcon {...props} />;
    case 'photo':
      return <SessionCaptureTilePhotoIcon {...props} />;
    case 'voice':
      return <SessionCaptureTileVoiceIcon {...props} />;
  }
}

function tileTint(kind: TileKind): string {
  switch (kind) {
    case 'note':
      return color('Semantic/Activity/Note');
    case 'material':
      return color('Semantic/Activity/Material');
    case 'photo':
      return color('Semantic/Activity/Photo');
    case 'voice':
      return color('Semantic/Activity/Voice');
  }
}

/**
 * Collapsible session row (Figma View Session `1284:577`).
 * Collapsed matches the existing JobDetail list row; expanded exposes EDIT
 * and the read-only capture tile row + "No notes, materials or photos yet" empty state.
 * Capture tiles are display-only (per spec) — no handlers plumbed through yet.
 */
export function SessionCard({
  session,
  typography,
  expanded,
  onToggle,
  onEditPress,
}: SessionCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} session ${session.dateLabel}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.headerPressable}
      >
        <View style={styles.header}>
          <View style={styles.leading}>
            <View style={styles.datePad}>
              <Text style={[typography.bodyBold, { color: fg.primary }]}>
                {session.dateLabel}
              </Text>
            </View>
            <Text style={typography.sessionTimeRange}>{session.timeRangeLabel}</Text>
          </View>
          <View style={styles.trailing}>
            <Text style={[typography.metric, { textTransform: 'none' }]}>
              {session.durationLabel}
            </Text>
            <View style={expanded ? styles.chevronExpanded : undefined}>
              <JobDetailIconViewSessionChevron color={fg.secondary} />
            </View>
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.panel}>
          <View style={styles.editRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit session"
              onPress={onEditPress}
              style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}
            >
              <SessionCardEditPencilIcon color={color('Semantic/Status/Error/Text')} />
              <Text
                style={[
                  typography.bodySmall,
                  { color: color('Semantic/Status/Error/Text') },
                ]}
              >
                EDIT
              </Text>
            </Pressable>
          </View>

          <View style={styles.captureSection}>
            <Text style={[typography.bodySmall, { color: fg.primary }]}>
              Add to Session
            </Text>
            <View style={styles.tileRow}>
              {(['note', 'material', 'photo', 'voice'] as TileKind[]).map((kind) => (
                <View key={kind} style={styles.tile}>
                  {tileIcon(kind, tileTint(kind))}
                  <Text style={[styles.tileLabel, { color: fg.primary }]}>
                    {TILE_LABEL[kind]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.emptyWrap}>
            <Text
              style={[
                typography.bodySmall,
                { color: fg.secondary, textAlign: 'center' },
              ]}
            >
              No notes, materials or photos yet
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: bg.surfaceWhite,
    borderRadius: radius('Radius/16'),
    borderWidth: 1,
    borderColor: border.subtle,
    marginBottom: space('Spacing/8'),
    overflow: 'hidden',
  },
  headerPressable: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space('Spacing/16'),
    paddingVertical: space('Spacing/16'),
    minHeight: space('Spacing/80'),
  },
  leading: { flex: 1, minWidth: 0 },
  datePad: { paddingVertical: space('Spacing/4') },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/12'),
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },

  panel: {
    borderTopWidth: 1,
    borderTopColor: colorWithAlpha('Foundation/Border/Default', 0.05),
    backgroundColor: colorWithAlpha('Foundation/Surface/Subtle', 0.3),
    paddingTop: space('Spacing/16'),
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space('Spacing/16'),
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/8'),
    height: space('Spacing/24'),
    paddingHorizontal: space('Spacing/12'),
    paddingVertical: space('Spacing/4'),
    borderRadius: radius('Radius/Full'),
    backgroundColor: color('Semantic/Status/Error/BG'),
  },
  captureSection: {
    marginTop: space('Spacing/16'),
    paddingHorizontal: space('Spacing/16'),
    gap: space('Spacing/8'),
  },
  tileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/8'),
    flexWrap: 'wrap',
  },
  tile: {
    width: 73.75,
    height: 56,
    borderRadius: radius('Radius/12'),
    borderWidth: 1,
    borderColor: border.subtle,
    backgroundColor: bg.surfaceWhite,
    alignItems: 'center',
    paddingTop: 10,
    gap: 6,
  },
  tileLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    lineHeight: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: space('Spacing/16'),
  },
  pressed: {
    opacity: 0.75,
  },
});
