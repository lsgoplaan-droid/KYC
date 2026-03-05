import type {
  Partner, PartnerUbo, ScreeningResult, PartnerDocument,
  RiskAssessment, RiskFactor, RiskLevel, CreditCheckResult,
} from '../types';

function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

function calcCompanyAgeFactor(incorporationDate: string | null): RiskFactor {
  if (!incorporationDate) {
    return { name: 'Company Age', score: 11, weight: 15, detail: 'Incorporation date unknown' };
  }
  const ageYears = (Date.now() - new Date(incorporationDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  let score: number;
  let detail: string;
  if (ageYears >= 10) {
    score = 0;
    detail = `Established ${Math.floor(ageYears)} years ago`;
  } else if (ageYears >= 5) {
    score = 4;
    detail = `${Math.floor(ageYears)} years old`;
  } else if (ageYears >= 2) {
    score = 8;
    detail = `${Math.floor(ageYears)} years old — relatively new`;
  } else {
    score = 15;
    detail = `Less than 2 years old — newly incorporated`;
  }
  return { name: 'Company Age', score, weight: 15, detail };
}

function calcCompanyStatusFactor(status: string | null): RiskFactor {
  if (!status) {
    return { name: 'Company Status', score: 8, weight: 15, detail: 'Status unknown' };
  }
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'open') {
    return { name: 'Company Status', score: 0, weight: 15, detail: 'Active / in good standing' };
  }
  if (normalized.includes('dissolved') || normalized.includes('closed')) {
    return { name: 'Company Status', score: 15, weight: 15, detail: `Status: ${status}` };
  }
  return { name: 'Company Status', score: 8, weight: 15, detail: `Status: ${status}` };
}

function calcCreditFactor(creditResult: CreditCheckResult | null, jurisdiction: string): RiskFactor {
  if (!creditResult || jurisdiction !== 'gb') {
    return { name: 'Credit Health', score: 5, weight: 10, detail: 'Credit check not available for this jurisdiction' };
  }

  let score = 0;
  const details: string[] = [];

  // Filing compliance (0-4 points)
  if (creditResult.filings.hasOverdueAccounts) {
    score += 4;
    details.push('Overdue accounts');
  } else if (creditResult.filings.recentFilings === 0) {
    score += 2;
    details.push('No recent filings');
  } else {
    details.push(`${creditResult.filings.recentFilings} recent filings`);
  }

  // Outstanding charges (0-6 points)
  if (creditResult.charges.outstandingCharges > 3) {
    score += 6;
    details.push(`${creditResult.charges.outstandingCharges} outstanding charges`);
  } else if (creditResult.charges.outstandingCharges > 0) {
    score += 3;
    details.push(`${creditResult.charges.outstandingCharges} outstanding charge(s)`);
  } else {
    details.push('No outstanding charges');
  }

  return { name: 'Credit Health', score, weight: 10, detail: details.join(' · ') };
}

function calcSanctionsFactor(screenings: ScreeningResult[]): RiskFactor {
  const matches = screenings.filter(s => s.is_match);
  if (matches.length > 0) {
    return {
      name: 'Sanctions/PEP',
      score: 30,
      weight: 30,
      detail: `${matches.length} potential sanctions/PEP match(es) found`,
    };
  }
  if (screenings.length === 0) {
    return { name: 'Sanctions/PEP', score: 15, weight: 30, detail: 'Not yet screened' };
  }
  return { name: 'Sanctions/PEP', score: 0, weight: 30, detail: 'No matches found' };
}

function calcUboFactor(ubos: PartnerUbo[]): RiskFactor {
  if (ubos.length === 0) {
    return { name: 'UBO Verification', score: 15, weight: 15, detail: 'No UBOs/directors recorded' };
  }
  const screened = ubos.filter(u => u.screened_at !== null).length;
  const ratio = screened / ubos.length;
  if (ratio >= 1) {
    return { name: 'UBO Verification', score: 0, weight: 15, detail: `All ${ubos.length} UBOs screened` };
  }
  return {
    name: 'UBO Verification',
    score: Math.round((1 - ratio) * 15),
    weight: 15,
    detail: `${screened}/${ubos.length} UBOs screened`,
  };
}

function calcDocumentFactor(docs: PartnerDocument[]): RiskFactor {
  const required = ['incorporation', 'address_proof'] as const;
  const uploaded = required.filter(type => docs.some(d => d.doc_type === type));
  if (uploaded.length >= required.length) {
    return { name: 'Documents', score: 0, weight: 15, detail: 'All required documents uploaded' };
  }
  const missing = required.filter(type => !docs.some(d => d.doc_type === type));
  return {
    name: 'Documents',
    score: Math.round((missing.length / required.length) * 15),
    weight: 15,
    detail: `Missing: ${missing.join(', ')}`,
  };
}

export function calculateRiskScore(
  partner: Partner,
  ubos: PartnerUbo[],
  screenings: ScreeningResult[],
  documents: PartnerDocument[],
  creditResult?: CreditCheckResult | null
): Omit<RiskAssessment, 'id'> {
  const factors: RiskFactor[] = [
    calcCompanyAgeFactor(partner.incorporation_date),
    calcCompanyStatusFactor(partner.company_status),
    calcCreditFactor(creditResult ?? null, partner.jurisdiction_code),
    calcSanctionsFactor(screenings),
    calcUboFactor(ubos),
    calcDocumentFactor(documents),
  ];

  const score = factors.reduce((sum, f) => sum + f.score, 0);

  return {
    partner_id: partner.id,
    score,
    level: getRiskLevel(score),
    factors,
    assessed_at: new Date().toISOString(),
  };
}
