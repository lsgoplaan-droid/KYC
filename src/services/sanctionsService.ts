import { logger } from '../lib/logger';
import { getSanctionsBase, wrapWithCorsProxy } from '../lib/apiConfig';
import type { ScreeningResult, Partner, PartnerUbo } from '../types';
import { saveScreeningResult } from './partnerService';

const TAG = 'sanctionsService';

interface OpenSanctionsMatch {
  id: string;
  caption: string;
  schema: string;
  properties: Record<string, string[]>;
  datasets: string[];
  score: number;
}

export async function screenEntity(
  name: string,
  entityType: 'company' | 'person',
  apiKey: string
): Promise<Array<{ name: string; score: number; datasets: string[]; details: Record<string, unknown> }>> {
  const schema = entityType === 'company' ? 'Company' : 'Person';
  const url = `${getSanctionsBase()}/match/default`;

  const body = {
    queries: {
      q: {
        schema,
        properties: {
          name: [name],
        },
      },
    },
  };

  logger.info(TAG, `Screening ${entityType}: "${name}"`);

  const res = await fetch(wrapWithCorsProxy(url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    logger.error(TAG, `OpenSanctions API error: ${res.status}`);
    throw new Error(`OpenSanctions API error: ${res.status}`);
  }

  const data = await res.json();
  const results: OpenSanctionsMatch[] = data.responses?.q?.results ?? [];

  return results.map((match) => ({
    name: match.caption,
    score: match.score,
    datasets: match.datasets,
    details: {
      id: match.id,
      schema: match.schema,
      properties: match.properties,
    },
  }));
}

export async function screenPartnerFull(
  partner: Partner,
  ubos: PartnerUbo[],
  apiKey: string
): Promise<ScreeningResult[]> {
  const allResults: ScreeningResult[] = [];

  // Screen the company
  try {
    const companyMatches = await screenEntity(partner.company_name, 'company', apiKey);
    for (const match of companyMatches) {
      const result: Omit<ScreeningResult, 'id'> = {
        partner_id: partner.id,
        entity_name: partner.company_name,
        entity_type: 'company',
        source: 'opensanctions',
        match_score: match.score,
        match_details: match.details,
        is_match: match.score >= 0.7,
        screened_at: new Date().toISOString(),
      };
      await saveScreeningResult(result);
      allResults.push({ id: '', ...result });
    }
  } catch (e) {
    logger.error(TAG, 'Company screening failed', e);
  }

  // Screen each UBO/director
  for (const ubo of ubos) {
    try {
      const personMatches = await screenEntity(ubo.full_name, 'person', apiKey);
      for (const match of personMatches) {
        const result: Omit<ScreeningResult, 'id'> = {
          partner_id: partner.id,
          entity_name: ubo.full_name,
          entity_type: 'person',
          source: 'opensanctions',
          match_score: match.score,
          match_details: match.details,
          is_match: match.score >= 0.7,
          screened_at: new Date().toISOString(),
        };
        await saveScreeningResult(result);
        allResults.push({ id: '', ...result });
      }
    } catch (e) {
      logger.error(TAG, `UBO screening failed for ${ubo.full_name}`, e);
    }
  }

  logger.info(TAG, `Screening complete: ${allResults.length} results`, {
    partnerId: partner.id,
    matches: allResults.filter(r => r.is_match).length,
  });

  return allResults;
}
