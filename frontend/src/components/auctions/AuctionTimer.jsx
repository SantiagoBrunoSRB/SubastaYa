import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { signalRService } from '../../services/signalrService';

export default function AuctionTimer({ initialEndTime, onTimeEnd }) {
  const [endTime, setEndTime] = useState(new Date(initialEndTime).getTime());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCritical, setIsCritical] = useState(false);
  const [isExtended, setIsExtended] = useState(false);

  useEffect(() => {
    setEndTime(new Date(initialEndTime).getTime());
  }, [initialEndTime]);

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
      const now = new Date().getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(0);
        setIsCritical(false);
        if (onTimeEnd) onTimeEnd();
      } else {
        setTimeLeft(distance);
        // If less than 1 minute (60000 ms), it's critical
        setIsCritical(distance < 60000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onTimeEnd]);

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

  if (timeLeft <= 0) {
    return (
      <div className="flex items-center gap-2 text-slate-500 font-mono text-xl font-bold">
        <Clock className="w-5 h-5" />
        <span>Finalizada</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 font-mono text-2xl font-bold transition-all duration-300 ${
      isCritical ? 'text-red-500 animate-pulse' : 'text-slate-100'
    } ${isExtended ? 'scale-110 text-amber-400' : ''}`}>
      <Clock className={`w-6 h-6 ${isCritical ? 'text-red-500' : 'text-slate-400'} ${isExtended ? 'text-amber-400' : ''}`} />
      <span>{formatTime(timeLeft)}</span>
      
      {isExtended && (
        <span className="ml-2 text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full animate-bounce">
          +2 min (Anti-Sniping)
        </span>
      )}
    </div>
  );
}
