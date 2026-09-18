import React, { useState, useEffect, useMemo } from 'react';
import { Gavel, TrendingUp, Sparkles, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import AuctionFilter from '../components/auctions/AuctionFilter';
import AuctionGrid from '../components/auctions/AuctionGrid';
import { MOCK_AUCTIONS } from '../services/mockData';
import { fetchWithAuth, adaptBackendAuction, getEffectiveStatus } from '../services/api';


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
      setAuctions(apiAuctions);
    } catch (err) {
      console.warn('Backend no disponible, mostrando subastas de demostración:', err);
      setApiError('No se pudo conectar con el backend. Mostrando subastas de demostración.');
      // Fallback: mostrar mocks estáticos cuando el backend no está disponible
      setAuctions(MOCK_AUCTIONS.map((m) => ({ ...m, status: getEffectiveStatus(m) })));
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
