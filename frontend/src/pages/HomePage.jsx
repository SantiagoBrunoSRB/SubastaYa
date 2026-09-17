import React from 'react';
import { Gavel } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-slate-800 rounded-2xl p-8 text-center sm:text-left sm:flex items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Catálogo de Subastas
          </h1>
          <p className="text-slate-400 max-w-xl">
            Explora y puja en tiempo real por los mejores productos. Seguridad, transparencia y velocidad garantizada.
          </p>
        </div>
        <div className="hidden sm:flex p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
          <Gavel className="w-12 h-12" />
        </div>
      </div>

      <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
        [Módulo 1: Catálogo y filtros se implementarán en la siguiente rama: <code className="text-amber-400">feature/frontend-auction-catalog</code>]
      </div>
    </div>
  );
}
