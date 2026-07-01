import apiClient from './apiClient';

export interface VerificationResult {
  status: 'valid' | 'invalid' | 'tampered';
  certificate_id: string;
  message: string;
  details?: Record<string, any>;
}

export const verificationAPI = {
  async verifyCertificate(certificateId: string): Promise<VerificationResult> {
    const response = await apiClient.get<VerificationResult>(`/verify/${certificateId}`);
    return response.data;
  },

  async getVerificationStats(organizationId?: string, fromDate?: string, toDate?: string) {
    const params: Record<string, any> = {};
    if (organizationId) params.organization_id = organizationId;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    const response = await apiClient.get('/verify/stats', { params });
    return response.data;
  },
};
