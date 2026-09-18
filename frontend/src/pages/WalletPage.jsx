import React, { useState } from 'react';
import { Wallet, ArrowDownToLine, Activity } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export default function WalletPage() {
  const { balance, transactions, deposit, isLoading, error } = useWallet();
  const [depositAmount, setDepositAmount] = useState('');
  const [localError, setLocalError] = useState(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const amount = parseFloat(depositAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setLocalError('Ingresa un monto válido mayor a 0');
      return;
    }

    try {
      await deposit(amount);
      setDepositAmount('');
    } catch (err) {
      setLocalError(err.message || 'Error al depositar');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Wallet className="w-8 h-8 text-amber-500" />
        <h1 className="text-2xl font-bold text-white">Mi Billetera</h1>
      </div>

      {(error || localError) && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error || localError}
        </div>
      )}

      {/* Tarjetas de Saldo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Saldo Total</span>
          <span className="text-3xl font-bold text-white">{formatCurrency(balance?.totalAmount)}</span>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Saldo Retenido</span>
          <span className="text-3xl font-bold text-amber-400">{formatCurrency(balance?.retainedAmount)}</span>
          <span className="text-xs text-slate-500">En subastas activas</span>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-900/20 border border-amber-500/30 flex flex-col gap-2">
          <span className="text-amber-200 text-sm font-medium uppercase tracking-wider">Saldo Disponible</span>
          <span className="text-3xl font-bold text-white">{formatCurrency(balance?.availableAmount)}</span>
          <span className="text-xs text-amber-500/70">Para nuevas pujas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulario de Depósito */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-amber-500" />
            Cargar Saldo
          </h2>
          <form onSubmit={handleDeposit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-slate-300">
                Monto a simular (ARS)
              </label>
              <input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                placeholder="Ej. 10000"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !depositAmount}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Procesando...' : 'Acreditar Fondos'}
            </button>
          </form>
        </div>

        {/* Historial de Movimientos */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Historial de Movimientos
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Fecha</th>
                    <th className="px-6 py-4 font-medium">Tipo</th>
                    <th className="px-6 py-4 font-medium">Concepto</th>
                    <th className="px-6 py-4 font-medium text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {transactions?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        No hay movimientos registrados.
                      </td>
                    </tr>
                  ) : (
                    transactions?.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('es-AR')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            tx.type === 'Deposit' ? 'bg-green-500/10 text-green-400' :
                            tx.type === 'Hold' ? 'bg-amber-500/10 text-amber-400' :
                            tx.type === 'Release' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 truncate max-w-[200px]" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className={`px-6 py-4 text-right font-medium ${
                          tx.amount > 0 ? 'text-green-400' : 'text-white'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
