import { useState } from 'react';
import { screenPartnerFull } from '../services/sanctionsService';
import type { Partner, PartnerUbo, ScreeningResult } from '../types';

export function useSanctionsCheck() {
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screen = async (partner: Partner, ubos: PartnerUbo[], apiKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await screenPartnerFull(partner, ubos, apiKey);
      setResults(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Screening failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setResults([]);
    setError(null);
  };

  return { results, isLoading, error, screen, clear };
}
