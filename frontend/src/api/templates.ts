import apiClient from './apiClient';
import { CertificateTemplate } from '../types';

export const templatesAPI = {

  async getAll(
    organizationId?: string
  ): Promise<CertificateTemplate[]> {

    const params = organizationId
      ? { organization_id: organizationId }
      : {};

    const response =
      await apiClient.get<CertificateTemplate[]>(
        '/templates/',
        { params }
      );

    return response.data;
  },


  async getById(
    templateId: string
  ): Promise<CertificateTemplate> {

    const response =
      await apiClient.get<CertificateTemplate>(
        `/templates/${templateId}`
      );

    return response.data;
  },


  async create(
    data: FormData
  ): Promise<CertificateTemplate> {

    const response =
      await apiClient.post<CertificateTemplate>(
        '/templates/',
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
        }
      );

    return response.data;
  },


  async update(
    templateId: string,
    data: Partial<CertificateTemplate>
  ): Promise<CertificateTemplate> {

    const response =
      await apiClient.put<CertificateTemplate>(
        `/templates/${templateId}`,
        data
      );

    return response.data;
  },


  async delete(
    templateId: string
  ): Promise<void> {

    await apiClient.delete(
      `/templates/${templateId}`
    );
  },


  async duplicate(
    templateId: string
  ): Promise<CertificateTemplate> {

    const response =
      await apiClient.post<CertificateTemplate>(
        `/templates/${templateId}/duplicate`
      );

    return response.data;
  },


  async getPlaceholders(
    templateId: string
  ) {

    const response =
      await apiClient.get(
        `/templates/${templateId}/placeholders/`
      );

    return response.data;
  },


  async addPlaceholder(
    templateId: string,
    placeholderData: any
  ) {

    const response =
      await apiClient.post(
        `/templates/${templateId}/placeholders/`,
        placeholderData
      );

    return response.data;
  },


  async updatePlaceholder(
    templateId: string,
    placeholderId: string,
    data: any
  ) {

    const response =
      await apiClient.put(
        `/templates/${templateId}/placeholders/${placeholderId}`,
        data
      );

    return response.data;
  },


  async savePlaceholders(
    templateId: string,
    placeholders: any[]
  ) {

    const response =
      await apiClient.put(
        `/templates/${templateId}/placeholders/`,
        placeholders
      );

    return response.data;
  },


  async aiAnalyzeTemplate(
    templateId: string
  ) {

    const response =
      await apiClient.post(
        `/templates/${templateId}/ai/analyze/`
      );

    return response.data;
  },


  async aiFinalizePlacements(
    templateId: string,
    placeholders: any[]
  ) {

    const response =
      await apiClient.post(
        `/templates/${templateId}/ai/finalize/`,
        {
          placeholders
        }
      );

    return response.data;
  },
};
