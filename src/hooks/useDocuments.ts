import { useState, useCallback } from 'react';
import * as documentService from '../services/documentService';
import type { PartnerDocument } from '../types';

export function useDocuments(partnerId: string) {
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await documentService.getDocuments(partnerId);
      setDocuments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [partnerId]);

  const upload = async (
    fileName: string,
    fileUri: string,
    docType: PartnerDocument['doc_type']
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const doc = await documentService.uploadDocument(partnerId, fileName, fileUri, docType);
      setDocuments(prev => [doc, ...prev]);
      return doc;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return { documents, isLoading, error, refresh, upload, remove };
}
