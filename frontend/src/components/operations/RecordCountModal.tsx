import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ClipboardCheck, AlertTriangle, CheckCircle2, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { Warehouse, Location, Product } from '../../types';

interface RecordCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCountRecorded: () => void;
  preselectedProductId?: string;
  preselectedWarehouseId?: string;
  preselectedLocationId?: string;
}

export const RecordCountModal: React.FC<RecordCountModalProps> = ({
  isOpen,
  onClose,
  onCountRecorded,
  preselectedProductId,
  preselectedWarehouseId,
  preselectedLocationId,
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState(preselectedWarehouseId || '');
  const [selectedLocationId, setSelectedLocationId] = useState(preselectedLocationId || '');
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId || '');

  const [systemQuantity, setSystemQuantity] = useState<number>(0);
  const [physicalQuantity, setPhysicalQuantity] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dropdown metadata
  useEffect(() => {
    if (!isOpen) return;

    const loadMeta = async () => {
      try {
        const [whRes, prodRes] = await Promise.all([
          api.get('/warehouses'),
          api.get('/products'),
        ]);
        setWarehouses(whRes.data);
        setProducts(prodRes.data);

        const initialWhId = preselectedWarehouseId || whRes.data[0]?.id || '';
        setSelectedWarehouseId(initialWhId);

        const initialProdId = preselectedProductId || prodRes.data[0]?.id || '';
        setSelectedProductId(initialProdId);
      } catch (err: any) {
        setError(err.message || 'Failed to load warehouses/products');
      }
    };

    loadMeta();
  }, [isOpen, preselectedWarehouseId, preselectedProductId]);

  // Load locations when warehouse changes
  useEffect(() => {
    if (!selectedWarehouseId) return;

    const loadLocations = async () => {
      try {
        const res = await api.get(`/warehouses/locations?warehouseId=${selectedWarehouseId}`);
        setLocations(res.data);
        const initialLocId = preselectedLocationId || res.data[0]?.id || '';
        setSelectedLocationId(initialLocId);
      } catch (err: any) {
        setError(err.message || 'Failed to load locations');
      }
    };

    loadLocations();
  }, [selectedWarehouseId, preselectedLocationId]);

  // Fetch current system balance when warehouse, location, and product are selected
  useEffect(() => {
    if (!selectedWarehouseId || !selectedLocationId || !selectedProductId) return;

    const fetchCurrentBalance = async () => {
      setLoadingBalance(true);
      try {
        const res = await api.get(
          `/inventory/stock?warehouseId=${selectedWarehouseId}&locationId=${selectedLocationId}`
        );
        const match = res.data.find((b: any) => b.productId === selectedProductId);
        const qty = match ? match.quantity : 0;
        setSystemQuantity(qty);
      } catch (err) {
        console.warn('Could not fetch balance', err);
        setSystemQuantity(0);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchCurrentBalance();
  }, [selectedWarehouseId, selectedLocationId, selectedProductId]);

  // Real-time calculation of variance and tolerance
  const physQtyNum = physicalQuantity === '' ? systemQuantity : parseFloat(physicalQuantity) || 0;
  const variance = physQtyNum - systemQuantity;
  const absVariance = Math.abs(variance);
  const variancePercentage =
    systemQuantity !== 0 ? (variance / systemQuantity) * 100 : variance === 0 ? 0 : 100;

  // Frontend mirror of backend tolerance rules
  const computeAllowedTolerance = (sysQty: number) => {
    const qty = Math.abs(sysQty);
    if (qty <= 20) return { tier: '0–20 units', allowed: 1 };
    if (qty <= 100) return { tier: '21–100 units', allowed: Math.max(2, qty * 0.02) };
    if (qty <= 500) return { tier: '101–500 units', allowed: qty * 0.02 };
    return { tier: '501+ units', allowed: qty * 0.01 };
  };

  const toleranceRule = computeAllowedTolerance(systemQuantity);
  const isWithinTolerance = absVariance <= toleranceRule.allowed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId || !selectedLocationId || !selectedProductId) {
      setError('Please select warehouse, location, and product.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/inventory/physical-counts', {
        warehouseId: selectedWarehouseId,
        locationId: selectedLocationId,
        productId: selectedProductId,
        physicalQuantity: physQtyNum,
        notes: notes || undefined,
      });

      onCountRecorded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to record count');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Physical Inventory Count"
      subtitle="Audits on-hand stock and verifies mathematical tolerance bands"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Warehouse */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Facility / Warehouse</label>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-purple-200/80 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Location / Rack</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-purple-200/80 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
              required
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.rack ? `[Rack ${l.rack}]` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Product SKU & Name</label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setPhysicalQuantity('');
            }}
            className="w-full px-3 py-2 bg-white border border-purple-200/80 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
            required
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name} ({p.uom})
              </option>
            ))}
          </select>
        </div>

        {/* Live System vs Physical Count Comparison */}
        <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            {/* System Quantity */}
            <div className="p-3.5 bg-white border border-purple-100/80 rounded-xl text-center shadow-xs">
              <span className="block text-[10px] uppercase font-bold text-slate-400">System Recorded Stock</span>
              <span className="text-2xl font-black font-mono text-purple-950 mt-1 block">
                {loadingBalance ? '...' : systemQuantity} <span className="text-xs font-normal text-slate-500">{selectedProduct?.uom || 'units'}</span>
              </span>
            </div>

            {/* Physical Input */}
            <div className="p-3.5 bg-white border border-purple-300 rounded-xl shadow-xs">
              <label className="block text-[10px] uppercase font-bold text-purple-700 text-center">
                Physical Verified Count
              </label>
              <input
                type="number"
                step="any"
                placeholder={String(systemQuantity)}
                value={physicalQuantity}
                onChange={(e) => setPhysicalQuantity(e.target.value)}
                className="w-full text-center text-2xl font-black font-mono text-slate-900 focus:outline-none mt-1"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Tolerance Engine Live Evaluation Card */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all ${
              isWithinTolerance
                ? 'bg-purple-100/60 border-purple-200 text-purple-900'
                : 'bg-pink-50/80 border-pink-200 text-pink-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isWithinTolerance ? (
                <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-pink-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block">
                  {isWithinTolerance
                    ? 'WITHIN TOLERANCE — Reconciled automatically'
                    : 'OUTSIDE TOLERANCE — Exception will be created'}
                </span>
                <span className="text-[11px] opacity-80">
                  Allowed Variance: ±{toleranceRule.allowed.toFixed(1)} units ({toleranceRule.tier})
                </span>
              </div>
            </div>

            <div className="font-mono font-black text-right shrink-0 text-sm">
              Variance: {variance > 0 ? `+${variance}` : variance} ({variancePercentage.toFixed(1)}%)
            </div>
          </div>

          <div className="text-[11px] text-slate-500 px-1 italic">
            * Note: Submitting this count records physical reality. It will <strong>NOT</strong> silently overwrite book inventory.
          </div>
        </div>

        {/* Verification Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Verification Auditor Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Conducted during morning cycle count on Rack A1."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-purple-200/80 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-purple-100/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all hover:scale-[1.01]"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{submitting ? 'Auditing...' : 'Submit Physical Verification'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
