import { logger } from '../lib/logger';
import { getSgProxyBase } from '../lib/apiConfig';
import type { CompanyLookupResult } from '../types';

const TAG = 'companyServiceSg';

const SG_BASE = `${getSgProxyBase()}/api/action/datastore_search`;
const ACRA_RESOURCE_ID = 'd_3f960c10fed6145404ca7b821f263b87';

export async function lookupCompanySg(
  query: string
): Promise<CompanyLookupResult[]> {
  logger.info(TAG, `Looking up Singapore company: "${query}"`);

  const params = new URLSearchParams({
    resource_id: ACRA_RESOURCE_ID,
    q: query,
    limit: '10',
  });

  const res = await fetch(`${SG_BASE}?${params}`);

  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    logger.error(TAG, `data.gov.sg error: ${res.status} — ${body}`);
    throw new Error(`Singapore company search error: ${res.status}`);
  }

  const data = await res.json();
  const records = data?.result?.records ?? [];

  return records.map((item: Record<string, unknown>) => ({
    company_name: (item.entity_name as string) ?? '',
    registration_number: (item.uen as string) ?? '',
    jurisdiction_code: 'sg',
    status: (item.entity_status_description as string) ?? 'unknown',
    incorporation_date: (item.registration_incorporation_date as string) ?? null,
    address: [
      item.reg_street_name,
      item.reg_postal_code,
    ].filter(Boolean).join(', '),
    officers: [],
    source: 'acra_sg' as const,
    opencorporates_url: null,
  }));
}
