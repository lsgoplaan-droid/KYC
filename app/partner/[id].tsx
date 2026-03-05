import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { colors, spacing, font, radius } from '../../src/constants/theme';
import { usePartnerDetail } from '../../src/hooks/usePartnerDetail';
import { StatusBadge } from '../../src/components/StatusBadge';
import { RiskIndicator } from '../../src/components/RiskIndicator';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import * as partnerService from '../../src/services/partnerService';
import type { KycStatus } from '../../src/types';

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    partner, ubos, screenings, documents,
    riskAssessment, auditLog, isLoading, refresh,
  } = usePartnerDetail(id);

  if (isLoading) return <LoadingOverlay message="Loading partner..." />;
  if (!partner) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Partner not found</Text>
      </View>
    );
  }

  const handleStatusChange = (newStatus: KycStatus) => {
    Alert.alert(
      'Change Status',
      `Set status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await partnerService.updateKycStatus(partner.id, newStatus);
            refresh();
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: partner.company_name, headerStyle: { backgroundColor: colors.primary }, headerTintColor: '#FFF' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{partner.company_name}</Text>
          <StatusBadge status={partner.kyc_status} />
        </View>
        {partner.risk_level && (
          <RiskIndicator level={partner.risk_level} score={partner.risk_score} />
        )}

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <InfoRow label="Registration" value={partner.registration_number} />
          <InfoRow label="Jurisdiction" value={(partner.jurisdiction_code || '').toUpperCase()} />
          <InfoRow label="Status" value={partner.company_status ?? 'Unknown'} />
          <InfoRow label="Incorporated" value={partner.incorporation_date ?? 'Unknown'} />
          <InfoRow label="Address" value={partner.address || 'Not available'} />
        </View>

        {/* UBOs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UBOs & Directors ({ubos.length})</Text>
          {ubos.length === 0 ? (
            <Text style={styles.emptyText}>No UBOs recorded</Text>
          ) : (
            ubos.map(ubo => (
              <View key={ubo.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{ubo.full_name}</Text>
                  <Text style={styles.itemBadge}>{ubo.role}</Text>
                </View>
                {ubo.nationality && <Text style={styles.itemDetail}>Nationality: {ubo.nationality}</Text>}
                <Text style={[
                  styles.itemDetail,
                  ubo.screened_at ? styles.textSuccess : styles.textWarning,
                ]}>
                  {ubo.screened_at ? `Screened ${new Date(ubo.screened_at).toLocaleDateString()}` : 'Not screened'}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Screening Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sanctions Screening ({screenings.length})</Text>
          {screenings.length === 0 ? (
            <Text style={styles.emptyText}>No screening results</Text>
          ) : (
            screenings.map((s, i) => (
              <View key={i} style={[styles.itemCard, s.is_match && styles.matchCard]}>
                <Text style={styles.itemName}>{s.entity_name}</Text>
                <Text style={styles.itemDetail}>
                  {s.entity_type} · Score: {(s.match_score * 100).toFixed(0)}% · {s.is_match ? 'MATCH' : 'Clear'}
                </Text>
                <Text style={styles.itemDetail}>Source: {s.source}</Text>
              </View>
            ))
          )}
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents ({documents.length})</Text>
          {documents.length === 0 ? (
            <Text style={styles.emptyText}>No documents uploaded</Text>
          ) : (
            documents.map(doc => (
              <View key={doc.id} style={styles.itemCard}>
                <Text style={styles.itemName}>{doc.file_name}</Text>
                <Text style={styles.itemDetail}>
                  {doc.doc_type.replace('_', ' ')} · {new Date(doc.uploaded_at).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Risk Assessment */}
        {riskAssessment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk Assessment</Text>
            <View style={styles.riskBox}>
              <Text style={styles.riskScore}>{riskAssessment.score}/100</Text>
              <Text style={[styles.riskLevel, {
                color: colors[`risk${riskAssessment.level.charAt(0).toUpperCase() + riskAssessment.level.slice(1)}` as keyof typeof colors] as string,
              }]}>
                {riskAssessment.level.toUpperCase()}
              </Text>
            </View>
            {riskAssessment.factors.map((f, i) => (
              <View key={i} style={styles.factorRow}>
                <Text style={styles.factorName}>{f.name}: {f.score}/{f.weight}</Text>
                <Text style={styles.factorDetail}>{f.detail}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Audit Log */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit Log ({auditLog.length})</Text>
          {auditLog.map((entry, i) => (
            <View key={i} style={styles.logEntry}>
              <Text style={styles.logAction}>{entry.action}</Text>
              <Text style={styles.logDetail}>{entry.details}</Text>
              <Text style={styles.logDate}>{new Date(entry.created_at).toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionRow}>
            {partner.kyc_status !== 'verified' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                onPress={() => handleStatusChange('verified')}
              >
                <Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
            )}
            {partner.kyc_status !== 'flagged' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.warning }]}
                onPress={() => handleStatusChange('flagged')}
              >
                <Text style={styles.actionBtnText}>Flag</Text>
              </TouchableOpacity>
            )}
            {partner.kyc_status !== 'rejected' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.error }]}
                onPress={() => handleStatusChange('rejected')}
              >
                <Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    fontSize: font.sizeXxl,
    fontWeight: font.weightBold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: font.sizeSm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: font.sizeSm,
    color: colors.textPrimary,
    fontWeight: font.weightMedium,
    flex: 1,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: font.sizeSm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: font.sizeMd,
    color: colors.error,
  },
  itemCard: {
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    gap: 2,
  },
  matchCard: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: font.sizeMd,
    fontWeight: font.weightMedium,
    color: colors.textPrimary,
  },
  itemBadge: {
    fontSize: font.sizeXs,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  itemDetail: {
    fontSize: font.sizeSm,
    color: colors.textSecondary,
  },
  textSuccess: {
    color: colors.success,
  },
  textWarning: {
    color: colors.warning,
  },
  riskBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  riskScore: {
    fontSize: font.sizeXxl,
    fontWeight: font.weightBold,
    color: colors.textPrimary,
  },
  riskLevel: {
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
  },
  factorRow: {
    gap: 2,
  },
  factorName: {
    fontSize: font.sizeSm,
    fontWeight: font.weightMedium,
    color: colors.textPrimary,
  },
  factorDetail: {
    fontSize: font.sizeXs,
    color: colors.textTertiary,
  },
  logEntry: {
    gap: 1,
  },
  logAction: {
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    color: colors.textPrimary,
  },
  logDetail: {
    fontSize: font.sizeSm,
    color: colors.textSecondary,
  },
  logDate: {
    fontSize: font.sizeXs,
    color: colors.textTertiary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: font.sizeMd,
    fontWeight: font.weightSemibold,
  },
});
