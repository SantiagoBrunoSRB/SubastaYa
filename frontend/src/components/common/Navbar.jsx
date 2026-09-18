import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gavel, PlusCircle, User, Wallet, Menu, X } from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { balance } = useWallet();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
  };

  const navLinks = [
    { path: '/', label: 'Catálogo', icon: Gavel },
    { path: '/crear-subasta', label: 'Publicar Subasta', icon: PlusCircle },
    { path: '/mi-perfil', label: 'Mi Perfil', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-amber-500 hover:text-amber-400 transition-colors">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Gavel className="w-6 h-6 text-amber-500" />
            </div>
            <span className="tracking-tight text-white font-extrabold text-2xl">
              Subasta<span className="text-amber-500">Ya</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Slot para Billetera (Desarrollador B) + Acciones */}
          <div className="hidden md:flex items-center gap-4">
            {/* Slot de integración para Billetera del Dev B */}
            <div id="wallet-navbar-slot" className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700 transition-colors cursor-pointer">
              <Wallet className="w-4 h-4 text-amber-400" />
              <Link to="/billetera" className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans font-semibold">Disponible</span>
                <span className="font-bold text-white text-sm">{formatCurrency(balance?.availableAmount)}</span>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  active
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          
          <div className="pt-2 border-t border-slate-800">
            <Link
              to="/billetera"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-amber-400" />
                <span>Billetera</span>
              </div>
              <span className="font-semibold text-white">{formatCurrency(balance?.availableAmount)}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
