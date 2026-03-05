import { useState, useEffect, useCallback } from 'react';
import * as partnerService from '../services/partnerService';
import type {
  Partner, PartnerUbo, ScreeningResult, PartnerDocument,
  RiskAssessment, AuditLogEntry,
} from '../types';

interface PartnerDetail {
  partner: Partner | null;
  ubos: PartnerUbo[];
  screenings: ScreeningResult[];
  documents: PartnerDocument[];
  riskAssessment: RiskAssessment | null;
  auditLog: AuditLogEntry[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePartnerDetail(id: string): PartnerDetail {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [ubos, setUbos] = useState<PartnerUbo[]>([]);
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [p, u, s, d, r, a] = await Promise.all([
        partnerService.getPartner(id),
        partnerService.getPartnerUbos(id),
        partnerService.getScreeningResults(id),
        partnerService.getPartnerDocuments(id),
        partnerService.getRiskAssessment(id),
        partnerService.getAuditLog(id),
      ]);
      setPartner(p);
      setUbos(u);
      setScreenings(s);
      setDocuments(d);
      setRiskAssessment(r);
      setAuditLog(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load partner details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { partner, ubos, screenings, documents, riskAssessment, auditLog, isLoading, error, refresh };
}
