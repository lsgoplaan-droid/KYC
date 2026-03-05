import { Platform } from 'react-native';
import { logger } from '../lib/logger';

const TAG = 'apiKeyStore';

const KEYS = {
  companiesHouse: 'kyc_companies_house_key',
  openSanctions: 'kyc_opensanctions_key',
} as const;

type ApiKeyName = keyof typeof KEYS;

async function getSecureStore() {
  if (Platform.OS === 'web') return null;
  return await import('expo-secure-store');
}

async function getKey(name: ApiKeyName): Promise<string | null> {
  const storageKey = KEYS[name];

  // Check for bundled env key first
  if (name === 'companiesHouse') {
    const envKey = process.env.EXPO_PUBLIC_COMPANIES_HOUSE_API_KEY;
    if (envKey) return envKey;
  }
  if (name === 'openSanctions') {
    const envKey = process.env.EXPO_PUBLIC_OPENSANCTIONS_API_KEY;
    if (envKey) return envKey;
  }

  try {
    const secureStore = await getSecureStore();
    if (secureStore) {
      return await secureStore.getItemAsync(storageKey);
    }
    // Web fallback
    return localStorage.getItem(storageKey);
  } catch (e) {
    logger.error(TAG, `Failed to get key: ${name}`, e);
    return null;
  }
}

async function saveKey(name: ApiKeyName, value: string): Promise<void> {
  const storageKey = KEYS[name];
  try {
    const secureStore = await getSecureStore();
    if (secureStore) {
      await secureStore.setItemAsync(storageKey, value);
    } else {
      localStorage.setItem(storageKey, value);
    }
    logger.info(TAG, `Saved key: ${name}`);
  } catch (e) {
    logger.error(TAG, `Failed to save key: ${name}`, e);
  }
}

async function deleteKey(name: ApiKeyName): Promise<void> {
  const storageKey = KEYS[name];
  try {
    const secureStore = await getSecureStore();
    if (secureStore) {
      await secureStore.deleteItemAsync(storageKey);
    } else {
      localStorage.removeItem(storageKey);
    }
    logger.info(TAG, `Deleted key: ${name}`);
  } catch (e) {
    logger.error(TAG, `Failed to delete key: ${name}`, e);
  }
}

export const apiKeyStore = {
  getCompaniesHouseKey: () => getKey('companiesHouse'),
  saveCompaniesHouseKey: (key: string) => saveKey('companiesHouse', key),
  deleteCompaniesHouseKey: () => deleteKey('companiesHouse'),
  getOpenSanctionsKey: () => getKey('openSanctions'),
  saveOpenSanctionsKey: (key: string) => saveKey('openSanctions', key),
  deleteOpenSanctionsKey: () => deleteKey('openSanctions'),
};
