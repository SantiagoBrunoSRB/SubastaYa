import React from 'react';
import { useParams } from 'react-router-dom';
import { Gavel } from 'lucide-react';

export default function AuctionDetailPage() {
  const { id } = useParams();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <Gavel className="w-8 h-8 text-amber-500" />
        <h1 className="text-2xl font-bold text-white">Sala de Subasta #{id}</h1>
      </div>
      <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
        [Módulo 3: Sala de Subasta en vivo y WebSockets asignado a Desarrollador B en la ruta <code className="text-amber-400">/subasta/{id}</code>]
      </div>
    </div>
  );
}
