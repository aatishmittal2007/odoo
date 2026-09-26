import React, { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  Plus,
  CheckCircle2,
  Clock,
  Check,
  RefreshCw,
  Truck,
  Building2,
  Boxes,
  Search,
  Filter,
  Calendar,
  AlertCircle,
} from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DONE' | 'READY' | 'DRAFT'>('ALL');

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
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create receipt');
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

  // Filtered Receipts
  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier.toLowerCase().includes(search.toLowerCase()) ||
      r.items.some((it) => it.product?.name.toLowerCase().includes(search.toLowerCase()) || it.product?.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalReceipts = receipts.length;
  const completedReceipts = receipts.filter((r) => r.status === 'DONE').length;
  const pendingReceipts = receipts.filter((r) => r.status !== 'DONE' && r.status !== 'CANCELLED').length;
  const totalReceivedUnits = receipts.reduce((sum, r) => {
    return sum + (r.items || []).reduce((itemSum, item) => itemSum + (item.receivedQuantity || (r.status === 'DONE' ? item.quantity : 0)), 0);
  }, 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inbound Receipts</h1>
              <p className="text-xs text-slate-500">
                Track supplier intake, schedule shipments, and post verified quantities to the double-sided ledger.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReceipts}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh receipts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Inbound Receipt</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Trio */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Inbound</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalReceipts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Vendor shipments recorded</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Pending Intake</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{pendingReceipts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting verification</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Completed & Credited</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{completedReceipts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Stock actively updated</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Total Units Credited</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
            +{totalReceivedUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Units added into warehouse bins</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receipt number, supplier, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'READY', 'DONE', 'DRAFT'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-white/60 text-slate-600 hover:bg-purple-50 border border-purple-100/60'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Receipt Number</th>
                <th className="py-3.5 px-4 font-semibold">Vendor / Supplier</th>
                <th className="py-3.5 px-4 font-semibold">Target Bin</th>
                <th className="py-3.5 px-4 font-semibold">Intake Items & Quantity</th>
                <th className="py-3.5 px-4 font-semibold">Scheduled Date</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Validation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading receipts data...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No inbound receipts match the criteria.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const item = r.items[0];
                  const isDone = r.status === 'DONE';

                  return (
                    <tr key={r.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-purple-900 bg-purple-50/80 px-2 py-0.5 rounded-md border border-purple-100">
                          {r.receiptNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700">
                            {r.supplier.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{r.supplier}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{r.destinationWarehouse?.name}</div>
                        <div className="text-[11px] text-slate-400">{r.destinationLocation?.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {item?.product?.name || 'Multiple items'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-emerald-700 font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            +{item?.quantity} {item?.product?.uom || 'units'}
                          </span>
                          {item?.product?.sku && (
                            <span className="text-[10px] font-mono text-slate-400">SKU: {item?.product?.sku}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(r.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold font-mono bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> Stock Credited
                          </span>
                        ) : (
                          <button
                            onClick={() => handleValidateReceipt(r.id)}
                            disabled={validatingId === r.id}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
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
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Warehouse</label>
              <select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Rack / Bin</label>
              <select
                value={destinationLocationId}
                onChange={(e) => setDestinationLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product SKU / Name</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Intake Quantity</label>
              <input
                type="number"
                min="1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Notes / Bill of Lading</label>
            <textarea
              rows={2}
              placeholder="e.g. Po #8491, Pallet #3 inspected at dock"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-purple-900 leading-relaxed">
              <strong>StockSense Reality Guarantee:</strong> Creating an inbound receipt registers the expected intake. Stock balances will only be credited once physically validated.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Creating...' : 'Register Inbound Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Receipts;
