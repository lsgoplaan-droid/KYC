import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type {
  Partner, PartnerUbo, ScreeningResult, PartnerDocument,
  RiskAssessment, CreatePartnerData, CreateUboData, KycStatus,
} from '../types';

const TAG = 'partnerService';

export async function getPartners(statusFilter?: KycStatus): Promise<Partner[]> {
  let query = supabase.from('partners').select('*').order('created_at', { ascending: false });
  if (statusFilter) {
    query = query.eq('kyc_status', statusFilter);
  }
  const { data, error } = await query;
  if (error) {
    logger.error(TAG, 'Failed to fetch partners', error);
    throw error;
  }
  return data ?? [];
}

export async function getPartner(id: string): Promise<Partner | null> {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    logger.error(TAG, 'Failed to fetch partner', error);
    return null;
  }
  return data;
}

export async function getPartnerUbos(partnerId: string): Promise<PartnerUbo[]> {
  const { data, error } = await supabase
    .from('partner_ubos')
    .select('*')
    .eq('partner_id', partnerId);
  if (error) {
    logger.error(TAG, 'Failed to fetch UBOs', error);
    return [];
  }
  return data ?? [];
}

export async function getScreeningResults(partnerId: string): Promise<ScreeningResult[]> {
  const { data, error } = await supabase
    .from('screening_results')
    .select('*')
    .eq('partner_id', partnerId)
    .order('screened_at', { ascending: false });
  if (error) {
    logger.error(TAG, 'Failed to fetch screening results', error);
    return [];
  }
  return data ?? [];
}

export async function getPartnerDocuments(partnerId: string): Promise<PartnerDocument[]> {
  const { data, error } = await supabase
    .from('partner_documents')
    .select('*')
    .eq('partner_id', partnerId);
  if (error) {
    logger.error(TAG, 'Failed to fetch documents', error);
    return [];
  }
  return data ?? [];
}

export async function getRiskAssessment(partnerId: string): Promise<RiskAssessment | null> {
  const { data, error } = await supabase
    .from('risk_assessments')
    .select('*')
    .eq('partner_id', partnerId)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .single();
  if (error) {
    logger.warn(TAG, 'No risk assessment found', error);
    return null;
  }
  return data;
}

export async function createPartner(partnerData: CreatePartnerData): Promise<Partner> {
  const { data, error } = await supabase
    .from('partners')
    .insert({
      ...partnerData,
      kyc_status: 'draft',
    })
    .select()
    .single();
  if (error) {
    logger.error(TAG, 'Failed to create partner', error);
    throw error;
  }
  await addAuditLog(data.id, 'created', 'Partner record created');
  logger.info(TAG, 'Partner created', { id: data.id, name: data.company_name });
  return data;
}

export async function updatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
  const { data, error } = await supabase
    .from('partners')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    logger.error(TAG, 'Failed to update partner', error);
    throw error;
  }
  return data;
}

export async function updateKycStatus(id: string, status: KycStatus): Promise<void> {
  const updates: Partial<Partner> = { kyc_status: status };
  if (status === 'verified') {
    updates.verified_at = new Date().toISOString();
  }
  await updatePartner(id, updates);
  await addAuditLog(id, 'status_changed', `KYC status changed to ${status}`);
}

export async function createUbo(uboData: CreateUboData): Promise<PartnerUbo> {
  const { data, error } = await supabase
    .from('partner_ubos')
    .insert(uboData)
    .select()
    .single();
  if (error) {
    logger.error(TAG, 'Failed to create UBO', error);
    throw error;
  }
  await addAuditLog(uboData.partner_id, 'ubo_added', `UBO added: ${uboData.full_name}`);
  return data;
}

export async function updateUbo(id: string, updates: Partial<PartnerUbo>): Promise<PartnerUbo> {
  const { data, error } = await supabase
    .from('partner_ubos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    logger.error(TAG, 'Failed to update UBO', error);
    throw error;
  }
  return data;
}

export async function deleteUbo(id: string, partnerId: string): Promise<void> {
  const { error } = await supabase.from('partner_ubos').delete().eq('id', id);
  if (error) {
    logger.error(TAG, 'Failed to delete UBO', error);
    throw error;
  }
  await addAuditLog(partnerId, 'ubo_removed', `UBO removed: ${id}`);
}

export async function saveScreeningResult(result: Omit<ScreeningResult, 'id'>): Promise<void> {
  const { error } = await supabase.from('screening_results').insert(result);
  if (error) {
    logger.error(TAG, 'Failed to save screening result', error);
    throw error;
  }
}

export async function saveRiskAssessment(assessment: Omit<RiskAssessment, 'id'>): Promise<void> {
  const { error } = await supabase.from('risk_assessments').insert(assessment);
  if (error) {
    logger.error(TAG, 'Failed to save risk assessment', error);
    throw error;
  }
}

export async function deletePartner(id: string): Promise<void> {
  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) {
    logger.error(TAG, 'Failed to delete partner', error);
    throw error;
  }
}

async function addAuditLog(partnerId: string, action: string, details: string): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    partner_id: partnerId,
    action,
    details,
  });
  if (error) {
    logger.warn(TAG, 'Failed to write audit log', error);
  }
}

export async function getAuditLog(partnerId: string) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  if (error) {
    logger.error(TAG, 'Failed to fetch audit log', error);
    return [];
  }
  return data ?? [];
}
