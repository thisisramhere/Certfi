import apiClient from './apiClient';
import { Participant } from '../types';

export const participantsAPI = {
  async importParticipants(file: File, mapping?: Record<string, string>) {
    const formData = new FormData();
    formData.append('file', file);
    if (mapping) {
      formData.append('mapping', JSON.stringify(mapping));
    }
    
    const response = await apiClient.post('/participants/import', formData);
    return response.data;
  },

  async create(data: { name: string; email: string; custom_fields?: Record<string, string> }) {
    const response = await apiClient.post('/participants', data);
    return response.data;
  },

  async getAll(organizationId?: string, skip?: number, limit?: number, search?: string) {
    const params = { ...organizationId ? { organization_id: organizationId } : {}, skip, limit, search };
    const response = await apiClient.get<Participant[]>('/participants', { params });
    return response.data;
  },

  async delete(participantId: string, organizationId?: string) {
    const params = organizationId ? `?organization_id=${organizationId}` : '';
    await apiClient.delete(`/participants/${participantId}${params}`);
  }
};