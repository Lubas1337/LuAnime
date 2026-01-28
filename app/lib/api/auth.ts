import { apiClient } from './client';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '@/types/user';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка входа');
  }

  return data;
}

export async function register(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка регистрации');
  }

  return data;
}

export async function getProfile(userId: number, token?: string): Promise<User> {
  const response = await apiClient.get<{ profile: User }>(
    `/profile/${userId}`,
    { token }
  );
  return response.profile;
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await apiClient.get<{ profile: User }>('/profile/me', { token });
  return response.profile;
}
