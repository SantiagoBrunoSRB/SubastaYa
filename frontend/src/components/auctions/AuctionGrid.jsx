import React from 'react';
import AuctionCard from './AuctionCard';
import { PackageSearch } from 'lucide-react';

export default function AuctionGrid({ auctions, onResetFilters }) {
  if (!auctions || auctions.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
        <div className="inline-flex p-4 bg-slate-800/80 rounded-2xl text-slate-400">
          <PackageSearch className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">No se encontraron subastas</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            No hay publicaciones que coincidan con los criterios de búsqueda o filtros seleccionados.
          </p>
        </div>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {auctions.map((auction) => (
        <AuctionCard key={auction.id} auction={auction} />
      ))}
    </div>
  );
}
