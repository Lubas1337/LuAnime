export interface User {
  id: number;
  login: string;
  email?: string;
  avatar?: string;
  status?: string;
  is_premium?: boolean;
  created_at?: string;
  last_online?: string;
}

export interface AuthResponse {
  profileToken: string;
  profile: User;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface RegisterCredentials {
  login: string;
  email: string;
  password: string;
}

export interface WatchHistory {
  anime_id: number;
  episode_number: number;
  progress: number;
  updated_at: string;
}

export interface FavoriteItem {
  id: number;
  anime_id: number;
  added_at: string;
}
