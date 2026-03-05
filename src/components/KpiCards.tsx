import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, font, radius } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import type { Partner } from '../types';

interface Props {
  partners: Partner[];
}

const CARDS = [
  { label: 'Total Partners', key: 'total', color: colors.primary },
  { label: 'Pending Review', key: 'pending', color: colors.statusInProgress },
  { label: 'Flagged', key: 'flagged', color: colors.statusFlagged },
  { label: 'Verified', key: 'verified', color: colors.statusVerified },
] as const;

function getCounts(partners: Partner[]) {
  return {
    total: partners.length,
    pending: partners.filter(p => p.kyc_status === 'draft' || p.kyc_status === 'in_progress').length,
    flagged: partners.filter(p => p.kyc_status === 'flagged').length,
    verified: partners.filter(p => p.kyc_status === 'verified').length,
  };
}

export function KpiCards({ partners }: Props) {
  const counts = getCounts(partners);
  const { isWideScreen } = useResponsiveLayout();

  const cards = CARDS.map(card => (
    <View key={card.key} style={[styles.card, { borderLeftColor: card.color }, isWideScreen && styles.cardWide]}>
      <Text style={styles.count}>{counts[card.key]}</Text>
      <Text style={styles.label}>{card.label}</Text>
    </View>
  ));

  if (isWideScreen) {
    return <View style={styles.row}>{cards}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {cards}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 140,
  },
  cardWide: {
    flex: 1,
    minWidth: 0,
  },
  count: {
    fontSize: font.sizeXxl,
    fontWeight: font.weightBold,
    color: colors.textPrimary,
  },
  label: {
    fontSize: font.sizeXs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
