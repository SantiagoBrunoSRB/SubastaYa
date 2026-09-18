export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Usuario no autenticado o sesión expirada. Por favor inicia sesión.');
        }
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText };
        }

        let errorMessage = errorData.message;
        if (!errorMessage && errorData.errors && typeof errorData.errors === 'object') {
            const errorList = Object.values(errorData.errors).flat().filter(Boolean);
            if (errorList.length > 0) {
                errorMessage = errorList.join(' ');
            }
        }

        if (!errorMessage) {
            errorMessage = errorData.title || 'Error en la petición a la API';
        }

        throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    return response.json();
}
