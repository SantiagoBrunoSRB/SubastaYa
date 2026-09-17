import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { MOCK_CATEGORIES } from '../../services/mockData';

export default function AuctionFilter({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
}) {
  const statusOptions = [
    { value: 'ALL', label: 'Todas' },
    { value: 'ACTIVE', label: 'En Vivo' },
    { value: 'UPCOMING', label: 'Próximas' },
    { value: 'ENDED', label: 'Finalizadas' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
      {/* Fila 1: Búsqueda y Ordenamiento */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Campo de búsqueda */}
        <div className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por producto, marca o palabra clave..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ordenar Por */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="NEWEST">Más recientes</option>
            <option value="PRICE_ASC">Menor precio</option>
            <option value="PRICE_DESC">Mayor precio</option>
            <option value="MOST_BIDS">Más pujas</option>
          </select>
        </div>
      </div>

      {/* Fila 2: Categorías y Filtros por Estado */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
        
        {/* Pills de Categoría */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-2 lg:pb-0 scrollbar-none">
          {MOCK_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Tabs de Estado */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs shrink-0">
          {statusOptions.map((opt) => {
            const isSelected = selectedStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
