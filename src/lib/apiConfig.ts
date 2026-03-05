import { Platform } from 'react-native';

function isProduction(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  return window.location.hostname !== 'localhost'
    && window.location.hostname !== '127.0.0.1';
}

export function getCompaniesHouseBase(): string {
  if (Platform.OS !== 'web') {
    return 'https://api.company-information.service.gov.uk';
  }
  return isProduction() ? '/api/ch' : 'http://localhost:3001/ch';
}

export function getSgProxyBase(): string {
  if (Platform.OS !== 'web') {
    return 'https://data.gov.sg';
  }
  return isProduction() ? '/api/sg' : 'http://localhost:3001/sg';
}

export function getSanctionsBase(): string {
  if (Platform.OS !== 'web') {
    return 'https://api.opensanctions.org';
  }
  return isProduction() ? '/api/sanctions' : 'https://api.opensanctions.org';
}

export function wrapWithCorsProxy(url: string): string {
  if (Platform.OS !== 'web') return url;
  if (isProduction()) return url;
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}
