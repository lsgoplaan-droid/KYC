import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { colors, spacing, font, radius } from '../src/constants/theme';
import { useApiKeys } from '../src/hooks/useApiKeys';

export default function SettingsScreen() {
  const {
    companiesHouseKey, openSanctionsKey,
    saveCompaniesHouseKey, saveOpenSanctionsKey,
    removeCompaniesHouseKey, removeOpenSanctionsKey,
  } = useApiKeys();

  const [chInput, setChInput] = useState('');
  const [osInput, setOsInput] = useState('');

  const handleSaveKey = async (type: 'ch' | 'os') => {
    const value = type === 'ch' ? chInput.trim() : osInput.trim();
    if (!value) return;
    if (type === 'ch') { await saveCompaniesHouseKey(value); setChInput(''); }
    else { await saveOpenSanctionsKey(value); setOsInput(''); }
  };

  const handleRemoveKey = (type: 'ch' | 'os') => {
    Alert.alert('Remove API Key', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => type === 'ch' ? removeCompaniesHouseKey() : removeOpenSanctionsKey() },
    ]);
  };

  const maskKey = (key: string | null) => key ? `${key.slice(0, 6)}${'*'.repeat(8)}` : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>API Keys</Text>
      <Text style={styles.sectionHint}>API keys are required for company lookups and sanctions screening.</Text>
      <View style={styles.keySection}>
        <Text style={styles.keyLabel}>Companies House API Key</Text>
        {companiesHouseKey ? (
          <View style={styles.keyDisplay}>
            <Text style={styles.keyValue}>{maskKey(companiesHouseKey)}</Text>
            <TouchableOpacity onPress={() => handleRemoveKey('ch')}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.keyInput}>
            <TextInput style={styles.input} value={chInput} onChangeText={setChInput} placeholder="Enter API key" placeholderTextColor={colors.textTertiary} secureTextEntry />
            <TouchableOpacity style={[styles.saveButton, !chInput.trim() && styles.saveButtonDisabled]} onPress={() => handleSaveKey('ch')} disabled={!chInput.trim()}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.keyHint}>UK company lookups — register at developer.company-information.service.gov.uk</Text>
      </View>
      <View style={styles.keySection}>
        <Text style={styles.keyLabel}>OpenSanctions API Key</Text>
        {openSanctionsKey ? (
          <View style={styles.keyDisplay}>
            <Text style={styles.keyValue}>{maskKey(openSanctionsKey)}</Text>
            <TouchableOpacity onPress={() => handleRemoveKey('os')}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.keyInput}>
            <TextInput style={styles.input} value={osInput} onChangeText={setOsInput} placeholder="Enter API key" placeholderTextColor={colors.textTertiary} secureTextEntry />
            <TouchableOpacity style={[styles.saveButton, !osInput.trim() && styles.saveButtonDisabled]} onPress={() => handleSaveKey('os')} disabled={!osInput.trim()}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.keyHint}>Free for non-commercial use — register at opensanctions.org</Text>
      </View>
      <View style={styles.about}>
        <Text style={styles.aboutTitle}>KYC Partner</Text>
        <Text style={styles.aboutText}>Version 1.0.0</Text>
        <Text style={styles.aboutText}>B2B partner verification with full due diligence</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  sectionTitle: { fontSize: font.sizeXl, fontWeight: font.weightBold, color: colors.textPrimary, marginBottom: spacing.xs },
  sectionHint: { fontSize: font.sizeSm, color: colors.textSecondary, marginBottom: spacing.md },
  keySection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  keyLabel: { fontSize: font.sizeMd, fontWeight: font.weightSemibold, color: colors.textPrimary, marginBottom: spacing.sm },
  keyDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  keyValue: { fontSize: font.sizeSm, color: colors.textSecondary, fontFamily: 'monospace' },
  removeText: { fontSize: font.sizeSm, color: colors.error, fontWeight: font.weightMedium },
  keyInput: { flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, fontSize: font.sizeMd, color: colors.textPrimary, backgroundColor: colors.background },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md, justifyContent: 'center' },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFFFFF', fontWeight: font.weightSemibold, fontSize: font.sizeMd },
  keyHint: { fontSize: font.sizeXs, color: colors.textTertiary, marginTop: spacing.xs },
  about: { alignItems: 'center', paddingVertical: spacing.xl },
  aboutTitle: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.textPrimary, marginBottom: spacing.xs },
  aboutText: { fontSize: font.sizeSm, color: colors.textSecondary },
});
