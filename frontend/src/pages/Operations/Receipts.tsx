import React, { useEffect, useState } from 'react';
import { ArrowDownToLine, Plus, CheckCircle, Clock, Check, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Receipt, Warehouse, Location, Product } from '../../types';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const [recRes, whRes, prodRes] = await Promise.all([
        api.get('/inventory/receipts'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);
      setReceipts(recRes.data);
      setWarehouses(whRes.data);
      setProducts(prodRes.data);

      if (whRes.data[0] && !destinationWarehouseId) setDestinationWarehouseId(whRes.data[0].id);
      if (prodRes.data[0] && !productId) setProductId(prodRes.data[0].id);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  useEffect(() => {
    if (!destinationWarehouseId) return;
    api.get(`/warehouses/locations?warehouseId=${destinationWarehouseId}`).then((res) => {
      setLocations(res.data);
      if (res.data[0]) setDestinationLocationId(res.data[0].id);
    });
  }, [destinationWarehouseId]);

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !destinationWarehouseId || !destinationLocationId || !productId) return;
    setSubmitting(true);
    try {
      await api.post('/inventory/receipts', {
        supplier,
        destinationWarehouseId,
        destinationLocationId,
        notes,
        items: [{ productId, quantity: parseFloat(quantity) || 1 }],
      });
      setIsModalOpen(false);
      setSupplier('');
      setNotes('');
      fetchReceipts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateReceipt = async (id: string) => {
    setValidatingId(id);
    try {
      await api.post(`/inventory/receipts/${id}/validate`);
      await fetchReceipts();
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
            <ArrowDownToLine className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inbound Receipts & Vendor Intake
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 5 — Receipts workflow. Validating increases location stock and generates double-sided ledger entries.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Inbound Receipt</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Vendor / Supplier</th>
                <th className="py-3 px-4">Destination Storage Bin</th>
                <th className="py-3 px-4">Item & Intake Quantity</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Validation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading receipts...
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No inbound receipts registered.
                  </td>
                </tr>
              ) : (
                receipts.map((r) => {
                  const item = r.items[0];
                  const isDone = r.status === 'DONE';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {r.receiptNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {r.supplier}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.destinationWarehouse?.name} / {r.destinationLocation?.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {item?.product?.name} ({item?.product?.sku})
                        </div>
                        <span className="font-mono text-emerald-700 font-bold text-[11px]">
                          +{item?.quantity} {item?.product?.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold font-mono">
                            <Check className="w-3.5 h-3.5" /> Stock Credited
                          </span>
                        ) : (
                          <button
                            onClick={() => handleValidateReceipt(r.id)}
                            disabled={validatingId === r.id}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                          >
                            {validatingId === r.id ? 'Crediting...' : 'Validate Receipt'}
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

      {/* New Receipt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Inbound Receipt"
        subtitle="Schedule incoming vendor shipment with target warehouse and storage location"
      >
        <form onSubmit={handleCreateReceipt} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Supplier Name</label>
            <input
              type="text"
              placeholder="e.g. Acero Steelworks Ltd"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Warehouse</label>
              <select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Storage Bin / Rack</label>
              <select
                value={destinationLocationId}
                onChange={(e) => setDestinationLocationId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Quantity</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / PO Reference</label>
            <input
              type="text"
              placeholder="e.g. PO #8491 - Mill certified batch intake"
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              {submitting ? 'Creating...' : 'Create Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
