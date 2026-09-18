import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { signalRService } from '../../services/signalrService';

export default function AuctionTimer({ initialStartTime, initialEndTime, onTimeEnd, onStart }) {
  const [startTime, setStartTime] = useState(initialStartTime ? new Date(initialStartTime).getTime() : null);
  const [endTime, setEndTime] = useState(new Date(initialEndTime).getTime());
  const [now, setNow] = useState(Date.now());
  const [isCritical, setIsCritical] = useState(false);
  const [isExtended, setIsExtended] = useState(false);

  useEffect(() => {
    setStartTime(initialStartTime ? new Date(initialStartTime).getTime() : null);
    setEndTime(new Date(initialEndTime).getTime());
  }, [initialStartTime, initialEndTime]);

  useEffect(() => {
    // Listen for anti-sniping extensions
    const handleExtension = (newEndTime) => {
      setEndTime(new Date(newEndTime).getTime());
      setIsExtended(true);
      setTimeout(() => setIsExtended(false), 5000); // Highlight extension for 5 seconds
    };

    signalRService.onAuctionExtended(handleExtension);
    return () => {
      signalRService.offAuctionExtended(handleExtension);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      // Si estaba en estado próximo y acaba de iniciar
      if (startTime && currentNow >= startTime && onStart) {
        onStart();
      }

      const distance = endTime - currentNow;
      if (distance <= 0) {
        setIsCritical(false);
        if (onTimeEnd) onTimeEnd();
      } else {
        setIsCritical(distance < 60000 && (!startTime || currentNow >= startTime));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime, onTimeEnd, onStart]);

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 1. Caso: Subasta próxima (Aún no ha iniciado)
  if (startTime && now < startTime) {
    const timeToStart = startTime - now;
    return (
      <div className="flex items-center gap-3">
        <Clock className="w-6 h-6 text-blue-400 shrink-0 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-[11px] font-sans font-bold text-blue-400 uppercase tracking-wider">
            Comienza en
          </span>
          <span className="font-mono text-xl md:text-2xl font-black text-blue-300">
            {formatTime(timeToStart)}
          </span>
        </div>
      </div>
    );
  }

  // 2. Caso: Subasta finalizada
  const timeLeft = endTime - now;
  if (timeLeft <= 0) {
    return (
      <div className="flex items-center gap-2 text-slate-500 font-mono text-xl font-bold">
        <Clock className="w-5 h-5" />
        <span>Finalizada</span>
      </div>
    );
  }

  // 3. Caso: Subasta activa (En vivo)
  return (
    <div className={`flex items-center gap-3 font-mono text-xl md:text-2xl font-bold transition-all duration-300 ${
      isCritical ? 'text-red-500 animate-pulse' : 'text-slate-100'
    } ${isExtended ? 'scale-105 text-amber-400' : ''}`}>
      <Clock className={`w-6 h-6 shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-400'} ${isExtended ? 'text-amber-400' : ''}`} />
      <div className="flex flex-col">
        <span className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider">
          Finaliza en
        </span>
        <span>{formatTime(timeLeft)}</span>
      </div>
      
      {isExtended && (
        <span className="ml-2 text-xs font-sans font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full animate-bounce">
          +2 min (Anti-Sniping)
        </span>
      )}
    </div>
  );
}
