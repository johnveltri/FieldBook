import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, radius, space } from '@fieldsolo/design-system/lib/tokens';

import { bg, fg, type TextStyles } from '../../theme/nativeTokens';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export type InlineMonthCalendarProps = {
  typography: TextStyles;
  value: Date;
  onChange: (next: Date) => void;
};

/**
 * In-sheet month calendar (works on iOS + Android — native Android DateTimePicker
 * is dialog-only and cannot embed inline like iOS `display="inline"`).
 */
export function InlineMonthCalendar({ typography, value, onChange }: InlineMonthCalendarProps) {
  const selected = useMemo(() => startOfDay(value), [value]);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );
  const today = useMemo(() => startOfDay(new Date()), []);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(visibleMonth),
    [visibleMonth],
  );

  const cells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: Array<Date | null> = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      out.push(new Date(year, month, day));
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [visibleMonth]);

  return (
    <View style={styles.root}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => setVisibleMonth((m) => addMonths(m, -1))}
          style={({ pressed }) => [styles.navHit, pressed && styles.pressed]}
        >
          <Text style={[typography.bodyBold, { color: fg.primary }]}>‹</Text>
        </Pressable>
        <Text style={[typography.bodyBold, styles.monthLabel, { color: fg.primary }]}>
          {monthLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setVisibleMonth((m) => addMonths(m, 1))}
          style={({ pressed }) => [styles.navHit, pressed && styles.pressed]}
        >
          <Text style={[typography.bodyBold, { color: fg.primary }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((label, i) => (
          <Text
            key={`${label}-${i}`}
            style={[typography.bodySmall, styles.weekday, { color: fg.secondary }]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }
          const isSelected = sameDay(day, selected);
          const isToday = sameDay(day, today);
          return (
            <Pressable
              key={day.toISOString()}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={day.toDateString()}
              onPress={() => {
                onChange(startOfDay(day));
                setVisibleMonth(new Date(day.getFullYear(), day.getMonth(), 1));
              }}
              style={({ pressed }) => [styles.dayCell, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.dayInner,
                  isSelected && styles.daySelected,
                  !isSelected && isToday && styles.dayToday,
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    styles.dayLabel,
                    { color: isSelected ? bg.canvasWarm : fg.primary },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: space('Spacing/8'),
    paddingBottom: space('Spacing/8'),
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space('Spacing/4'),
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
  },
  navHit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: radius('Radius/Full'),
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: color('Brand/Primary'),
    borderColor: color('Brand/Primary'),
  },
  dayToday: {
    borderColor: color('Brand/Primary'),
  },
  dayLabel: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 18,
    paddingTop: 0,
    paddingBottom: 0,
  },
  pressed: {
    opacity: 0.75,
  },
});
