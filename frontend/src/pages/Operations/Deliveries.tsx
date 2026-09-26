import React, { useEffect, useState } from 'react';
import { ArrowUpFromLine, Plus, Check, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Delivery, Warehouse, Location, Product } from '../../types';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customer, setCustomer] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('20');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const [delRes, whRes, prodRes] = await Promise.all([
        api.get('/inventory/deliveries'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setDeliveries(delRes.data);
      setWarehouses(whRes.data);
      setProducts(prodRes.data);

      if (whRes.data[0] && !sourceWarehouseId) setSourceWarehouseId(whRes.data[0].id);
      if (prodRes.data[0] && !productId) setProductId(prodRes.data[0].id);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    if (!sourceWarehouseId) return;
    api.get(`/warehouses/locations?warehouseId=${sourceWarehouseId}`).then((res) => {
      setLocations(res.data);
      if (res.data[0]) setSourceLocationId(res.data[0].id);
    });
  }, [sourceWarehouseId]);

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !sourceWarehouseId || !sourceLocationId || !productId) return;
    setSubmitting(true);
    try {
      await api.post('/inventory/deliveries', {
        customer,
        sourceWarehouseId,
        sourceLocationId,
        notes,
        items: [{ productId, quantity: parseFloat(quantity) || 1 }],
      });
      setIsModalOpen(false);
      setCustomer('');
      setNotes('');
      fetchDeliveries();
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateDelivery = async (id: string) => {
    setValidatingId(id);
    try {
      await api.post(`/inventory/deliveries/${id}/validate`);
      await fetchDeliveries();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Validation failed');
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ArrowUpFromLine className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Outbound Delivery Orders & Dispatch
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 6 — Delivery workflow. Validating decrements warehouse stock and generates double-sided ledger entries.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Order</span>
        </button>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order / Delivery #</th>
                <th className="py-3 px-4">Customer Entity</th>
                <th className="py-3 px-4">Source Location / Rack</th>
                <th className="py-3 px-4">Required Item & Units</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading delivery orders...
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No outbound deliveries registered.
                  </td>
                </tr>
              ) : (
                deliveries.map((d) => {
                  const item = d.items[0];
                  const isDone = d.status === 'DONE';

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {d.deliveryNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {d.customer}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {d.sourceWarehouse?.name} / {d.sourceLocation?.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {item?.product?.name} ({item?.product?.sku})
                        </div>
                        <span className="font-mono text-amber-800 font-bold text-[11px]">
                          -{item?.quantity} {item?.product?.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(d.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(d.status)} size="sm">
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold font-mono">
                            <Check className="w-3.5 h-3.5" /> Dispatched
                          </span>
                        ) : (
                          <button
                            onClick={() => handleValidateDelivery(d.id)}
                            disabled={validatingId === d.id}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                          >
                            {validatingId === d.id ? 'Dispatching...' : 'Validate & Dispatch'}
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

      {/* New Delivery Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Outbound Delivery"
        subtitle="Reserve stock from source bin and prepare customer dispatch order"
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Client Name</label>
            <input
              type="text"
              placeholder="e.g. Apex Infrastructure Ltd"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Warehouse</label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Storage Bin / Rack</label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Quantity</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Order Notes / Project Ref</label>
            <input
              type="text"
              placeholder="e.g. Order #1042 - Site Job 7 urgent delivery"
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              {submitting ? 'Creating...' : 'Create Delivery Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
