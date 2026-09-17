import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, Eye, ArrowUpRight } from 'lucide-react';

export default function AuctionCard({ auction }) {
  const {
    id,
    title,
    category,
    currentPrice,
    bidCount,
    status,
    imageUrl,
    endTime,
  } = auction;

  // Formato de moneda ARS
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Badges según estado
  const getStatusBadge = () => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            En Vivo
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Próximamente
          </span>
        );
      case 'ENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-400 border border-slate-600">
            Finalizada
          </span>
        );
      default:
        return null;
    }
  };

  // Cálculo básico de tiempo (estático para maquetado)
  const getTimeLabel = () => {
    if (status === 'ENDED') return 'Subasta cerrada';
    if (status === 'UPCOMING') return 'Comienza pronto';
    return 'Finaliza hoy';
  };

  return (
    <div className="group bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col h-full">
      {/* Imagen & Overlay */}
      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
        
        {/* Badges superiores */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {getStatusBadge()}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/90 text-slate-300 backdrop-blur border border-slate-700">
            <Tag className="w-3 h-3 text-amber-400" />
            {category}
          </span>
        </div>

        {/* Contador / Tiempo inferior */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{getTimeLabel()}</span>
          </div>
          <span className="font-semibold text-white">{bidCount} pujas</span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
        <div>
          <h3 className="font-bold text-white text-base line-clamp-2 group-hover:text-amber-400 transition-colors">
            {title}
          </h3>
        </div>

        {/* Precio & Acción */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Oferta Actual</span>
            <span className="text-lg font-extrabold text-white tracking-tight">
              {formatCurrency(currentPrice)}
            </span>
          </div>

          <Link
            to={`/subasta/${id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md shadow-amber-500/10"
          >
            Ver Subasta
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
