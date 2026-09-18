import React, { useState, useEffect } from 'react';
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

  // Cálculo del tiempo restante en milisegundos
  const calculateTimeLeft = () => {
    if (!endTime) return null;
    const end = new Date(endTime).getTime();
    if (isNaN(end)) return null;
    return Math.max(0, end - Date.now());
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    if (!endTime || status === 'ENDED') return;

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining !== null && remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, status]);

  // Formateador de tiempo regresivo (Días, Horas, Minutos, Segundos)
  const formatCountdown = (ms) => {
    if (ms === null || ms === undefined || ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const days = Math.floor(totalSeconds / 86400);

    const pad = (n) => n.toString().padStart(2, '0');

    if (days > 0) {
      return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const isAuctionEnded = status === 'ENDED' || (endTime && timeLeft !== null && timeLeft <= 0);

  // Badges según estado
  const getStatusBadge = () => {
    if (isAuctionEnded) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-400 border border-slate-600">
          Finalizada
        </span>
      );
    }
    switch (status) {
      case 'UPCOMING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Próximamente
          </span>
        );
      case 'ACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            En Vivo
          </span>
        );
    }
  };

  // Renderizado del texto de tiempo / cuenta regresiva
  const renderTimeInfo = () => {
    if (isAuctionEnded) {
      return <span className="text-slate-400 font-medium">Subasta cerrada</span>;
    }
    if (status === 'UPCOMING') {
      return <span className="text-blue-300 font-medium">Comienza pronto</span>;
    }
    if (timeLeft !== null) {
      const isCritical = timeLeft < 60000;
      return (
        <span className="flex items-center gap-1">
          <span>Finaliza en:</span>
          <span className={`font-mono font-bold tracking-tight ${isCritical ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
            {formatCountdown(timeLeft)}
          </span>
        </span>
      );
    }
    return <span>Finaliza hoy</span>;
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
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {renderTimeInfo()}
          </div>
          <span className="font-semibold text-white shrink-0 ml-2">{bidCount} pujas</span>
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
