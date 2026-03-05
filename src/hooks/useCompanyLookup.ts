import { useState } from 'react';
import { lookupCompany, getCompanyOfficers } from '../services/companyService';
import { lookupCompanySg } from '../services/companyServiceSg';
import type { CompanyLookupResult, OfficerInfo, Jurisdiction } from '../types';

export function useCompanyLookup() {
  const [results, setResults] = useState<CompanyLookupResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string, apiKey: string | null, jurisdiction: Jurisdiction) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      let data: CompanyLookupResult[];
      switch (jurisdiction) {
        case 'gb':
          if (!apiKey) throw new Error('Companies House API key required');
          data = await lookupCompany(query, apiKey);
          break;
        case 'sg':
          data = await lookupCompanySg(query);
          break;
        case 'in':
          data = []; // India: manual entry, no API
          break;
        default:
          data = [];
      }
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Company lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfficers = async (
    companyNumber: string,
    apiKey: string,
    jurisdiction: Jurisdiction
  ): Promise<OfficerInfo[]> => {
    // Only UK has officer fetching via Companies House
    if (jurisdiction !== 'gb') return [];
    try {
      return await getCompanyOfficers(companyNumber, apiKey);
    } catch {
      return [];
    }
  };

  const clear = () => {
    setResults([]);
    setError(null);
  };

  return { results, isLoading, error, search, fetchOfficers, clear };
}
