import apiClient from './apiClient';

export interface AnalyticsData {
  id: string;
  date: string;
  certificates_generated: number;
  certificates_sent: number;
  certificates_failed: number;
  verifications_total: number;
  verifications_valid: number;
  verifications_invalid: number;
  verifications_tampered: number;
  downloads_pdf: number;
  downloads_png: number;
  downloads_zip: number;
  unique_participants: number;
  organization_id: string;
}

export const analyticsAPI = {
  async getAnalytics(period: string = 'daily'): Promise<AnalyticsData[]> {
    const response = await apiClient.get<AnalyticsData[]>('/analytics', { params: { period } });
    return response.data;
  },

  async getSummary() {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
  },
};
