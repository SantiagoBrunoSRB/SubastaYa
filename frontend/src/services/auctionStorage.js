// Servicio para persistencia de subastas creadas localmente
const STORAGE_KEY = 'subastaya_custom_auctions';

export const getCustomAuctions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error al leer subastas de localStorage:', err);
    return [];
  }
};

export const saveCustomAuction = (auction) => {
  try {
    const current = getCustomAuctions();
    const updated = [auction, ...current.filter((a) => String(a.id) !== String(auction.id))];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error al guardar subasta en localStorage:', err);
    return [];
  }
};
