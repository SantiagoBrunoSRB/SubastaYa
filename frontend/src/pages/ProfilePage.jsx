import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Gavel,
  Tag,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import { MOCK_USER, MOCK_AUCTIONS } from '../services/mockData';
import { fetchWithAuth, adaptBackendAuction, getEffectiveStatus } from '../services/api';
import { useWallet } from '../contexts/WalletContext';

export default function ProfilePage() {
  const { isAuthenticated, login, isLoading } = useWallet();
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' | 'publications'
  const [myPublications, setMyPublications] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);

  const user = {
    ...MOCK_USER,
    name: localStorage.getItem('userEmail') ? localStorage.getItem('userEmail').split('@')[0] : MOCK_USER.name,
    email: localStorage.getItem('userEmail') || MOCK_USER.email,
  };

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Publicaciones: el endpoint filtra automáticamente por el usuario del JWT
        const data = await fetchWithAuth('/auctions/my-publications');
        const pubs = Array.isArray(data)
          ? data.map((a) => adaptBackendAuction(a)).map((a) => ({ ...a, status: getEffectiveStatus(a) }))
          : [];
        setMyPublications(pubs);
      } catch (err) {
        console.warn('No se pudieron consultar publicaciones del backend:', err);
        setMyPublications([]);
      }

      // Compras / participaciones: datos de demo hasta que el backend tenga ese endpoint
      setMyPurchases(
        MOCK_AUCTIONS.map((item) => ({ ...item, status: getEffectiveStatus(item) }))
      );
    };

    loadProfileData();
  }, []);

  // Formateador de moneda ARS
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- Login Gate ---
  if (!isAuthenticated) {
    const demoUsers = [
      { email: 'comprador1@test.com', label: 'Comprador 1', desc: '$150.000 · Lidera puja activa', colorClass: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30' },
      { email: 'comprador2@test.com', label: 'Comprador 2', desc: '$200.000 · Fondos libres',      colorClass: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' },
      { email: 'vendedor@test.com',   label: 'Vendedor',    desc: 'Sin saldo · Solo publica',      colorClass: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30' },
      { email: 'sinfondos@test.com',  label: 'Sin Fondos',  desc: '$500 · No puede pujar alto',    colorClass: 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/30' },
    ];

    return (
      <div className="max-w-md mx-auto mt-16 flex flex-col items-center gap-8">
        {/* Icono */}
        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xl">
          <LogIn className="w-10 h-10 text-amber-500" />
        </div>

        {/* Texto */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black text-white">Iniciá sesión para ver tu perfil</h1>
          <p className="text-slate-400 text-sm">
            Seleccioná uno de los usuarios de demo para explorar la plataforma.
          </p>
        </div>

        {/* Botones de demo */}
        <div className="w-full space-y-3">
          {demoUsers.map((u) => (
            <button
              key={u.email}
              onClick={() => login(u.email, 'Password123!')}
              disabled={isLoading}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border font-semibold transition-all disabled:opacity-50 ${u.colorClass}`}
            >
              <div className="text-left">
                <span className="block text-sm font-bold">{u.label}</span>
                <span className="block text-xs opacity-70 font-normal mt-0.5">{u.desc}</span>
              </div>
              <LogIn className="w-4 h-4 shrink-0 opacity-60" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header del Perfil / Tarjeta de Usuario */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          
          {/* Avatar */}
          <div className="relative group">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xl"
            />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-xl shadow-lg border border-slate-900">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Datos del Usuario */}
          <div className="space-y-2 text-center sm:text-left flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 w-max mx-auto sm:mx-0">
                Vendedor Verificado
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>ID: {user.id}</span>
              </div>
            </div>

            {/* Métricas del Usuario */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-center sm:text-left">
                <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-medium">
                  Mis Publicaciones
                </span>
                <span className="text-lg font-extrabold text-white">
                  {myPublications.length}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-center sm:text-left">
                <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-medium">
                  Mis Compras / Pujas
                </span>
                <span className="text-lg font-extrabold text-white">
                  {myPurchases.length}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-center sm:text-left col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-500 block uppercase tracking-wider font-medium">
                  Reputación
                </span>
                <span className="text-lg font-extrabold text-emerald-400">
                  98.5% ★
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Icono decorativo de fondo */}
        <Gavel className="absolute -right-10 -bottom-10 w-56 h-56 text-slate-800/20 rotate-12 pointer-events-none" />
      </div>

      {/* Control de Pestañas (Tabs) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'purchases'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Mis Compras y Pujas ({myPurchases.length})
        </button>

        <button
          onClick={() => setActiveTab('publications')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'publications'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          Mis Publicaciones ({myPublications.length})
        </button>
      </div>

      {/* Contenido de la Pestaña activa */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Subastas en las que estás participando o has ganado</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPurchases.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:border-slate-700 transition-colors"
              >
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=60'}
                  alt={item.title}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=60'; }}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-950 shrink-0"
                />
                <div className="space-y-1 flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-amber-400 font-semibold truncate">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status === 'ACTIVE' ? 'En Curso' : 'Finalizada'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm truncate">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">
                      Última Oferta:{' '}
                      <strong className="text-white">
                        {formatCurrency(item.currentPrice)}
                      </strong>
                    </span>
                    <Link
                      to={`/subasta/${item.id}`}
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Ver Sala
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'publications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Subastas creadas por ti en la plataforma</span>
            <Link
              to="/crear-subasta"
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
            >
              + Publicar nueva subasta
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPublications.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:border-slate-700 transition-colors"
              >
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=60'}
                  alt={item.title}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=60'; }}
                  className="w-20 h-20 rounded-xl object-cover bg-slate-950 shrink-0"
                />
                <div className="space-y-1 flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-amber-400 font-semibold truncate">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'UPCOMING'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.status === 'ACTIVE' ? 'Activa' : item.status === 'UPCOMING' ? 'Próximamente' : 'Finalizada'}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm truncate">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">
                      Pujas recibidas:{' '}
                      <strong className="text-white">{item.bidCount}</strong> |{' '}
                      {formatCurrency(item.currentPrice)}
                    </span>
                    <Link
                      to={`/subasta/${item.id}`}
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      Ver Detalle
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
