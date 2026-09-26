import React, { useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Check,
  Clock,
  RefreshCw,
  Building2,
  Boxes,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DONE' | 'READY' | 'DRAFT'>('ALL');

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
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create transfer');
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

  // Filtered transfers
  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.transferNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.sourceWarehouse?.name.toLowerCase().includes(search.toLowerCase()) ||
      t.destWarehouse?.name.toLowerCase().includes(search.toLowerCase()) ||
      t.items.some((it) => it.product?.name.toLowerCase().includes(search.toLowerCase()) || it.product?.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTransfers = transfers.length;
  const completedTransfers = transfers.filter((t) => t.status === 'DONE').length;
  const inTransitTransfers = transfers.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED').length;
  const totalMovedUnits = transfers.reduce((sum, t) => {
    return sum + (t.items || []).reduce((itemSum, item) => itemSum + (t.status === 'DONE' ? item.quantity : 0), 0);
  }, 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 shadow-sm shadow-indigo-600/10">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internal Transfers</h1>
              <p className="text-xs text-slate-500">
                Facility relocations, bin rebalancing, and atomic inventory movements with zero total balance change.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTransfers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh transfers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Internal Transfer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Transfers</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalTransfers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Inter-bin and facility transfers</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600">In Progress / Ready</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-600 mt-2">{inTransitTransfers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled for physical movement</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Completed & Settled</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{completedTransfers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Both source & dest updated</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Total Relocated Units</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
            {totalMovedUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Units reallocated (net 0 Δ)</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by transfer number, facility, or SKU..."
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
              {st === 'ALL' ? 'All Transfers' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Transfers Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Transfer Number</th>
                <th className="py-3.5 px-4 font-semibold">Origin Facility & Bin</th>
                <th className="py-3.5 px-4 font-semibold text-center">Route</th>
                <th className="py-3.5 px-4 font-semibold">Destination Facility & Bin</th>
                <th className="py-3.5 px-4 font-semibold">Product & Movement</th>
                <th className="py-3.5 px-4 font-semibold">Scheduled Date</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading transfers data...
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No internal transfers match the criteria.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => {
                  const item = t.items[0];
                  const isDone = t.status === 'DONE';

                  return (
                    <tr key={t.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-purple-900 bg-purple-50/80 px-2 py-0.5 rounded-md border border-purple-100">
                          {t.transferNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{t.sourceWarehouse?.name}</div>
                        <div className="text-[11px] text-slate-400">{t.sourceLocation?.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{t.destWarehouse?.name}</div>
                        <div className="text-[11px] text-slate-400">{t.destLocation?.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {item?.product?.name || 'Multiple items'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-indigo-700 font-bold text-[11px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                            {item?.quantity} {item?.product?.uom || 'units'}
                          </span>
                          {item?.product?.sku && (
                            <span className="text-[10px] font-mono text-slate-400">SKU: {item?.product?.sku}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(t.scheduledDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getStatusBadgeVariant(t.status)} size="sm">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold font-mono bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCompleteTransfer(t.id)}
                            disabled={completingId === t.id}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-indigo-600/20"
                          >
                            {completingId === t.id ? 'Transferring...' : 'Complete Transfer'}
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
        title="Schedule Internal Transfer"
        subtitle="Transfer inventory between storage bins or warehouse facilities"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Warehouse</label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Storage Bin</label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Warehouse</label>
              <select
                value={destWarehouseId}
                onChange={(e) => setDestWarehouseId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Storage Bin</label>
              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Quantity</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Transfer Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Pallet relocation for picking efficiency"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/60 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              <strong>Atomic Invariant:</strong> Completion executes a dual-ledger update in a single transaction: Source bin is debited and Destination bin is credited simultaneously. Overall company stock remains unchanged.
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
              {submitting ? 'Creating...' : 'Schedule Transfer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Transfers;
