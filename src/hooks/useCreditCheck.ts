import { useState } from 'react';
import { runCreditCheck } from '../services/creditService';
import type { CreditCheckResult } from '../types';

export function useCreditCheck() {
  const [result, setResult] = useState<CreditCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = async (companyNumber: string, apiKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await runCreditCheck(companyNumber, apiKey);
      setResult(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Credit check failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
  };

  return { result, isLoading, error, check, clear };
}
