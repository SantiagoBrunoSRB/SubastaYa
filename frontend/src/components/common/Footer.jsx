import React from 'react';
import { Gavel } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-white text-lg">SubastaYa</span>
            <span className="text-xs text-slate-500 ml-2"> Plataforma de Subastas en Tiempo Real</span>
          </div>
          <p className="text-sm text-slate-500 text-center">
            &copy; {new Date().getFullYear()} SubastaYa. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
