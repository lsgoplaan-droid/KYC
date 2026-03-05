import { useState, useEffect } from 'react';
import { apiKeyStore } from '../storage/apiKeyStore';

export function useApiKeys() {
  const [companiesHouseKey, setCompaniesHouseKey] = useState<string | null>(null);
  const [openSanctionsKey, setOpenSanctionsKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiKeyStore.getCompaniesHouseKey(),
      apiKeyStore.getOpenSanctionsKey(),
    ]).then(([chKey, osKey]) => {
      setCompaniesHouseKey(chKey);
      setOpenSanctionsKey(osKey);
      setIsLoading(false);
    });
  }, []);

  return {
    companiesHouseKey,
    openSanctionsKey,
    isLoading,
    hasKeys: !!companiesHouseKey || !!openSanctionsKey,
    saveCompaniesHouseKey: async (key: string) => {
      await apiKeyStore.saveCompaniesHouseKey(key);
      setCompaniesHouseKey(key);
    },
    saveOpenSanctionsKey: async (key: string) => {
      await apiKeyStore.saveOpenSanctionsKey(key);
      setOpenSanctionsKey(key);
    },
    removeCompaniesHouseKey: async () => {
      await apiKeyStore.deleteCompaniesHouseKey();
      setCompaniesHouseKey(null);
    },
    removeOpenSanctionsKey: async () => {
      await apiKeyStore.deleteOpenSanctionsKey();
      setOpenSanctionsKey(null);
    },
  };
}
