import { useState, useEffect, useCallback } from 'react';
import * as partnerService from '../services/partnerService';
import type { Partner, KycStatus } from '../types';

export function usePartners(statusFilter?: KycStatus) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await partnerService.getPartners(statusFilter);
      setPartners(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load partners');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { partners, isLoading, error, refresh };
}
