import apiClient from './apiClient';
import { User } from '../types';

export const usersAPI = {
  async getAll(skip?: number, limit?: number): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users', { params: { skip, limit } });
    return response.data;
  },

  async getById(userId: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  },

  async update(userId: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/users/${userId}`, data);
    return response.data;
  },

  async delete(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  },
};
