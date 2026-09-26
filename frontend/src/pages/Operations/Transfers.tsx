import React, { useEffect, useState } from 'react';
import { ArrowLeftRight, Plus, Check, Clock, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Transfer, Warehouse, Location, Product } from '../../types';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Transfers: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sourceLocations, setSourceLocations] = useState<Location[]>([]);
  const [destLocations, setDestLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('20');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const [trfRes, whRes, prodRes] = await Promise.all([
        api.get('/inventory/transfers'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setTransfers(trfRes.data);
      setWarehouses(whRes.data);
      setProducts(prodRes.data);

      if (whRes.data[0] && !sourceWarehouseId) {
        setSourceWarehouseId(whRes.data[0].id);
        setDestWarehouseId(whRes.data[0].id);
      }
      if (prodRes.data[0] && !productId) setProductId(prodRes.data[0].id);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (!sourceWarehouseId) return;
    api.get(`/warehouses/locations?warehouseId=${sourceWarehouseId}`).then((res) => {
      setSourceLocations(res.data);
      if (res.data[0]) setSourceLocationId(res.data[0].id);
    });
  }, [sourceWarehouseId]);

  useEffect(() => {
    if (!destWarehouseId) return;
    api.get(`/warehouses/locations?warehouseId=${destWarehouseId}`).then((res) => {
      setDestLocations(res.data);
      if (res.data[1]) setDestLocationId(res.data[1].id);
      else if (res.data[0]) setDestLocationId(res.data[0].id);
    });
  }, [destWarehouseId]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !sourceLocationId || !destWarehouseId || !destLocationId || !productId) return;
    setSubmitting(true);
    try {
      await api.post('/inventory/transfers', {
        sourceWarehouseId,
        sourceLocationId,
        destWarehouseId,
        destLocationId,
        notes,
        items: [{ productId, quantity: parseFloat(quantity) || 1 }],
      });
      setIsModalOpen(false);
      setNotes('');
      fetchTransfers();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTransfer = async (id: string) => {
    setCompletingId(id);
    try {
      await api.post(`/inventory/transfers/${id}/complete`);
      await fetchTransfers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Transfer completion failed');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-sky-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Internal Transfers & Location Reallocation
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 7 — Inter-bin and inter-facility transfers. Total company stock remains invariant while location allocations change atomically.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Internal Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Transfer #</th>
                <th className="py-3 px-4">Product (SKU)</th>
                <th className="py-3 px-4 text-right">Transfer Units</th>
                <th className="py-3 px-4">Origin / Source</th>
                <th className="py-3 px-4">Destination Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Execution Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No internal transfers recorded.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  const item = t.items[0];
                  const isDone = t.status === 'DONE';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {t.transferNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {item?.product?.name}
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">{item?.product?.sku}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sky-700">
                        {item?.quantity} {item?.product?.uom}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {t.sourceWarehouse?.name} / {t.sourceLocation?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {t.destWarehouse?.name} / {t.destLocation?.name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(t.status)} size="sm">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold font-mono">
                            <Check className="w-3.5 h-3.5" /> Transferred
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCompleteTransfer(t.id)}
                            disabled={completingId === t.id}
                            className="px-3 py-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                          >
                            {completingId === t.id ? 'Completing...' : 'Complete Transfer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Internal Stock Transfer"
        subtitle="Transfer A → B moves allocation without altering total company stock"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Transfer</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Origin Source */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Source Location (Stock Decreases)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse</label>
                <select
                  value={sourceWarehouseId}
                  onChange={(e) => setSourceWarehouseId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Source Bin / Rack</label>
                <select
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                >
                  {sourceLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Destination Target */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Destination Target (Stock Increases)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse</label>
                <select
                  value={destWarehouseId}
                  onChange={(e) => setDestWarehouseId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
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
                <label className="block text-xs font-medium text-slate-600 mb-1">Target Bin / Rack</label>
                <select
                  value={destLocationId}
                  onChange={(e) => setDestLocationId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  required
                >
                  {destLocations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Manifest Reference</label>
            <input
              type="text"
              placeholder="e.g. Staging replenishment for production pick"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
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
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              {submitting ? 'Creating...' : 'Create Transfer Manifest'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
