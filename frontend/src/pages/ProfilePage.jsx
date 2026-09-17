import React from 'react';
import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <User className="w-8 h-8 text-amber-500" />
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
      </div>
      <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-slate-500">
        [Módulo 5: Vista de Perfil y Pestañas Mis Compras / Mis Publicaciones se implementará en la rama: <code className="text-amber-400">feature/frontend-user-profile</code>]
      </div>
    </div>
  );
}
