// KYC Status
export type KycStatus = 'draft' | 'in_progress' | 'verified' | 'flagged' | 'rejected';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type Jurisdiction = 'gb' | 'sg' | 'in';
export type JurisdictionCode = string;

// Business partner being verified
export interface Partner {
  id: string;
  company_name: string;
  registration_number: string;
  jurisdiction_code: JurisdictionCode;
  address: string;
  incorporation_date: string | null;
  company_status: string | null;
  kyc_status: KycStatus;
  risk_level: RiskLevel | null;
  risk_score: number | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  notes: string;
}

// UBO / Director linked to a partner
export interface PartnerUbo {
  id: string;
  partner_id: string;
  full_name: string;
  date_of_birth: string | null;
  nationality: string | null;
  role: 'director' | 'ubo' | 'shareholder';
  ownership_percentage: number | null;
  sanctions_clear: boolean | null;
  pep_status: boolean | null;
  screened_at: string | null;
}

// Sanctions/PEP screening result
export interface ScreeningResult {
  id: string;
  partner_id: string;
  entity_name: string;
  entity_type: 'company' | 'person';
  source: string;
  match_score: number;
  match_details: Record<string, unknown>;
  is_match: boolean;
  screened_at: string;
}

// Uploaded document metadata
export interface PartnerDocument {
  id: string;
  partner_id: string;
  doc_type: 'incorporation' | 'address_proof' | 'id_document' | 'financial' | 'other';
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

// Risk assessment
export interface RiskAssessment {
  id: string;
  partner_id: string;
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  assessed_at: string;
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

// Normalized company lookup result (Companies House UK)
export interface CompanyLookupResult {
  company_name: string;
  registration_number: string;
  jurisdiction_code: string;
  status: string;
  incorporation_date: string | null;
  address: string;
  officers: OfficerInfo[];
  source: 'companies_house' | 'acra_sg' | 'manual_entry';
  opencorporates_url: string | null;
}

export interface OfficerInfo {
  name: string;
  role: string;
  appointed_on: string | null;
  nationality: string | null;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  partner_id: string;
  action: string;
  details: string;
  created_at: string;
}

// Credit check types (Companies House filing history + charges)
export interface FilingHistorySummary {
  totalFilings: number;
  recentFilings: number;
  lastFilingDate: string | null;
  hasOverdueAccounts: boolean;
}

export interface ChargesSummary {
  totalCharges: number;
  outstandingCharges: number;
  satisfiedCharges: number;
}

export interface CreditCheckResult {
  filings: FilingHistorySummary;
  charges: ChargesSummary;
  jurisdiction: string;
  checkedAt: string;
}

// Create/update DTOs (without server-generated fields)
export type CreatePartnerData = Pick<Partner,
  'company_name' | 'registration_number' | 'jurisdiction_code' | 'address'
> & Partial<Pick<Partner, 'incorporation_date' | 'company_status' | 'notes'>>;

export type CreateUboData = Pick<PartnerUbo,
  'partner_id' | 'full_name' | 'role'
> & Partial<Pick<PartnerUbo, 'date_of_birth' | 'nationality' | 'ownership_percentage'>>;
