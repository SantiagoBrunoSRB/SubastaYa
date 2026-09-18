import React, { useState, useEffect, useMemo } from 'react';
import { Gavel, TrendingUp, Sparkles, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import AuctionFilter from '../components/auctions/AuctionFilter';
import AuctionGrid from '../components/auctions/AuctionGrid';
import { MOCK_AUCTIONS } from '../services/mockData';
import { fetchWithAuth } from '../services/api';
import { getCustomAuctions } from '../services/auctionStorage';

// Detecta categoría automáticamente según título/descripción si el backend no la provee
const mapCategory = (title = '', description = '') => {
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

// Asigna una imagen estética si el backend no cuenta con URL de imagen
const mapImage = (title = '', category = '') => {
  const text = title.toLowerCase();
  if (text.includes('laptop') || text.includes('gamer') || text.includes('rtx')) {
    return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('smartphone') || text.includes('oled') || text.includes('flagship')) {
    return 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('cómic') || text.includes('comic')) {
    return 'https://images.unsplash.com/photo-1588497859490-85d1c17db96d?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('reloj')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
  }
  if (text.includes('óleo') || text.includes('arte') || text.includes('pintura')) {
    return 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Vehículos') {
    return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80';
  }
  if (category === 'Deportes') {
    return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
};

// Determina el estado dinámicamente y en tiempo real según fecha de finalización, inicio o estado backend
export const getEffectiveStatus = (item) => {
  const now = Date.now();
  const start = item.startTime ? new Date(item.startTime).getTime() : null;
  const end = item.endTime ? new Date(item.endTime).getTime() : null;

  // 1. Finalizada: por estado en backend (2 o 3) o si expiró la fecha de fin
  //    SOLO marcar como ENDED si el end time ya pasó. El backend state=2/3 también aplica.
  if (item.state === 2 || item.state === 3 || item.status === 'ENDED') {
    return 'ENDED';
  }
  // Si la fecha de fin ya pasó, es ENDED (independiente de pujas)
  if (end && end <= now) {
    return 'ENDED';
  }

  // 2. Próxima: SOLO si la fecha de inicio es estrictamente futura (la fecha manda, no las pujas)
  if (start && start > now) {
    return 'UPCOMING';
  }

  // 3. Activa: la fecha de inicio ya pasó (o no tiene fecha de inicio definida)
  return 'ACTIVE';
};

const adaptBackendAuction = (item) => {
  const category = item.category || mapCategory(item.title, item.description);
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category,
    startingPrice: item.startingPrice,
    currentPrice: item.currentPrice || item.startingPrice,
    bidCount: item.bidCount ?? (item.bids ? item.bids.length : 0),
    status: getEffectiveStatus(item),
    state: item.state,
    imageUrl: item.imageUrl || mapImage(item.title, category),
    startTime: item.startTime,
    endTime: item.endTime,
    sellerId: item.sellerId,
    sellerName: item.sellerName || 'Vendedor',
    isRealApi: true,
  };
};

export default function HomePage() {
  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  const loadAuctions = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Solicitar todas las subastas incluyendo las finalizadas
      const data = await fetchWithAuth('/auctions?includeClosed=true');
      const apiAuctions = Array.isArray(data) ? data.map(adaptBackendAuction) : [];
      const customAuctions = getCustomAuctions();

      const combined = [...apiAuctions];
      const existingIds = new Set(apiAuctions.map((a) => String(a.id)));

      // Integrar subastas creadas localmente para garantizar que no se pierdan
      // Si el ID del localStorage ya existe en la API, la API es la fuente de verdad (más actualizada)
      for (const custom of customAuctions) {
        if (!existingIds.has(String(custom.id))) {
          combined.push(custom);
          existingIds.add(String(custom.id));
        }
      }

      // Complementar con subastas mock para tener variedad de datos
      for (const mock of MOCK_AUCTIONS) {
        if (!existingIds.has(String(mock.id))) {
          combined.push(mock);
          existingIds.add(String(mock.id));
        }
      }

      setAuctions(combined);
    } catch (err) {
      console.warn('Backend no disponible, usando subastas de demostración y locales:', err);
      setApiError('No se pudo conectar con el backend. Mostrando subastas guardadas y de demostración.');
      const customAuctions = getCustomAuctions();
      const existingIds = new Set(customAuctions.map((a) => String(a.id)));
      const combined = [...customAuctions];
      for (const mock of MOCK_AUCTIONS) {
        if (!existingIds.has(String(mock.id))) {
          combined.push(mock);
        }
      }
      setAuctions(combined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
  }, []);

  // Filtrado y ordenamiento dinámico de subastas
  const filteredAuctions = useMemo(() => {
    return auctions
      .map((item) => ({
        ...item,
        status: getEffectiveStatus(item),
      }))
      .filter((item) => {
        // Filtro por término de búsqueda
        const matchesSearch =
          searchTerm === '' ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase());

        // Filtro por categoría
        const matchesCategory =
          selectedCategory === 'Todas' || item.category === selectedCategory;

        // Filtro por estado en tiempo real
        const matchesStatus =
          selectedStatus === 'ALL' || item.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_ASC') return a.currentPrice - b.currentPrice;
        if (sortBy === 'PRICE_DESC') return b.currentPrice - a.currentPrice;
        if (sortBy === 'MOST_BIDS') return b.bidCount - a.bidCount;
        // Default: NEWEST
        return new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime();
      });
  }, [auctions, searchTerm, selectedCategory, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Todas');
    setSelectedStatus('ALL');
    setSortBy('NEWEST');
  };

  const activeCount = auctions.filter((a) => getEffectiveStatus(a) === 'ACTIVE').length;

  return (
    <div className="space-y-8">
      {/* Banner Principal / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-slate-800 p-8 md:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma de Subastas en Vivo
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Descubrí y pujá por productos <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">exclusivos</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Participá en subastas seguras en tiempo real con sistema de anti-sniping y billetera integrada.
          </p>

          {/* Mini métricas */}
          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{activeCount} Subastas en vivo</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Sistema Transparente</span>
            </div>
          </div>
        </div>

        {/* Icono de fondo decorativo */}
        <Gavel className="absolute -right-8 -bottom-8 w-64 h-64 text-amber-500/5 rotate-12 pointer-events-none" />
      </div>

      {/* Aviso si la API está desconectada */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center justify-between">
          <span>{apiError}</span>
          <button
            onClick={loadAuctions}
            className="text-xs underline hover:text-white font-medium ml-4"
          >
            Reintentar conexión
          </button>
        </div>
      )}

      {/* Filtros */}
      <AuctionFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Contador de resultados y refresco */}
      <div className="flex items-center justify-between text-sm text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>
            Mostrando <strong className="text-white">{filteredAuctions.length}</strong> subastas
          </span>
          <button
            onClick={loadAuctions}
            disabled={isLoading}
            title="Actualizar subastas"
            className="p-1 hover:text-amber-400 text-slate-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
        {(searchTerm || selectedCategory !== 'Todas' || selectedStatus !== 'ALL') && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grilla o Spinner */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-slate-400 text-sm">Cargando subastas...</span>
        </div>
      ) : (
        <AuctionGrid
          auctions={filteredAuctions}
          onResetFilters={handleResetFilters}
        />
      )}
    </div>
  );
}
