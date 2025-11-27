import axios from 'axios';

const api = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
     timeout: 30000, // Increase to 30 seconds untuk login/submit requests
});

api.interceptors.request.use(
     (config) => {
          if (typeof window !== 'undefined') {
               const token = localStorage.getItem('api_token');
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

api.interceptors.response.use(
     (response) => {
          if (response.config.url?.includes('/submit')) {
               return response;
          }

          if (response.data && response.data.data !== undefined) {
               response.data = response.data.data;
          }
          return response;
     },
     (error) => {
          if (error.response?.status === 401) {
               if (typeof window !== 'undefined') {
                    localStorage.removeItem('api_token');
                    window.location.href = '/';
               }
          }
          return Promise.reject(error);
     }
);

export default api;
