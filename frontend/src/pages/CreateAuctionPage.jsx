import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { MOCK_CATEGORIES, MOCK_AUCTIONS } from '../services/mockData';
import AuctionCard from '../components/auctions/AuctionCard';

export default function CreateAuctionPage() {
  const navigate = useNavigate();

  // Fecha predeterminada de inicio (ahora) y fin (+48 horas)
  const now = new Date();
  const defaultStart = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [formData, setFormData] = useState({
    title: '',
    category: MOCK_CATEGORIES[1] || 'Electrónica',
    startingPrice: '',
    startTime: defaultStart,
    endTime: defaultEnd,
    imageUrl: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const categoriesOptions = MOCK_CATEGORIES.filter((c) => c !== 'Todas');

  // Imagen por defecto si no ingresa URL
  const previewImageUrl =
    formData.imageUrl.trim() ||
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo modificado
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título del producto es obligatorio';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'El título debe tener al menos 5 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    const price = parseFloat(formData.startingPrice);
    if (!formData.startingPrice || isNaN(price) || price <= 0) {
      newErrors.startingPrice = 'El precio inicial debe ser un número mayor a 0';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'La fecha de inicio es requerida';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'La fecha de finalización es requerida';
    } else if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      newErrors.endTime = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulación de envío a API REST
    setTimeout(() => {
      const newAuction = {
        id: `auc_${Date.now()}`,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        startingPrice: parseFloat(formData.startingPrice),
        currentPrice: parseFloat(formData.startingPrice),
        bidCount: 0,
        status: 'ACTIVE',
        imageUrl: previewImageUrl,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        sellerId: 'usr_1',
        sellerName: 'Santiago Bruno',
      };

      // Agregar temporalmente al mock local
      MOCK_AUCTIONS.unshift(newAuction);

      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1000);
  };

  // Objeto preparado para la previsualización del AuctionCard
  const previewAuctionObj = {
    id: 'preview',
    title: formData.title || 'Título de tu subasta',
    category: formData.category,
    currentPrice: parseFloat(formData.startingPrice) || 0,
    bidCount: 0,
    status: 'ACTIVE',
    imageUrl: previewImageUrl,
    endTime: formData.endTime,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Publicar Nueva Subasta
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Ingresá los detalles del producto para crear la subasta y comenzar a recibir ofertas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulario (Columna Izquierda 7/12) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Título */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Título del producto <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ej: PlayStation 5 Edición Digital con mando extra"
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    errors.title ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
              </div>
              {errors.title && (
                <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Fila 2: Categoría & Precio Inicial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Categoría */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  Categoría <span className="text-amber-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  {categoriesOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio Inicial */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  Precio Base / Inicial ($ ARS) <span className="text-amber-500">*</span>
                </label>
                <input
                  type="number"
                  name="startingPrice"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  placeholder="50000"
                  min="1"
                  step="1000"
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    errors.startingPrice ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {errors.startingPrice && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.startingPrice}
                  </p>
                )}
              </div>
            </div>

            {/* Fila 3: Fechas Inicio y Fin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fecha Inicio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Fecha / Hora Inicio <span className="text-amber-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors ${
                    errors.startTime ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {errors.startTime && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.startTime}
                  </p>
                )}
              </div>

              {/* Fecha Fin */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Fecha / Hora Finalización <span className="text-amber-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors ${
                    errors.endTime ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {errors.endTime && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>

            {/* URL Imagen */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                URL de Imagen del Producto
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg (opcional)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 block">
                Si dejás este campo vacío, se asignará una imagen ilustrativa por defecto.
              </span>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Descripción del Producto <span className="text-amber-500">*</span>
              </label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detallá el estado del producto, si incluye garantía, accesorios y condiciones de entrega..."
                className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors resize-y ${
                  errors.description ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800 focus:border-amber-500'
                }`}
              ></textarea>
              {errors.description && (
                <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Botón de Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Publicando subasta...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Publicar Subasta Ahora
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Previsualización en Vivo (Columna Derecha 5/12) */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Previsualización en tiempo real
            </span>
            <span className="text-xs text-slate-500">Vista del comprador</span>
          </div>

          <div className="max-w-sm mx-auto lg:max-w-none">
            <AuctionCard auction={previewAuctionObj} />
          </div>
        </div>
      </div>

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex p-4 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">¡Subasta Publicada!</h3>
              <p className="text-sm text-slate-400">
                Tu publicación ha sido creada exitosamente y ya se encuentra visible en el catálogo principal.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
              >
                Ir al Catálogo de Subastas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
