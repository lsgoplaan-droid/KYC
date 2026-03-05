import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, font, radius } from '../constants/theme';

interface Filter<T> {
  label: string;
  value: T;
}

interface Props<T> {
  filters: Filter<T>[];
  activeFilter: T;
  onSelect: (value: T) => void;
}

export function FilterChips<T>({ filters, activeFilter, onSelect }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive = filter.value === activeFilter;
        return (
          <TouchableOpacity
            key={String(filter.value)}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(filter.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: font.sizeSm,
    color: colors.textSecondary,
    fontWeight: font.weightMedium,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});
