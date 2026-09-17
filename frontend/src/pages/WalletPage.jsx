import React from 'react';
import { Wallet } from 'lucide-react';

export default function WalletPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Wallet className="w-8 h-8 text-amber-500" />
        <h1 className="text-2xl font-bold text-white">Mi Billetera</h1>
      </div>
      <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
        [Módulo 4: Billetera y Carga de Saldo asignado a Desarrollador B en la ruta <code className="text-amber-400">/billetera</code>]
      </div>
    </div>
  );
}
