import axios from 'axios';
// export const API_BASE_URL = "http://localhost:8000/api/";
export const API_BASE_URL = "https://unibites-nepal-hkaqh5dfdagqfyf7.southeastasia-01.azurewebsites.net/api/";

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
