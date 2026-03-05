import { logger } from '../lib/logger';
import { getCompaniesHouseBase } from '../lib/apiConfig';
import type { FilingHistorySummary, ChargesSummary, CreditCheckResult } from '../types';

const TAG = 'creditService';

const CH_BASE = getCompaniesHouseBase();

function basicAuth(apiKey: string): string {
  const trimmed = apiKey.trim();
  const encoded = typeof btoa === 'function'
    ? btoa(trimmed + ':')
    : Buffer.from(trimmed + ':').toString('base64');
  return `Basic ${encoded}`;
}

export async function getFilingHistory(
  companyNumber: string,
  apiKey: string
): Promise<FilingHistorySummary> {
  const params = new URLSearchParams({ items_per_page: '50' });
  const res = await fetch(`${CH_BASE}/company/${companyNumber}/filing-history?${params}`, {
    headers: { Authorization: basicAuth(apiKey) },
  });

  if (!res.ok) {
    logger.warn(TAG, `Filing history fetch failed: ${res.status}`);
    return { totalFilings: 0, recentFilings: 0, lastFilingDate: null, hasOverdueAccounts: false };
  }

  const data = await res.json();
  const items = data.items ?? [];
  const total = data.total_count ?? items.length;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  let recentCount = 0;
  let lastDate: string | null = null;
  let hasOverdue = false;

  for (const item of items) {
    const dateStr = item.date as string | undefined;
    if (dateStr) {
      if (!lastDate || dateStr > lastDate) lastDate = dateStr;
      if (new Date(dateStr) >= oneYearAgo) recentCount++;
    }
    // Check for overdue indicators
    const desc = ((item.description ?? '') as string).toLowerCase();
    const category = ((item.category ?? '') as string).toLowerCase();
    if (desc.includes('overdue') || category.includes('overdue')) {
      hasOverdue = true;
    }
  }

  return {
    totalFilings: total,
    recentFilings: recentCount,
    lastFilingDate: lastDate,
    hasOverdueAccounts: hasOverdue,
  };
}

export async function getCharges(
  companyNumber: string,
  apiKey: string
): Promise<ChargesSummary> {
  const res = await fetch(`${CH_BASE}/company/${companyNumber}/charges`, {
    headers: { Authorization: basicAuth(apiKey) },
  });

  if (!res.ok) {
    // 404 = no charges registered (normal for many companies)
    if (res.status === 404) {
      return { totalCharges: 0, outstandingCharges: 0, satisfiedCharges: 0 };
    }
    logger.warn(TAG, `Charges fetch failed: ${res.status}`);
    return { totalCharges: 0, outstandingCharges: 0, satisfiedCharges: 0 };
  }

  const data = await res.json();
  const items = data.items ?? [];
  const total = data.total_count ?? items.length;

  let outstanding = 0;
  let satisfied = 0;

  for (const item of items) {
    const status = ((item.status ?? '') as string).toLowerCase();
    if (status === 'outstanding') outstanding++;
    else if (status === 'fully-satisfied' || status === 'satisfied') satisfied++;
  }

  return {
    totalCharges: total,
    outstandingCharges: outstanding,
    satisfiedCharges: satisfied,
  };
}

export async function runCreditCheck(
  companyNumber: string,
  apiKey: string
): Promise<CreditCheckResult> {
  logger.info(TAG, `Running credit check for ${companyNumber}`);

  const [filings, charges] = await Promise.all([
    getFilingHistory(companyNumber, apiKey),
    getCharges(companyNumber, apiKey),
  ]);

  return {
    filings,
    charges,
    jurisdiction: 'gb',
    checkedAt: new Date().toISOString(),
  };
}
