import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Gavel, Loader2, Tag, User as UserIcon } from 'lucide-react';
import { fetchWithAuth, adaptBackendAuction } from '../services/api';
import { signalRService } from '../services/signalrService';
import { MOCK_AUCTIONS } from '../services/mockData';
import AuctionTimer from '../components/auctions/AuctionTimer';
import BidConsole from '../components/auctions/BidConsole';

// Mapeo simple de estados desde el enum del backend (0: Pending, 1: Active, 2: Finished, etc)
const AuctionState = {
  0: 'Pendiente',
  1: 'Activa',
  2: 'Finalizada',
  3: 'Desierta'
};

export default function AuctionDetailPage() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extra state for real-time updates
  const [currentPrice, setCurrentPrice] = useState(0);
  const [bids, setBids] = useState([]);

  // Check if current user is leading
  const [isLeading, setIsLeading] = useState(false);

  useEffect(() => {
    const loadAuction = async () => {
      const isNumericId = !isNaN(Number(id)) && id !== '' && !id.includes('_');

      // 1. Para IDs numéricos, la API del backend es la fuente de verdad.
      //    Así el historial de pujas y el saldo retenido siempre reflejan el estado real.
      if (isNumericId) {
        try {
          const data = await fetchWithAuth(`/auctions/${id}`);
          const adapted = adaptBackendAuction(data);
          setAuction(adapted);
          setCurrentPrice(adapted.currentPrice);
          setBids(adapted.bids || []);
          setError(null);
        } catch (err) {
          setError(err.message || 'Error al cargar la subasta.');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // 2. Para IDs no-numéricos (subastas locales / mock): buscar en localStorage
      const customAuctions = getCustomAuctions();
      const custom = customAuctions.find((a) => String(a.id) === String(id));
      if (custom) {
        setAuction({
          ...custom,
          state: custom.status === 'ACTIVE' ? 1 : custom.status === 'UPCOMING' ? 0 : 2,
          category: custom.category || 'Electrónica',
          bids: custom.bids || [],
        });
        setCurrentPrice(custom.currentPrice || custom.startingPrice);
        setBids(custom.bids || []);
        setIsLoading(false);
        setError(null);
        return;
      }

      // 3. Buscar en mocks estáticos (IDs tipo 'auc_101')
      const mock = MOCK_AUCTIONS.find((a) => String(a.id) === String(id));
      if (mock) {
        setAuction({
          ...mock,
          state: mock.status === 'ACTIVE' ? 1 : mock.status === 'UPCOMING' ? 0 : 2,
          category: mock.category,
          bids: mock.bids || [],
        });
        setCurrentPrice(mock.currentPrice);
        setBids(mock.bids || []);
        setIsLoading(false);
        setError(null);
        return;
      }

      // ID no numérico no encontrado en ninguna fuente
      setError('Subasta no encontrada. Es posible que haya expirado o no exista.');
      setIsLoading(false);
    };

    loadAuction();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // Solo conectar grupo en SignalR si el ID es válido numéricamente en el backend
    if (!isNaN(Number(id))) {
      signalRService.startConnection(id);
    }

    // Escuchar pujas nuevas
    const handleReceiveBid = (bidData) => {
      setBids(prev => [bidData, ...prev]);
      setCurrentPrice(bidData.amount);
    };

    signalRService.onReceiveBid(handleReceiveBid);

    return () => {
      signalRService.offReceiveBid(handleReceiveBid);
      if (!isNaN(Number(id))) {
        signalRService.stopConnection(id);
      }
    };
  }, [id]);

  const handleLocalBidSuccess = (newAmount) => {
    setCurrentPrice(newAmount);
    setIsLeading(true);

    const currentUserEmail = localStorage.getItem('userEmail') || 'Tú';
    const newBid = {
      id: Date.now(),
      amount: newAmount,
      bidderId: currentUserEmail,
      timestamp: new Date().toISOString()
    };
    setBids((prev) => [newBid, ...prev]);
    // Para subastas reales (ID numérico), SignalR ya envía el bid a todos los clientes.
    // Para mocks, solo actualizamos el estado en memoria (sin persistir).
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center">
        {error || 'Subasta no encontrada.'}
      </div>
    );
  }

  const nowMs = Date.now();
  const startMs = auction.startTime ? new Date(auction.startTime).getTime() : null;
  const endMs = auction.endTime ? new Date(auction.endTime).getTime() : null;
  const bidsCount = Number(auction.bidCount) || (bids ? bids.length : 0);

  const isClosed = auction.state === 2 || auction.state === 3 || (endMs && endMs <= nowMs);
  // Próxima: solo si la fecha de inicio es estrictamente futura (la fecha manda, no las pujas)
  const isUpcoming = !isClosed && startMs && startMs > nowMs;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Tag className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              {auction.category || 'Categoría'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{auction.title}</h1>
        </div>
        <div className="flex flex-col items-start md:items-end bg-slate-900 px-6 py-3 rounded-xl border border-slate-800">
          <AuctionTimer 
            initialStartTime={auction.startTime}
            initialEndTime={auction.endTime} 
            onTimeEnd={() => {/* Fin de subasta */}} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Detalles */}
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden relative">
            {auction.imageUrl ? (
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Gavel className="w-24 h-24 text-slate-800" />
            )}
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Descripción del Producto</h3>
            <p className="text-slate-300 leading-relaxed">
              {auction.description || 'Sin descripción disponible para este producto.'}
            </p>
          </div>
        </div>

        {/* Columna Derecha: Consola y Pujas */}
        <div className="space-y-6">
          {/* Consola de Pujas */}
          <BidConsole 
            auctionId={id}
            currentPrice={currentPrice}
            minimumIncrement={100}
            isLeading={isLeading}
            isClosed={isClosed}
            isUpcoming={isUpcoming}
            startTime={auction.startTime}
            onBidSuccess={handleLocalBidSuccess}
          />

          {/* Historial de Pujas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                Historial en vivo
                <span className="relative flex h-2.5 w-2.5 ml-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {bids.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">
                  Aún no hay ofertas. ¡Sé el primero!
                </div>
              ) : (
                bids.map((bid, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 animate-fade-in-up">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">
                          {bid.bidderId ? bid.bidderId.split('-')[0] + '...' : 'Anónimo'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(bid.timestamp || new Date()).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-green-400">
                      ${bid.amount?.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
