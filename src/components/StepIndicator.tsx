import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font, radius } from '../constants/theme';

interface Props {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: Props) {
  const compact = steps.length > 7;
  return (
    <View style={styles.container}>
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        return (
          <View key={label} style={styles.step}>
            <View
              style={[
                compact ? styles.dotCompact : styles.dot,
                isCompleted && styles.dotCompleted,
                isCurrent && styles.dotCurrent,
              ]}
            >
              <Text
                style={[
                  compact ? styles.dotTextCompact : styles.dotText,
                  (isCompleted || isCurrent) && styles.dotTextActive,
                ]}
              >
                {isCompleted ? '\u2713' : index + 1}
              </Text>
            </View>
            <Text
              style={[
                compact ? styles.labelCompact : styles.label,
                isCurrent && styles.labelCurrent,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {index < steps.length - 1 && (
              <View style={[styles.line, isCompleted && styles.lineCompleted, compact && styles.lineCompact]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  step: {
    flex: 1,
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  dotCurrent: {
    backgroundColor: colors.primary,
  },
  dotText: {
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    color: colors.textTertiary,
  },
  dotTextActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 9,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  labelCurrent: {
    color: colors.primary,
    fontWeight: font.weightSemibold,
  },
  dotCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotTextCompact: {
    fontSize: 9,
    fontWeight: font.weightBold,
    color: colors.textTertiary,
  },
  labelCompact: {
    fontSize: 7,
    color: colors.textTertiary,
    marginTop: 1,
    textAlign: 'center',
  },
  line: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: colors.border,
    zIndex: -1,
  },
  lineCompact: {
    top: 11,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
});
