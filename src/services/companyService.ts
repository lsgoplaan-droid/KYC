import { logger } from '../lib/logger';
import { getCompaniesHouseBase } from '../lib/apiConfig';
import type { CompanyLookupResult, OfficerInfo } from '../types';

const TAG = 'companyService';

const CH_BASE = getCompaniesHouseBase();

function basicAuth(apiKey: string): string {
  const trimmed = apiKey.trim();
  const encoded = typeof btoa === 'function'
    ? btoa(trimmed + ':')
    : Buffer.from(trimmed + ':').toString('base64');
  return `Basic ${encoded}`;
}

export async function lookupCompany(
  query: string,
  apiKey: string
): Promise<CompanyLookupResult[]> {
  logger.info(TAG, `Looking up company: "${query}"`);

  const params = new URLSearchParams({ q: query, items_per_page: '10' });

  const res = await fetch(`${CH_BASE}/search/companies?${params}`, {
    headers: { Authorization: basicAuth(apiKey) },
  });

  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    logger.error(TAG, `Companies House error: ${res.status} — ${body}`);
    throw new Error(`Companies House API error: ${res.status}. ${body || 'Check your API key in Settings.'}`);
  }

  const data = await res.json();
  const companies = data.items ?? [];

  return companies.map((item: Record<string, unknown>) => ({
    company_name: (item.title as string) ?? '',
    registration_number: (item.company_number as string) ?? '',
    jurisdiction_code: 'gb',
    status: (item.company_status as string) ?? 'unknown',
    incorporation_date: (item.date_of_creation as string) ?? null,
    address: (item.address_snippet as string) ?? '',
    officers: [],
    source: 'companies_house' as const,
    opencorporates_url: null,
  }));
}

export async function getCompanyOfficers(
  companyNumber: string,
  apiKey: string
): Promise<OfficerInfo[]> {
  try {
    const res = await fetch(`${CH_BASE}/company/${companyNumber}/officers`, {
      headers: { Authorization: basicAuth(apiKey) },
    });
    if (!res.ok) {
      logger.warn(TAG, `Failed to fetch officers: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const officers = data.items ?? [];
    return officers.map((item: Record<string, unknown>) => ({
      name: (item.name as string) ?? '',
      role: (item.officer_role as string) ?? 'officer',
      appointed_on: (item.appointed_on as string) ?? null,
      nationality: (item.nationality as string) ?? null,
    }));
  } catch (e) {
    logger.warn(TAG, 'Officer fetch failed', e);
    return [];
  }
}
