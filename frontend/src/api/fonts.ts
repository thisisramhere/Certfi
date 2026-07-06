import apiClient from './apiClient';

export const fontsAPI = {
  upload(file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/fonts/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(res => res.data);
  },
};
