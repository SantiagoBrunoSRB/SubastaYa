import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { fetchWithAuth } from '../../services/api';

export default function BidConsole({ auctionId, currentPrice, minimumIncrement, isLeading, isClosed, onBidSuccess }) {
  const { balance, fetchBalance } = useWallet();
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const suggestedBid = currentPrice + minimumIncrement;

  useEffect(() => {
    if (!bidAmount || Number(bidAmount) < suggestedBid) {
      setBidAmount(suggestedBid.toString());
    }
  }, [suggestedBid]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount < suggestedBid) {
      setError(`La oferta debe ser al menos ${suggestedBid}`);
      return;
    }

    if (amount > balance?.availableAmount) {
      setError('Fondos insuficientes en la billetera.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchWithAuth(`/auctions/${auctionId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
      setSuccessMsg('¡Oferta realizada con éxito!');
      await fetchBalance(); // Refresh local balance

      // Notificar al componente padre para reflejar inmediatamente la puja en la UI
      if (onBidSuccess) {
        onBidSuccess(amount);
      }
    } catch (err) {
      setError(err.message || 'Error al procesar la puja.');
    } finally {
      setIsSubmitting(false);
      // clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
  };

  if (isClosed) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
        La subasta ha finalizado y ya no acepta pujas.
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          Consola de Pujas
        </h3>
        
        {isLeading ? (
          <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-sm font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Liderando
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            Superado
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-slate-400 text-sm">Incremento mínimo: {formatCurrency(minimumIncrement)}</span>
        <span className="text-slate-400 text-sm">Tu saldo disponible: <span className="font-semibold text-white">{formatCurrency(balance?.availableAmount)}</span></span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleBidSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="w-5 h-5 text-slate-500" />
          </div>
          <input
            type="number"
            step="0.01"
            min={suggestedBid}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            disabled={isSubmitting || isLeading}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white text-lg font-bold focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors disabled:opacity-50"
            placeholder="Monto a ofertar"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-slate-500 font-medium">ARS</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isLeading || !bidAmount || parseFloat(bidAmount) < suggestedBid}
          className="w-full relative group overflow-hidden bg-amber-500 text-slate-950 font-extrabold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-400"
        >
          {isSubmitting ? (
            'Procesando Puja...'
          ) : isLeading ? (
            'Ya eres el líder'
          ) : (
            `Ofertar ${formatCurrency(parseFloat(bidAmount || 0))}`
          )}
        </button>
      </form>
    </div>
  );
}
