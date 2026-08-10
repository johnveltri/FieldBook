import { useFonts } from 'expo-font';
import { PTSerif_700Bold } from '@expo-google-fonts/pt-serif';
import {
  UbuntuSansMono_400Regular,
  UbuntuSansMono_600SemiBold,
  UbuntuSansMono_700Bold,
} from '@expo-google-fonts/ubuntu-sans-mono';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  type UserProfile,
} from '@fieldsolo/api-client';
import { color } from '@fieldsolo/design-system/lib/tokens';

import { CanvasTiledBackground } from '../components/CanvasTiledBackground';
import { shellBottomNavOuterHeight } from '../components/platform/shellDockMetrics';
import {  ChangePasswordBottomSheet,
  DeleteAccountBottomSheet,
  ProfileRowsCard,
  TradeMultiSelectBottomSheet,
  UpdateProfileBottomSheet,
  type ProfileRowsCardRow,
  type UpdateProfileValues,
} from '../components/ds';
import {
  ProfileAccountIcon,
  ProfileEditPencilIcon,
  ProfilePersonalInfoIcon,
  ProfilePlanIcon,
  ProfileTrashIcon,
} from '../components/figma-icons/ProfileScreenIcons';
import { PlatformHeaderAction } from '../components/platform/PlatformHeaderAction';
import { TopHeaderBackIcon } from '../components/figma-icons/TopHeaderIcons';
import { useAuth } from '../context/AuthContext';
import { analytics, changedFields, emailProperties, errorProperties } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { PrivacyChoicesScreen } from './PrivacyChoicesScreen';
import { HelpScreen } from './HelpScreen';
import { OverlaySlideHost } from '../navigation/OverlaySlideHost';
import { TRADE_PRESETS, formatTradesForDisplay } from '../lib/trades';
import {
  bg,
  cardShadowRn,
  createTextStyles,
  fg,
  radius,
  space,
} from '../theme/nativeTokens';
import type { TextStyles } from '../theme/nativeTokens';
import { useContentColumn } from '../theme/useContentColumn';
import { screenHeaderA11y } from '../lib/accessibility';
import { markFeedbackSent, openFeedbackEmail } from '../lib/feedback';
import { useShellChromeOptional } from '../shell/ShellChromeContext';

/** Page back control — scale up Figma `231:837` (24×24 artboard). */
const PROFILE_BACK_ICON_SIZE = 28;

/**
 * Pull a user-readable message off any thrown value. Supabase throws
 * `PostgrestError` objects (`{ message, code, details, hint }`) that are
 * NOT `instanceof Error`, so a naive `e instanceof Error ? e.message : …`
 * check would always fall back to the generic copy and hide the real
 * cause (e.g. RLS violations, network failures, etc).
 */
function extractErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string' && e.length > 0) return e;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return fallback;
}

/** State machine for the stacked bottom sheets — mirrors the JobDetail material flow. */
type ProfileFlow =
  | 'closed'
  | 'editProfile'
  | 'editProfileTrades'
  | 'changePassword'
  | 'deleteAccount';

export type ProfileScreenProps = {
  onBack: () => void;
};

export function ProfileScreen({ onBack }: ProfileScreenProps) {  const insets = useSafeAreaInsets();
  const { columnStyle } = useContentColumn();
  const scrollY = useMemo(() => new Animated.Value(0), []);
  const [scrollContentHeight, setScrollContentHeight] = useState(0);
  const { signOut, session, updatePassword, deleteAccount } = useAuth();

  const [fontsLoaded] = useFonts({
    PTSerif_700Bold,
    UbuntuSansMono_400Regular,
    UbuntuSansMono_600SemiBold,
    UbuntuSansMono_700Bold,
  });

  const typography = useMemo(
    () =>
      createTextStyles({
        serifBold: 'PTSerif_700Bold',
        mono: 'UbuntuSansMono_400Regular',
        monoSemi: 'UbuntuSansMono_600SemiBold',
        monoBold: 'UbuntuSansMono_700Bold',
      }),
    [],
  );

  const headerTopPad = Math.max(insets.top - space('Spacing/12'), 0);
  const bottomNavReservedHeight = shellBottomNavOuterHeight(insets.bottom);

  // --- Profile data ---

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privacyChoicesOpen, setPrivacyChoicesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpMounted, setHelpMounted] = useState(false);
  const [privacyMounted, setPrivacyMounted] = useState(false);
  useEffect(() => {
    if (helpOpen) setHelpMounted(true);
  }, [helpOpen]);
  useEffect(() => {
    if (privacyChoicesOpen) setPrivacyMounted(true);
  }, [privacyChoicesOpen]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchCurrentUserProfile(supabase);
        if (cancelled) return;
        setProfile(p);
        analytics.capture('profile_viewed', {
          profile_complete:
            p != null &&
            [p.firstName, p.lastName].every((v) => (v ?? '').trim().length > 0) &&
            (p.trades ?? []).length > 0,
          trade_count: p?.trades.length ?? 0,
          plan: 'free',
          ...emailProperties(session?.user.email),
        });
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.warn('[Profile] failed to fetch profile', e);
        setProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  // --- Sheet flow ---

  const [flow, setFlow] = useState<ProfileFlow>('closed');
  /**
   * Mount-gate so the slide-down animation can play while the parent's flow
   * has already returned to `closed`. Mirrors the JobDetail pattern.
   */
  const [editProfileMounted, setEditProfileMounted] = useState(false);
  const [changePasswordMounted, setChangePasswordMounted] = useState(false);
  const [deleteAccountMounted, setDeleteAccountMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileSheetsMounted =
    editProfileMounted || changePasswordMounted || deleteAccountMounted;
  const shellChrome = useShellChromeOptional();
  useEffect(() => {
    shellChrome?.setProfileSheetsMounted(profileSheetsMounted);
    return () => shellChrome?.setProfileSheetsMounted(false);
  }, [profileSheetsMounted, shellChrome]);

  /**
   * Parent-owned draft for the Update Profile sheet. The trade picker
   * temporarily hides the Update Profile sheet, so the typed first/last
   * name need to be cached here to survive the round-trip.
   */
  const [editDraft, setEditDraft] = useState<UpdateProfileValues>({
    firstName: '',
    lastName: '',
    trades: [],
  });

  const openEditProfile = useCallback(() => {
    // We deliberately don't early-return when `profile` is null. Users who
    // signed up before the profiles trigger existed (or when the local
    // Supabase hasn't run the migration) won't have a row yet — opening
    // the sheet with empty defaults lets them fill it in, and the save
    // path upserts the row.
    setEditDraft({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      trades: profile?.trades ?? [],
    });
    setEditProfileMounted(true);
    setFlow('editProfile');
    analytics.capture('profile_edit_opened', {
      first_name_present: (profile?.firstName ?? '').trim().length > 0,
      last_name_present: (profile?.lastName ?? '').trim().length > 0,
      trade_count: profile?.trades.length ?? 0,
    });
  }, [profile]);

  const closeEditProfile = useCallback(() => {
    setFlow('closed');
  }, []);

  const openTradePicker = useCallback((current: UpdateProfileValues) => {
    setEditDraft(current);
    setFlow('editProfileTrades');
    analytics.capture('profile_trade_picker_opened', {
      current_trade_count: current.trades.length,
    });
  }, []);

  const returnFromTradePicker = useCallback(
    (nextTrades: string[]) => {
      setEditDraft((cur) => ({ ...cur, trades: nextTrades }));
      setFlow('editProfile');
    },
    [],
  );

  const onSaveProfile = useCallback(
    async (values: UpdateProfileValues) => {
      if (saving) return;
      setSaving(true);
      try {
        const before = {
          firstName: profile?.firstName ?? '',
          lastName: profile?.lastName ?? '',
          trades: (profile?.trades ?? []).join('|'),
        };
        const updated = await updateCurrentUserProfile(supabase, {
          firstName: values.firstName,
          lastName: values.lastName,
          trades: values.trades,
        });
        setProfile(updated);
        setFlow('closed');
        if (session?.user.id) {
          analytics.identify(session.user.id, {
            ...emailProperties(session.user.email),
            trade_count: updated.trades.length,
            profile_complete:
              [updated.firstName, updated.lastName].every((v) => (v ?? '').trim().length > 0) &&
              updated.trades.length > 0,
          });
        }
        analytics.capture('profile_saved', {
          changed_fields: changedFields(before, {
            firstName: values.firstName,
            lastName: values.lastName,
            trades: values.trades.join('|'),
          }),
          trade_count: updated.trades.length,
        });
      } catch (e) {
        analytics.capture('profile_save_failed', {
          changed_fields: changedFields(
            {
              firstName: profile?.firstName ?? '',
              lastName: profile?.lastName ?? '',
              trades: (profile?.trades ?? []).join('|'),
            },
            {
              firstName: values.firstName,
              lastName: values.lastName,
              trades: values.trades.join('|'),
            },
          ),
          trade_count: values.trades.length,
          ...errorProperties(e),
        });
        Alert.alert('Save failed', extractErrorMessage(e, 'Could not save profile.'));
      } finally {
        setSaving(false);
      }
    },
    [profile, saving, session?.user.email, session?.user.id],
  );

  // Change password
  const openChangePassword = useCallback(() => {
    setChangePasswordMounted(true);
    setFlow('changePassword');
  }, []);
  const closeChangePassword = useCallback(() => {
    setFlow('closed');
  }, []);
  const onSubmitNewPassword = useCallback(
    async (newPassword: string) => {
      if (saving) return;
      setSaving(true);
      try {
        analytics.capture('password_change_submitted', { source: 'profile' });
        const { error } = await updatePassword(newPassword);
        if (error) {
          analytics.capture('password_change_failed', {
            source: 'profile',
            ...errorProperties(error),
          });
          Alert.alert('Could not update password', error.message);
          return;
        }
        setFlow('closed');
        analytics.capture('password_change_succeeded', { source: 'profile' });
        Alert.alert('Password updated');
      } finally {
        setSaving(false);
      }
    },
    [saving, updatePassword],
  );

  const openDeleteAccount = useCallback(() => {
    analytics.capture('account_delete_requested', { source: 'profile' });
    setDeleteAccountMounted(true);
    setFlow('deleteAccount');
  }, []);
  const closeDeleteAccount = useCallback(() => {
    setFlow('closed');
  }, []);
  const onDeleteAccountSheetSubmit = useCallback(() => {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            analytics.capture('account_delete_confirmed', { source: 'profile' });
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Could not delete account', error.message);
              return;
            }
            setFlow('closed');
          },
        },
      ],
    );
  }, [deleteAccount]);

  // --- Row construction ---

  const personalInfoRows: ProfileRowsCardRow[] = useMemo(() => {
    const fullName = [profile?.firstName, profile?.lastName]
      .map((s) => (s ?? '').trim())
      .filter((s) => s.length > 0)
      .join(' ');
    return [
      {
        kind: 'field',
        label: 'Name',
        value: fullName.length > 0 ? fullName : '—',
      },
      {
        kind: 'field',
        label: 'Email',
        value: session?.user.email ?? '—',
      },
      {
        kind: 'field',
        label: 'Trade',
        value: formatTradesForDisplay(profile?.trades ?? []),
      },
    ];
  }, [profile, session?.user.email]);

  const planRows: ProfileRowsCardRow[] = useMemo(
    () => [
      {
        kind: 'linkBadge',
        label: 'Current Plan',
        sublabel: 'Free Tier',
        badge: {
          text: 'ACTIVE',
          color: color('Semantic/Status/Success/Text'),
          backgroundColor: color('Semantic/Status/Success/BG'),
        },
        hideChevron: true,
      },
    ],
    [],
  );

  const openPrivacyChoices = useCallback(() => {
    setHelpOpen(false);
    setPrivacyChoicesOpen(true);
  }, []);

  const openHelp = useCallback(() => {
    setPrivacyChoicesOpen(false);
    setHelpOpen(true);
  }, []);

  const sendFeedback = useCallback(() => {
    analytics.capture('feedback_composer_opened', { source: 'profile' });
    void openFeedbackEmail('profile')
      .then(() => {
        if (session?.user.id) void markFeedbackSent(session.user.id).catch(() => {});
      })
      .catch((error) => {
        analytics.capture('feedback_composer_failed', {
          source: 'profile',
          ...errorProperties(error),
        });
        Alert.alert('Email unavailable', `Email us directly at support@fieldsoli.com.`);
      });
  }, [session?.user.id]);

  const accountRows: ProfileRowsCardRow[] = useMemo(
    () => [
      { kind: 'link', label: 'Help', onPress: openHelp },
      { kind: 'link', label: 'Privacy', onPress: openPrivacyChoices },
      { kind: 'link', label: 'Change password', onPress: openChangePassword },
      {
        kind: 'link',
        label: 'Log out',
        onPress: () => void signOut(),
        hideChevron: true,
      },
    ],
    [openChangePassword, openHelp, openPrivacyChoices, signOut],
  );

  const deleteRows: ProfileRowsCardRow[] = useMemo(
    () => [
      {
        kind: 'linkWithIcon',
        label: 'Delete account',
        icon: <ProfileTrashIcon color={color('Semantic/Status/Error/Text')} />,
        tone: 'danger',
        onPress: openDeleteAccount,
      },
    ],
    [openDeleteAccount],
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.root}>
        <CanvasTiledBackground scrollY={scrollY} contentHeight={scrollContentHeight} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CanvasTiledBackground scrollY={scrollY} contentHeight={scrollContentHeight} />
      <Animated.ScrollView
        style={[styles.scroll, { paddingTop: headerTopPad }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: bottomNavReservedHeight + space('Spacing/20'),
            flexGrow: 1,
          },
        ]}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        onContentSizeChange={(_w, h) => setScrollContentHeight(h)}
      >
        <View style={columnStyle}>
          <View style={styles.topHeaderRow}>
            <PlatformHeaderAction
              accessibilityLabel="Back"
              onPress={onBack}
            >
              <TopHeaderBackIcon color={fg.secondary} size={PROFILE_BACK_ICON_SIZE} />
            </PlatformHeaderAction>
            <Text {...screenHeaderA11y()} style={[typography.displayH1, styles.profileTitle]}>
              PROFILE
            </Text>
          </View>

          <View style={styles.bodyWrap}>
            <ProfileSectionHeader
              typography={typography}
              title="Personal Info"
              icon={<ProfilePersonalInfoIcon color={color('Brand/Accent')} />}
              actionLabel="EDIT"
              actionIcon={
                <ProfileEditPencilIcon color={bg.canvasWarm} />
              }
              onActionPress={openEditProfile}
            />
            <ProfileRowsCard typography={typography} rows={personalInfoRows} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send feedback"
              onPress={sendFeedback}
              style={({ pressed }) => [styles.feedbackButton, pressed && styles.pressed]}
            >
              <Text style={[typography.bodyBold, styles.feedbackButtonLabel]}>Send feedback</Text>
            </Pressable>

            <ProfileSectionHeader
              typography={typography}
              title="Plan"
              icon={<ProfilePlanIcon color={color('Brand/Accent')} />}
            />
            <ProfileRowsCard typography={typography} rows={planRows} />

            <ProfileSectionHeader
              typography={typography}
              title="Account"
              icon={<ProfileAccountIcon color={color('Brand/Accent')} />}
            />
            <ProfileRowsCard typography={typography} rows={accountRows} />

            <View style={styles.deleteSpacer} />
            <ProfileRowsCard typography={typography} rows={deleteRows} plain framed={false} />
          </View>
        </View>
      </Animated.ScrollView>

      {editProfileMounted ? (
        <>
          <UpdateProfileBottomSheet
            typography={typography}
            visible={flow === 'editProfile'}
            email={session?.user.email ?? null}
            values={editDraft}
            saving={saving}
            onClose={closeEditProfile}
            onClosed={() => {
              if (flow === 'closed') setEditProfileMounted(false);
            }}
            onBack={closeEditProfile}
            onSave={onSaveProfile}
            onTradesPress={openTradePicker}
          />
          <TradeMultiSelectBottomSheet
            typography={typography}
            visible={flow === 'editProfileTrades'}
            presets={TRADE_PRESETS}
            selected={editDraft.trades}
            onClose={closeEditProfile}
            onClosed={() => {
              if (flow === 'closed') setEditProfileMounted(false);
            }}
            onBack={() => returnFromTradePicker(editDraft.trades)}
            onSubmit={returnFromTradePicker}
          />
        </>
      ) : null}

      {changePasswordMounted ? (
        <ChangePasswordBottomSheet
          typography={typography}
          visible={flow === 'changePassword'}
          saving={saving}
          onClose={closeChangePassword}
          onClosed={() => {
            if (flow === 'closed') setChangePasswordMounted(false);
          }}
          onBack={closeChangePassword}
          onSubmit={onSubmitNewPassword}
        />
      ) : null}

      {deleteAccountMounted ? (
        <DeleteAccountBottomSheet
          typography={typography}
          visible={flow === 'deleteAccount'}
          onClose={closeDeleteAccount}
          onClosed={() => {
            if (flow === 'closed') setDeleteAccountMounted(false);
          }}
          onBack={closeDeleteAccount}
          onSubmit={onDeleteAccountSheetSubmit}
        />
      ) : null}

      {helpMounted ? (
        <OverlaySlideHost
          visible={helpOpen}
          axis="horizontal"
          onRequestClose={() => setHelpOpen(false)}
          onExited={() => setHelpMounted(false)}
        >
          <HelpScreen onBack={() => setHelpOpen(false)} />
        </OverlaySlideHost>
      ) : null}

      {privacyMounted && session?.user.id ? (
        <OverlaySlideHost
          visible={privacyChoicesOpen}
          axis="horizontal"
          onRequestClose={() => setPrivacyChoicesOpen(false)}
          onExited={() => setPrivacyMounted(false)}
        >
          <PrivacyChoicesScreen
            userId={session.user.id}
            onBack={() => setPrivacyChoicesOpen(false)}
          />
        </OverlaySlideHost>
      ) : null}
    </View>
  );
}

/** Section header — leading icon + Metric-S title + optional pill action (Figma `1921:4617`). */
function ProfileSectionHeader({
  typography,
  title,
  icon,
  actionLabel,
  actionIcon,
  onActionPress,
}: {
  typography: TextStyles;
  title: string;
  icon: React.ReactNode;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onActionPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLead}>
        {icon}
        <Text style={typography.titleH3}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onActionPress}
          disabled={!onActionPress}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          {actionIcon}
          <Text style={[typography.pillCompact, styles.actionButtonLabel]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: bg.canvasWarm },
  scroll: { flex: 1, width: '100%', backgroundColor: 'transparent', zIndex: 1 },
  scrollContent: {
    alignItems: 'stretch',
  },
  /** Title + Back — no accent strip (`231:817` variant `Title + Back`). */
  topHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: space('Spacing/32'),
    paddingBottom: space('Spacing/16'),
    gap: space('Spacing/8'),
  },
  profileTitle: {
    flex: 1,
    color: fg.primary,
  },
  bodyWrap: {
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: space('Spacing/8'),
    gap: space('Spacing/12'),
  },
  feedbackButton: {
    alignItems: 'center',
    backgroundColor: color('Brand/Primary'),
    borderRadius: radius('Radius/12'),
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: space('Spacing/20'),
    width: '100%',
  },
  feedbackButtonLabel: {
    color: bg.canvasWarm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space('Spacing/24'),
    paddingBottom: space('Spacing/4'),
    gap: space('Spacing/8'),
  },
  sectionHeaderLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space('Spacing/8'),
    flex: 1,
    minWidth: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space('Spacing/8'),
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: space('Spacing/12'),
    paddingVertical: space('Spacing/8'),
    borderRadius: radius('Radius/12'),
    backgroundColor: fg.primary,
    ...cardShadowRn,
  },
  actionButtonLabel: {
    color: bg.canvasWarm,
  },
  deleteSpacer: {
    height: space('Spacing/4'),
  },
  pressed: { opacity: 0.75 },
});
