import React from 'react';
import { PlusCircle } from 'lucide-react';

export default function CreateAuctionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <PlusCircle className="w-8 h-8 text-amber-500" />
        <h1 className="text-2xl font-bold text-white">Publicar Nueva Subasta</h1>
      </div>
      <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
        [Módulo 2: Formulario de creación de subasta se implementará en la rama: <code className="text-amber-400">feature/frontend-create-auction</code>]
      </div>
    </div>
  );
}
