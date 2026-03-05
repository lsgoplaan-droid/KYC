import { View, Text, StyleSheet } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';
import type { KycStatus } from '../types';

const STATUS_CONFIG: Record<KycStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: colors.statusDraft + '20', text: colors.statusDraft },
  in_progress: { label: 'In Progress', bg: colors.statusInProgress + '20', text: colors.statusInProgress },
  verified: { label: 'Verified', bg: colors.statusVerified + '20', text: colors.statusVerified },
  flagged: { label: 'Flagged', bg: colors.statusFlagged + '20', text: colors.statusFlagged },
  rejected: { label: 'Rejected', bg: colors.statusRejected + '20', text: colors.statusRejected },
};

export function StatusBadge({ status }: { status: KycStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  text: {
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
  },
});
