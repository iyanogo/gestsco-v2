import api from './api';
import type { User } from '../types/auth';

const BASE_URL = '/api/v1/users';

export interface UserCreatePayload {
  email: string;
  password: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  password?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export const getUsers = async (skip = 0, limit = 100): Promise<User[]> => {
  const response = await api.get<User[]>(BASE_URL, { params: { skip, limit } });
  return response.data;
};

/** Staff pour listes déroulantes (examens, stages, jury) - admin/scolarité. */
export const getUsersForSelect = async (
  options: { roles?: string[]; skip?: number; limit?: number } = {},
): Promise<User[]> => {
  const { roles, skip = 0, limit = 500 } = options;
  const response = await api.get<User[]>(`${BASE_URL}/select`, {
    params: {
      skip,
      limit,
      ...(roles?.length ? { roles: roles.join(',') } : {}),
    },
  });
  return response.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const response = await api.get<User>(`${BASE_URL}/${id}`);
  return response.data;
};

export const createUser = async (data: UserCreatePayload): Promise<User> => {
  const response = await api.post<User>(BASE_URL, data);
  return response.data;
};

export const updateUser = async (id: number, data: UserUpdatePayload): Promise<User> => {
  const response = await api.put<User>(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`${BASE_URL}/${id}`);
};

export const userService = {
  getUsers,
  getUsersForSelect,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;
