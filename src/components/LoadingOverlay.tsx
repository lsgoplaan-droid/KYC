import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../constants/theme';

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  text: {
    marginTop: spacing.md,
    fontSize: font.sizeMd,
    color: colors.textSecondary,
  },
});
