import axios, { type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Extender a interface do Axios para incluir a propriedade skipAuth
declare module "axios" {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Apenas adiciona o token se a requisição precisar de autenticação
    // Por padrão, todas as requisições precisam de autenticação
    // Para desabilitar, use: api.get(url, { skipAuth: true })
    const skipAuth = config.skipAuth;

    if (!skipAuth) {
      // Pegar token do Supabase
      const token = JSON.parse(
        localStorage.getItem(import.meta.env.VITE_SUPABASE_LOCAL_STORAGE_KEY) ||
          "{}"
      ).access_token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem(import.meta.env.VITE_SUPABASE_LOCAL_STORAGE_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
