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

// ---------------------------------------------------------------------------
// Utilidades compartidas de mapeo de datos de backend → frontend
// ---------------------------------------------------------------------------

/** Determina el estado dinámicamente según fechas y estado del backend */
export const getEffectiveStatus = (item) => {
  const now = Date.now();
  const start = item.startTime ? new Date(item.startTime).getTime() : null;
  const end = item.endTime ? new Date(item.endTime).getTime() : null;

  if (item.state === 2 || item.state === 3 || item.status === 'ENDED') return 'ENDED';
  if (end && end <= now) return 'ENDED';
  if (start && start > now) return 'UPCOMING';
  return 'ACTIVE';
};

/** Detecta categoría según título/descripción cuando el backend no la provee */
export const mapCategory = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('tecnología') || text.includes('laptop') || text.includes('smartphone') || text.includes('oled') || text.includes('electrónica')) {
    return 'Electrónica';
  }
  if (text.includes('cómic') || text.includes('reloj') || text.includes('coleccionable') || text.includes('vintage')) {
    return 'Coleccionables';
  }
  if (text.includes('cuadro') || text.includes('óleo') || text.includes('arte') || text.includes('pintura')) {
    return 'Arte';
  }
  if (text.includes('auto') || text.includes('moto') || text.includes('vehículo') || text.includes('camioneta')) {
    return 'Vehículos';
  }
  if (text.includes('bici') || text.includes('deporte') || text.includes('camiseta') || text.includes('futbol')) {
    return 'Deportes';
  }
  if (text.includes('hogar') || text.includes('mueble') || text.includes('silla')) {
    return 'Hogar';
  }
  return 'Electrónica';
};

/** Asigna una imagen ilustrativa según el título/categoría si el backend no provee una */
export const mapImage = (title = '', category = '') => {
  const text = title.toLowerCase();
  if (text.includes('playstation') || text.includes('ps5') || text.includes('ps4')) {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('laptop') || text.includes('macbook') || text.includes('gamer') || text.includes('rtx') || text.includes('notebook')) {
    return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('smartphone') || text.includes('oled') || text.includes('flagship') || text.includes('iphone') || text.includes('samsung')) {
    return 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('cómic') || text.includes('comic')) {
    return 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('reloj')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('óleo') || text.includes('arte') || text.includes('pintura') || text.includes('cuadro')) {
    return 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('camiseta') || text.includes('jersey') || text.includes('selección') || text.includes('firmada')) {
    return 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Vehículos' || text.includes('auto') || text.includes('moto')) {
    return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Deportes' || text.includes('bici') || text.includes('deporte')) {
    return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80';
  }
  // Imagen genérica de subasta
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
};

/** Normaliza un item del backend al shape que espera el frontend */
export const adaptBackendAuction = (item) => {
  const category = item.category || mapCategory(item.title, item.description);
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category,
    startingPrice: item.startingPrice,
    currentPrice: item.currentPrice || item.startingPrice,
    bidCount: item.bidCount ?? (item.bids ? item.bids.length : 0),
    bids: item.bids || [],
    state: item.state,
    imageUrl: item.imageUrl || mapImage(item.title, category),
    startTime: item.startTime,
    endTime: item.endTime,
    sellerId: item.sellerId,
    sellerName: item.sellerName || 'Vendedor',
    isRealApi: true,
  };
};
