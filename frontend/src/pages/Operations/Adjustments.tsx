import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Adjustment, Warehouse, Location, Product } from '../../types';
import { Modal } from '../../components/common/Modal';

export const Adjustments: React.FC = () => {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantityChange, setQuantityChange] = useState('-3');
  const [reason, setReason] = useState('Damaged stock during handling');
  const [submitting, setSubmitting] = useState(false);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const [adjRes, whRes, prodRes] = await Promise.all([
        api.get('/inventory/adjustments'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setAdjustments(adjRes.data);
      setWarehouses(whRes.data);
      setProducts(prodRes.data);

      if (whRes.data[0] && !warehouseId) setWarehouseId(whRes.data[0].id);
      if (prodRes.data[0] && !productId) setProductId(prodRes.data[0].id);
    } catch (err) {
      console.error('Failed to load adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    api.get(`/warehouses/locations?warehouseId=${warehouseId}`).then((res) => {
      setLocations(res.data);
      if (res.data[0]) setLocationId(res.data[0].id);
    });
  }, [warehouseId]);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseId || !locationId || !productId || !reason) return;
    setSubmitting(true);
    try {
      await api.post('/inventory/adjustments', {
        warehouseId,
        locationId,
        productId,
        quantityChange: parseFloat(quantityChange) || 0,
        reason,
      });
      setIsModalOpen(false);
      fetchAdjustments();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventory Adjustments & Write-Offs
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manual stock corrections with explicit business reasoning. Adjustments exceeding thresholds trigger UNUSUAL_ADJUSTMENT exceptions automatically.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Adjustment #</th>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Warehouse & Bin</th>
                <th className="py-3 px-4 text-right">Adjustment Delta</th>
                <th className="py-3 px-4">Business Reason</th>
                <th className="py-3 px-4">Date Recorded</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading adjustments...
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No manual adjustments recorded.
                  </td>
                </tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {a.adjustmentNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{a.product?.name}</div>
                      <span className="font-mono text-slate-400 text-[11px]">{a.product?.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {a.warehouse?.name} / {a.location?.name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          a.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }
                      >
                        {a.quantityChange > 0 ? `+${a.quantityChange}` : a.quantityChange} {a.product?.uom}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 italic">
                      "{a.reason}"
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold font-mono text-[10px]">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Stock Adjustment"
        subtitle="Specify positive intake or negative write-off delta with audit reason"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name} ({p.uom})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Delta (+ or -)</label>
              <input
                type="number"
                step="any"
                placeholder="-3"
                value={quantityChange}
                onChange={(e) => setQuantityChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Bin</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                required
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Business Reason</label>
            <input
              type="text"
              placeholder="e.g. Damaged stock during forklift handling"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              {submitting ? 'Applying...' : 'Apply Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
