import React, { useState, useMemo } from 'react';
import { Gavel, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import AuctionFilter from '../components/auctions/AuctionFilter';
import AuctionGrid from '../components/auctions/AuctionGrid';
import { MOCK_AUCTIONS } from '../services/mockData';

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Filtrado y ordenamiento de subastas
  const filteredAuctions = useMemo(() => {
    return MOCK_AUCTIONS.filter((item) => {
      // Filtro por término de búsqueda
      const matchesSearch =
        searchTerm === '' ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por categoría
      const matchesCategory =
        selectedCategory === 'Todas' || item.category === selectedCategory;

      // Filtro por estado
      const matchesStatus =
        selectedStatus === 'ALL' || item.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.currentPrice - b.currentPrice;
      if (sortBy === 'PRICE_DESC') return b.currentPrice - a.currentPrice;
      if (sortBy === 'MOST_BIDS') return b.bidCount - a.bidCount;
      // Default: NEWEST
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  }, [searchTerm, selectedCategory, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Todas');
    setSelectedStatus('ALL');
    setSortBy('NEWEST');
  };

  const activeCount = MOCK_AUCTIONS.filter((a) => a.status === 'ACTIVE').length;

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

      {/* Contador de resultados */}
      <div className="flex items-center justify-between text-sm text-slate-400 px-1">
        <span>
          Mostrando <strong className="text-white">{filteredAuctions.length}</strong> subastas
        </span>
        {(searchTerm || selectedCategory !== 'Todas' || selectedStatus !== 'ALL') && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grilla de Subastas */}
      <AuctionGrid
        auctions={filteredAuctions}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
