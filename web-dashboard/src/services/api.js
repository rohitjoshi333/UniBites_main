import axios from 'axios';
export const API_BASE_URL = "http://localhost:8000/api/";
// export const API_BASE_URL = "https://unibites-nepal-hkaqh5dfdagqfyf7.southeastasia-01.azurewebsites.net/api/";

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

// Centralized error handling — clean messages, no raw errors in UI
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const data = error.response.data;
            // Attach a clean userMessage for components to use
            const userMessage =
                data?.message ||
                data?.detail ||
                data?.error ||
                getFirstFieldError(data) ||
                getStatusMessage(error.response.status);
            error.userMessage = userMessage;

            // Automatically log out if session expired or unauthorized
            if (error.response.status === 401) {
                localStorage.clear();
                window.location.href = '/login';
            }
        } else if (error.request) {
            error.userMessage = 'Network error. Please check your connection.';
        } else {
            error.userMessage = 'Something went wrong. Please try again.';
        }
        console.log('API Error:', error.response?.status, error.userMessage);
        return Promise.reject(error);
    }
);

function getFirstFieldError(data) {
    if (!data || typeof data !== 'object') return null;
    for (const key of Object.keys(data)) {
        if (key === 'success') continue;
        const val = data[key];
        if (Array.isArray(val) && val.length > 0) return String(val[0]);
        if (typeof val === 'string' && key !== 'success') return val;
    }
    return null;
}

function getStatusMessage(status) {
    const messages = {
        400: 'Invalid request. Please check your input.',
        401: 'Session expired. Please log in again.',
        403: 'You don\'t have permission to do that.',
        404: 'The requested resource was not found.',
        500: 'Server error. Please try again later.',
    };
    return messages[status] || 'Something went wrong.';
}

export default api;
