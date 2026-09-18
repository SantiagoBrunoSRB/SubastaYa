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

        // 1. Extraer detalle de excepciones de negocio / dominio (ProblemDetails.Detail)
        let errorMessage = errorData.detail || errorData.message;

        // 2. Extraer errores de validación de modelo (ValidationProblemDetails.Errors)
        if (!errorMessage && errorData.errors && typeof errorData.errors === 'object') {
            const errorList = Object.values(errorData.errors).flat().filter(Boolean);
            if (errorList.length > 0) {
                errorMessage = errorList.join(' ');
            }
        }

        // 3. Fallback al Title o genérico
        if (!errorMessage) {
            errorMessage = errorData.title || 'Error en la petición a la API';
        }

        throw new Error(errorMessage);
    }

    // Si la respuesta fue 201 Created y tiene header Location, intentar extraer el id
    if (response.status === 201) {
        const location = response.headers.get('Location') || response.headers.get('location');
        let extractedId = null;
        if (location) {
            const match = location.match(/[/?&]id=(\d+)/i) || location.match(/\/auctions\/(\d+)/i);
            if (match) {
                extractedId = parseInt(match[1], 10);
            }
        }

        const text = await response.text();
        if (text && text.trim()) {
            try {
                const parsed = JSON.parse(text);
                if (extractedId && !parsed.id) {
                    parsed.id = extractedId;
                }
                return parsed;
            } catch {
                return extractedId ? { id: extractedId } : text;
            }
        }
        return extractedId ? { id: extractedId } : null;
    }

    // Handle 204 No Content o respuestas con cuerpo vacío
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }

    const text = await response.text();
    if (!text || !text.trim()) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}
