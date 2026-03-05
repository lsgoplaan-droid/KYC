import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, font, radius } from '../src/constants/theme';
import { StepIndicator } from '../src/components/StepIndicator';
import { FilterChips } from '../src/components/FilterChips';
import { LoadingOverlay } from '../src/components/LoadingOverlay';
import { useCompanyLookup } from '../src/hooks/useCompanyLookup';
import { useApiKeys } from '../src/hooks/useApiKeys';
import { useSanctionsCheck } from '../src/hooks/useSanctionsCheck';
import { useCreditCheck } from '../src/hooks/useCreditCheck';
import * as partnerService from '../src/services/partnerService';
import * as documentService from '../src/services/documentService';
import { calculateRiskScore } from '../src/services/riskService';
import type {
  CompanyLookupResult, Partner, PartnerUbo,
  ScreeningResult, PartnerDocument, Jurisdiction, CreditCheckResult,
} from '../src/types';

const STEPS = ['Company', 'Verify', 'Credit', 'UBOs', 'Screening', 'Docs', 'Risk', 'Decision'];

const JURISDICTIONS: { label: string; value: Jurisdiction }[] = [
  { label: 'UK', value: 'gb' },
  { label: 'Singapore', value: 'sg' },
  { label: 'India', value: 'in' },
];

export default function AddPartnerScreen() {
  const router = useRouter();
  const { companiesHouseKey, openSanctionsKey } = useApiKeys();
  const companyLookup = useCompanyLookup();
  const sanctionsCheck = useSanctionsCheck();
  const creditCheck = useCreditCheck();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('gb');

  const [companyName, setCompanyName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyLookupResult | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [ubos, setUbos] = useState<PartnerUbo[]>([]);
  const [uboName, setUboName] = useState('');
  const [uboRole, setUboRole] = useState<'director' | 'ubo' | 'shareholder'>('director');
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [creditResult, setCreditResult] = useState<CreditCheckResult | null>(null);

  // India manual entry fields
  const [manualAddress, setManualAddress] = useState('');
  const [manualRegNumber, setManualRegNumber] = useState('');
  const [manualStatus, setManualStatus] = useState('active');
  const [manualIncDate, setManualIncDate] = useState('');

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setStepError(null);
    }
  };

  const handleSearch = async () => {
    if (!companyName.trim()) return;
    if (jurisdiction === 'gb' && !companiesHouseKey) return;
    await companyLookup.search(companyName, companiesHouseKey, jurisdiction);
  };

  const handleSelectCompany = (company: CompanyLookupResult) => {
    setSelectedCompany(company);
    setRegNumber(company.registration_number);
    setCompanyName(company.company_name);
    setStep(1);
  };

  const handleManualCompanySelect = () => {
    if (!companyName.trim()) return;
    const manualResult: CompanyLookupResult = {
      company_name: companyName.trim(),
      registration_number: manualRegNumber.trim(),
      jurisdiction_code: 'in',
      status: manualStatus || 'active',
      incorporation_date: manualIncDate || null,
      address: manualAddress.trim(),
      officers: [],
      source: 'manual_entry',
      opencorporates_url: null,
    };
    setSelectedCompany(manualResult);
    setRegNumber(manualRegNumber.trim());
    setStep(1);
  };

  const handleConfirmCompany = async () => {
    if (!selectedCompany) return;
    setStepError(null);
    try {
      setIsSubmitting(true);
      const newPartner = await partnerService.createPartner({
        company_name: selectedCompany.company_name,
        registration_number: selectedCompany.registration_number,
        jurisdiction_code: selectedCompany.jurisdiction_code,
        address: selectedCompany.address,
        incorporation_date: selectedCompany.incorporation_date,
        company_status: selectedCompany.status,
      });
      setPartner(newPartner);
      const officers = await companyLookup.fetchOfficers(
        selectedCompany.registration_number, companiesHouseKey!, jurisdiction
      );
      const createdUbos: PartnerUbo[] = [];
      for (const officer of officers) {
        const ubo = await partnerService.createUbo({
          partner_id: newPartner.id,
          full_name: officer.name,
          role: 'director',
          nationality: officer.nationality,
        });
        createdUbos.push(ubo);
      }
      setUbos(createdUbos);
      setStep(2); // Credit Check step
    } catch (e) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      setStepError(`Failed to create partner: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreditCheck = async () => {
    if (!partner || !companiesHouseKey) return;
    const result = await creditCheck.check(partner.registration_number, companiesHouseKey);
    if (result) setCreditResult(result);
  };

  const handleAddUbo = async () => {
    if (!partner || !uboName.trim()) return;
    try {
      const ubo = await partnerService.createUbo({
        partner_id: partner.id,
        full_name: uboName.trim(),
        role: uboRole,
      });
      setUbos(prev => [...prev, ubo]);
      setUboName('');
    } catch {
      Alert.alert('Error', 'Failed to add UBO');
    }
  };

  const handleScreening = async () => {
    if (!partner || !openSanctionsKey) {
      Alert.alert('Missing Key', 'Please add your OpenSanctions API key in Settings');
      return;
    }
    await partnerService.updateKycStatus(partner.id, 'in_progress');
    const results = await sanctionsCheck.screen(partner, ubos, openSanctionsKey);
    setScreeningResults(results);
    for (const ubo of ubos) {
      await partnerService.updateUbo(ubo.id, { screened_at: new Date().toISOString() });
    }
    setUbos(prev => prev.map(u => ({ ...u, screened_at: new Date().toISOString() })));
  };

  const handleUploadDoc = async (docType: PartnerDocument['doc_type']) => {
    if (!partner) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      const doc = await documentService.uploadDocument(partner.id, file.name, file.uri, docType);
      setDocuments(prev => [...prev, doc]);
    } catch {
      Alert.alert('Error', 'Upload failed');
    }
  };

  const getRisk = () => {
    if (!partner) return null;
    return calculateRiskScore(partner, ubos, screeningResults, documents, creditResult);
  };

  const handleDecision = async (decision: 'verified' | 'flagged' | 'rejected') => {
    if (!partner) return;
    setIsSubmitting(true);
    try {
      const risk = getRisk();
      if (risk) {
        await partnerService.saveRiskAssessment(risk);
        await partnerService.updatePartner(partner.id, {
          risk_score: risk.score,
          risk_level: risk.level,
        });
      }
      await partnerService.updateKycStatus(partner.id, decision);
      Alert.alert('Done', `Partner ${decision}`, [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      // Step 0: Company Search
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Company Information</Text>
            <Text style={styles.label}>Jurisdiction</Text>
            <FilterChips
              filters={JURISDICTIONS}
              activeFilter={jurisdiction}
              onSelect={(v) => { setJurisdiction(v); companyLookup.clear(); setSelectedCompany(null); }}
            />
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder={jurisdiction === 'gb' ? 'Search UK companies' : jurisdiction === 'sg' ? 'Search Singapore companies' : 'Enter company name'}
              placeholderTextColor={colors.textTertiary}
            />
            {/* India: manual entry */}
            {jurisdiction === 'in' && (
              <>
                <Text style={styles.label}>CIN / Registration Number</Text>
                <TextInput style={styles.input} value={manualRegNumber} onChangeText={setManualRegNumber} placeholder="e.g. U12345MH2020PTC123456" placeholderTextColor={colors.textTertiary} />
                <Text style={styles.label}>Address</Text>
                <TextInput style={styles.input} value={manualAddress} onChangeText={setManualAddress} placeholder="Registered office address" placeholderTextColor={colors.textTertiary} />
                <Text style={styles.label}>Incorporation Date</Text>
                <TextInput style={styles.input} value={manualIncDate} onChangeText={setManualIncDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />
                <Text style={styles.infoText}>India (MCA) does not have a free public API. Enter company details manually.</Text>
                <TouchableOpacity style={[styles.primaryBtn, !companyName.trim() && styles.btnDisabled]} onPress={handleManualCompanySelect} disabled={!companyName.trim()}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
            {/* UK: Companies House search */}
            {jurisdiction === 'gb' && (
              <>
                {!companiesHouseKey && <Text style={styles.errorText}>Companies House API key required. Add it in Settings.</Text>}
                <TouchableOpacity style={[styles.primaryBtn, (!companyName.trim() || !companiesHouseKey) && styles.btnDisabled]} onPress={handleSearch} disabled={!companyName.trim() || !companiesHouseKey || companyLookup.isLoading}>
                  <Text style={styles.primaryBtnText}>{companyLookup.isLoading ? 'Searching...' : 'Search Companies House'}</Text>
                </TouchableOpacity>
              </>
            )}
            {/* Singapore: ACRA search */}
            {jurisdiction === 'sg' && (
              <TouchableOpacity style={[styles.primaryBtn, !companyName.trim() && styles.btnDisabled]} onPress={handleSearch} disabled={!companyName.trim() || companyLookup.isLoading}>
                <Text style={styles.primaryBtnText}>{companyLookup.isLoading ? 'Searching...' : 'Search ACRA (Singapore)'}</Text>
              </TouchableOpacity>
            )}
            {companyLookup.error && <Text style={styles.errorText}>{companyLookup.error}</Text>}
            {companyLookup.results.length > 0 && (
              <>
                <Text style={styles.label}>Select a company:</Text>
                {companyLookup.results.map((c, i) => (
                  <TouchableOpacity key={`${c.registration_number}-${i}`} style={styles.resultCard} onPress={() => handleSelectCompany(c)}>
                    <Text style={styles.resultName}>{c.company_name}</Text>
                    <Text style={styles.resultDetail}>{c.registration_number} · {c.jurisdiction_code.toUpperCase()} · {c.status}</Text>
                    {c.address ? <Text style={styles.resultDetail}>{c.address}</Text> : null}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        );

      // Step 1: Verify Company
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Verify Company</Text>
            {selectedCompany && (
              <View style={styles.verifyCard}>
                <Text style={styles.verifyName}>{selectedCompany.company_name}</Text>
                <Text style={styles.verifyDetail}>Reg: {selectedCompany.registration_number}</Text>
                <Text style={styles.verifyDetail}>Status: {selectedCompany.status}</Text>
                <Text style={styles.verifyDetail}>Source: {selectedCompany.source.replace('_', ' ')}</Text>
                <Text style={styles.verifyDetail}>Jurisdiction: {selectedCompany.jurisdiction_code.toUpperCase()}</Text>
                {selectedCompany.incorporation_date && <Text style={styles.verifyDetail}>Incorporated: {selectedCompany.incorporation_date}</Text>}
                {selectedCompany.address && <Text style={styles.verifyDetail}>Address: {selectedCompany.address}</Text>}
              </View>
            )}
            {stepError && <Text style={styles.errorText}>{stepError}</Text>}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmCompany}>
              <Text style={styles.primaryBtnText}>Confirm & Continue</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 2: Credit Check
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Credit Check</Text>
            {jurisdiction === 'gb' ? (
              <>
                <Text style={styles.infoText}>Check filing compliance and outstanding charges for {partner?.company_name}.</Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, (!companiesHouseKey || creditCheck.isLoading) && styles.btnDisabled]}
                  onPress={handleCreditCheck}
                  disabled={!companiesHouseKey || creditCheck.isLoading}
                >
                  <Text style={styles.primaryBtnText}>{creditCheck.isLoading ? 'Checking...' : 'Run Credit Check'}</Text>
                </TouchableOpacity>
                {creditCheck.error && <Text style={styles.errorText}>{creditCheck.error}</Text>}
                {creditResult && (
                  <View style={styles.listSection}>
                    <View style={styles.verifyCard}>
                      <Text style={styles.verifyName}>Filing History</Text>
                      <Text style={styles.verifyDetail}>Total filings: {creditResult.filings.totalFilings}</Text>
                      <Text style={styles.verifyDetail}>Recent filings (12mo): {creditResult.filings.recentFilings}</Text>
                      <Text style={styles.verifyDetail}>Last filing: {creditResult.filings.lastFilingDate ?? 'Unknown'}</Text>
                      <Text style={[styles.verifyDetail, { color: creditResult.filings.hasOverdueAccounts ? colors.error : colors.success }]}>
                        {creditResult.filings.hasOverdueAccounts ? 'Overdue accounts detected' : 'No overdue accounts'}
                      </Text>
                    </View>
                    <View style={styles.verifyCard}>
                      <Text style={styles.verifyName}>Charges / Mortgages</Text>
                      <Text style={styles.verifyDetail}>Total charges: {creditResult.charges.totalCharges}</Text>
                      <Text style={styles.verifyDetail}>Outstanding: {creditResult.charges.outstandingCharges}</Text>
                      <Text style={styles.verifyDetail}>Satisfied: {creditResult.charges.satisfiedCharges}</Text>
                    </View>
                  </View>
                )}
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
                  <Text style={styles.primaryBtnText}>Continue to UBOs</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.infoText}>
                  Credit checking is not available for {jurisdiction === 'sg' ? 'Singapore' : 'India'} companies. This uses Companies House data (UK only).
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(3)}>
                  <Text style={styles.primaryBtnText}>Skip to UBOs</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );

      // Step 3: UBOs & Directors
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>UBOs & Directors</Text>
            {jurisdiction !== 'gb' && ubos.length === 0 && (
              <Text style={styles.infoText}>
                Directors are not available from the {jurisdiction === 'sg' ? 'ACRA' : 'company'} registry. Please add them manually below.
              </Text>
            )}
            {ubos.length > 0 && (
              <View style={styles.listSection}>
                {ubos.map(ubo => (
                  <View key={ubo.id} style={styles.uboCard}>
                    <Text style={styles.uboName}>{ubo.full_name}</Text>
                    <Text style={styles.uboRole}>{ubo.role}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.label}>Add UBO / Director</Text>
            <TextInput style={styles.input} value={uboName} onChangeText={setUboName} placeholder="Full name" placeholderTextColor={colors.textTertiary} />
            <View style={styles.roleRow}>
              {(['director', 'ubo', 'shareholder'] as const).map(role => (
                <TouchableOpacity key={role} style={[styles.roleBtn, uboRole === role && styles.roleBtnActive]} onPress={() => setUboRole(role)}>
                  <Text style={[styles.roleText, uboRole === role && styles.roleTextActive]}>{role.charAt(0).toUpperCase() + role.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.secondaryBtn, !uboName.trim() && styles.btnDisabled]} onPress={handleAddUbo} disabled={!uboName.trim()}>
              <Text style={styles.secondaryBtnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(4)}>
              <Text style={styles.primaryBtnText}>Continue to Screening</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 4: Sanctions Screening
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Sanctions Screening</Text>
            <Text style={styles.infoText}>Screen {partner?.company_name} and {ubos.length} UBO(s) against global sanctions and PEP lists.</Text>
            {!openSanctionsKey && <Text style={styles.errorText}>OpenSanctions API key required. Add it in Settings.</Text>}
            <TouchableOpacity style={[styles.primaryBtn, (!openSanctionsKey || sanctionsCheck.isLoading) && styles.btnDisabled]} onPress={handleScreening} disabled={!openSanctionsKey || sanctionsCheck.isLoading}>
              <Text style={styles.primaryBtnText}>{sanctionsCheck.isLoading ? 'Screening...' : 'Run Screening'}</Text>
            </TouchableOpacity>
            {sanctionsCheck.error && <Text style={styles.errorText}>{sanctionsCheck.error}</Text>}
            {screeningResults.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.label}>Results:</Text>
                {screeningResults.map((r, i) => (
                  <View key={i} style={[styles.resultCard, r.is_match && styles.matchCard]}>
                    <Text style={styles.resultName}>{r.entity_name}</Text>
                    <Text style={styles.resultDetail}>Score: {(r.match_score * 100).toFixed(0)}% · {r.entity_type} · {r.is_match ? 'MATCH' : 'No match'}</Text>
                  </View>
                ))}
              </View>
            )}
            {screeningResults.length > 0 && (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(5)}>
                <Text style={styles.primaryBtnText}>Continue to Documents</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      // Step 5: Document Upload
      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Document Upload</Text>
            {(['incorporation', 'address_proof', 'id_document', 'financial'] as const).map(type => {
              const uploaded = documents.find(d => d.doc_type === type);
              return (
                <View key={type} style={styles.docRow}>
                  <View style={styles.docInfo}>
                    <Text style={styles.docLabel}>{type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                    {uploaded && <Text style={styles.docFile}>{uploaded.file_name}</Text>}
                  </View>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleUploadDoc(type)}>
                    <Text style={styles.secondaryBtnText}>{uploaded ? 'Replace' : 'Upload'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(6)}>
              <Text style={styles.primaryBtnText}>Continue to Risk Assessment</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 6: Risk Assessment
      case 6: {
        const risk = getRisk();
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Risk Assessment</Text>
            {risk && (
              <>
                <View style={[styles.riskScoreBox, { borderColor: colors[`risk${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}` as keyof typeof colors] as string }]}>
                  <Text style={styles.riskScoreNumber}>{risk.score}</Text>
                  <Text style={[styles.riskScoreLevel, { color: colors[`risk${risk.level.charAt(0).toUpperCase() + risk.level.slice(1)}` as keyof typeof colors] as string }]}>{risk.level.toUpperCase()} RISK</Text>
                </View>
                {risk.factors.map((f, i) => (
                  <View key={i} style={styles.factorRow}>
                    <View style={styles.factorHeader}>
                      <Text style={styles.factorName}>{f.name}</Text>
                      <Text style={styles.factorScore}>{f.score}/{f.weight}</Text>
                    </View>
                    <View style={styles.factorBar}>
                      <View style={[styles.factorFill, { width: `${(f.score / f.weight) * 100}%` }, f.score > f.weight * 0.5 ? styles.factorFillHigh : styles.factorFillLow]} />
                    </View>
                    <Text style={styles.factorDetail}>{f.detail}</Text>
                  </View>
                ))}
              </>
            )}
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(7)}>
              <Text style={styles.primaryBtnText}>Make Decision</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // Step 7: Decision
      case 7:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Decision</Text>
            <Text style={styles.infoText}>Review complete for {partner?.company_name}. Select your decision:</Text>
            <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: colors.success }]} onPress={() => handleDecision('verified')}>
              <Text style={styles.decisionBtnText}>Approve (Verified)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: colors.warning }]} onPress={() => handleDecision('flagged')}>
              <Text style={styles.decisionBtnText}>Flag for Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.decisionBtn, { backgroundColor: colors.error }]} onPress={() => handleDecision('rejected')}>
              <Text style={styles.decisionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StepIndicator steps={STEPS} currentStep={step} />
      {step > 0 && (
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>{'< Back'}</Text>
        </TouchableOpacity>
      )}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {renderStep()}
      </ScrollView>
      {isSubmitting && <LoadingOverlay message="Saving..." />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  stepContent: { gap: spacing.md },
  stepTitle: { fontSize: font.sizeXl, fontWeight: font.weightBold, color: colors.textPrimary },
  label: { fontSize: font.sizeMd, fontWeight: font.weightMedium, color: colors.textPrimary, marginTop: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, fontSize: font.sizeMd, color: colors.textPrimary, backgroundColor: colors.surface },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  roleBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleText: { fontSize: font.sizeSm, color: colors.textSecondary, fontWeight: font.weightMedium },
  roleTextActive: { color: '#FFFFFF' },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: font.sizeMd, fontWeight: font.weightSemibold },
  secondaryBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  secondaryBtnText: { color: colors.primary, fontSize: font.sizeSm, fontWeight: font.weightSemibold },
  btnDisabled: { opacity: 0.5 },
  errorText: { color: colors.error, fontSize: font.sizeSm },
  infoText: { color: colors.textSecondary, fontSize: font.sizeMd, lineHeight: 22 },
  resultCard: { backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  matchCard: { borderColor: colors.error, backgroundColor: colors.error + '08' },
  resultName: { fontSize: font.sizeMd, fontWeight: font.weightSemibold, color: colors.textPrimary },
  resultDetail: { fontSize: font.sizeSm, color: colors.textSecondary, marginTop: 2 },
  verifyCard: { backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.md },
  verifyName: { fontSize: font.sizeLg, fontWeight: font.weightBold, color: colors.primaryDark, marginBottom: spacing.xs },
  verifyDetail: { fontSize: font.sizeSm, color: colors.primaryDark, marginTop: 2 },
  listSection: { gap: spacing.sm },
  uboCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  uboName: { fontSize: font.sizeMd, fontWeight: font.weightMedium, color: colors.textPrimary },
  uboRole: { fontSize: font.sizeSm, color: colors.textSecondary, textTransform: 'capitalize' },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  docInfo: { flex: 1, marginRight: spacing.sm },
  docLabel: { fontSize: font.sizeMd, fontWeight: font.weightMedium, color: colors.textPrimary },
  docFile: { fontSize: font.sizeXs, color: colors.success, marginTop: 2 },
  riskScoreBox: { alignItems: 'center', paddingVertical: spacing.lg, borderRadius: radius.lg, borderWidth: 2, backgroundColor: colors.surface },
  riskScoreNumber: { fontSize: 48, fontWeight: font.weightBold, color: colors.textPrimary },
  riskScoreLevel: { fontSize: font.sizeLg, fontWeight: font.weightSemibold, marginTop: spacing.xs },
  factorRow: { backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  factorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  factorName: { fontSize: font.sizeSm, fontWeight: font.weightSemibold, color: colors.textPrimary },
  factorScore: { fontSize: font.sizeSm, color: colors.textSecondary },
  factorBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginBottom: spacing.xs },
  factorFill: { height: 6, borderRadius: 3 },
  factorFillLow: { backgroundColor: colors.success },
  factorFillHigh: { backgroundColor: colors.error },
  factorDetail: { fontSize: font.sizeXs, color: colors.textTertiary },
  decisionBtn: { borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  decisionBtnText: { color: '#FFFFFF', fontSize: font.sizeLg, fontWeight: font.weightBold },
  backBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  backBtnText: { color: colors.primary, fontSize: font.sizeMd, fontWeight: font.weightMedium },
});
