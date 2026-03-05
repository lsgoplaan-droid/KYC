import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type { PartnerDocument } from '../types';

const TAG = 'documentService';
const BUCKET = 'kyc-documents';

export async function uploadDocument(
  partnerId: string,
  fileName: string,
  fileUri: string,
  docType: PartnerDocument['doc_type']
): Promise<PartnerDocument> {
  const filePath = `${partnerId}/${Date.now()}_${fileName}`;

  // Fetch the file as a blob
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob);

  if (uploadError) {
    logger.error(TAG, 'File upload failed', uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('partner_documents')
    .insert({
      partner_id: partnerId,
      doc_type: docType,
      file_name: fileName,
      file_url: urlData.publicUrl,
    })
    .select()
    .single();

  if (error) {
    logger.error(TAG, 'Failed to save document metadata', error);
    throw error;
  }

  logger.info(TAG, 'Document uploaded', { partnerId, fileName, docType });
  return data;
}

export async function getDocuments(partnerId: string): Promise<PartnerDocument[]> {
  const { data, error } = await supabase
    .from('partner_documents')
    .select('*')
    .eq('partner_id', partnerId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    logger.error(TAG, 'Failed to fetch documents', error);
    return [];
  }
  return data ?? [];
}

export async function deleteDocument(id: string): Promise<void> {
  // Get the document to find file path
  const { data: doc } = await supabase
    .from('partner_documents')
    .select('file_url')
    .eq('id', id)
    .single();

  // Delete from storage if possible
  if (doc?.file_url) {
    const pathMatch = doc.file_url.split(`${BUCKET}/`)[1];
    if (pathMatch) {
      await supabase.storage.from(BUCKET).remove([pathMatch]);
    }
  }

  // Delete metadata
  const { error } = await supabase
    .from('partner_documents')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error(TAG, 'Failed to delete document', error);
    throw error;
  }
}
