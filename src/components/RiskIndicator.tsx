import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../constants/theme';
import type { RiskLevel } from '../types';

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: 'Low', color: colors.riskLow },
  medium: { label: 'Medium', color: colors.riskMedium },
  high: { label: 'High', color: colors.riskHigh },
  critical: { label: 'Critical', color: colors.riskCritical },
};

interface Props {
  level: RiskLevel;
  score: number | null;
}

export function RiskIndicator({ level, score }: Props) {
  const config = RISK_CONFIG[level];
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}{score !== null ? ` (${score})` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: font.sizeXs,
    fontWeight: font.weightMedium,
  },
});
