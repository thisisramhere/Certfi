import apiClient from './apiClient';

export interface GeneratedCertificate {
  id: string;
  certificate_id: string;
  qr_token: string;
  tamper_hash: string;
  status: 'pending' | 'generated' | 'sent' | 'failed';
  pdf_path?: string;
  png_path?: string;
  issued_at?: string;
  sent_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  template_id: string;
  participant_id: string;
  creator_id: string;
  organization_id: string;
}

export const certificatesAPI = {
  async generate(certificates: any[]) {
    const response = await apiClient.post('/certificates/generate', certificates);
    return response.data;
  },

  async getAll(organizationId?: string, status?: string) {
    const params = { ...organizationId ? { organization_id: organizationId } : {}, status };
    const response = await apiClient.get('/certificates', { params });
    return response.data;
  },

  async getById(certificateId: string) {
    const response = await apiClient.get(`/certificates/${certificateId}`);
    return response.data;
  },

  async downloadPDF(certificateId: string) {
    const response = await apiClient.get(`/certificates/${certificateId}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  async downloadPNG(certificateId: string) {
    const response = await apiClient.get(`/certificates/${certificateId}/png`, { responseType: 'blob' });
    return response.data;
  },

  async downloadAll(organizationId: string) {
    const response = await apiClient.get(`/certificates/download-all?organization_id=${organizationId}`, { responseType: 'blob' });
    return response.data;
  },

  async revoke(certificateId: string) {
    const response = await apiClient.post(`/certificates/${certificateId}/revoke`);
    return response.data;
  }
};