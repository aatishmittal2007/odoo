import React, { useEffect, useState } from 'react';
import {
  ArrowUpFromLine,
  Plus,
  Check,
  Clock,
  RefreshCw,
  AlertCircle,
  Truck,
  Building2,
  Boxes,
  Search,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DONE' | 'READY' | 'DRAFT'>('ALL');

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
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create delivery');
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

  // Filtered Deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.deliveryNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.customer.toLowerCase().includes(search.toLowerCase()) ||
      d.items.some((it) => it.product?.name.toLowerCase().includes(search.toLowerCase()) || it.product?.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDeliveries = deliveries.length;
  const completedDeliveries = deliveries.filter((d) => d.status === 'DONE').length;
  const pendingDeliveries = deliveries.filter((d) => d.status !== 'DONE' && d.status !== 'CANCELLED').length;
  const totalDeliveredUnits = deliveries.reduce((sum, d) => {
    return sum + (d.items || []).reduce((itemSum, item) => itemSum + (item.deliveredQuantity || (d.status === 'DONE' ? item.quantity : 0)), 0);
  }, 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-sm shadow-amber-600/10">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Outbound Deliveries</h1>
              <p className="text-xs text-slate-500">
                Customer dispatches, order picking, and stock decrements with transaction safety.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDeliveries}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh deliveries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Delivery Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalDeliveries}</div>
          <div className="text-[11px] text-slate-400 mt-1">Outbound deliveries created</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Pending Dispatch</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{pendingDeliveries}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting fulfillment / pick</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Dispatched & Debited</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{completedDeliveries}</div>
          <div className="text-[11px] text-slate-400 mt-1">Stock actively deducted</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Total Units Dispatched</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
            -{totalDeliveredUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Units shipped out to customers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by delivery order, customer, or SKU..."
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

      {/* Deliveries Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Delivery Number</th>
                <th className="py-3.5 px-4 font-semibold">Customer / Destination</th>
                <th className="py-3.5 px-4 font-semibold">Source Facility & Bin</th>
                <th className="py-3.5 px-4 font-semibold">Item & Dispatch Quantity</th>
                <th className="py-3.5 px-4 font-semibold">Order Date</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading deliveries data...
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No outbound deliveries match the criteria.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((d) => {
                  const item = d.items[0];
                  const isDone = d.status === 'DONE';

                  return (
                    <tr key={d.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-purple-900 bg-purple-50/80 px-2 py-0.5 rounded-md border border-purple-100">
                          {d.deliveryNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700">
                            {d.customer.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{d.customer}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{d.sourceWarehouse?.name}</div>
                        <div className="text-[11px] text-slate-400">{d.sourceLocation?.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {item?.product?.name || 'Multiple items'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-amber-700 font-bold text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                            -{item?.quantity} {item?.product?.uom || 'units'}
                          </span>
                          {item?.product?.sku && (
                            <span className="text-[10px] font-mono text-slate-400">SKU: {item?.product?.sku}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(d.date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getStatusBadgeVariant(d.status)} size="sm">
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold font-mono bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            <Check className="w-3.5 h-3.5" /> Dispatched
                          </span>
                        ) : (
                          <button
                            onClick={() => handleValidateDelivery(d.id)}
                            disabled={validatingId === d.id}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-amber-600/20"
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
        title="Create Outbound Delivery"
        subtitle="Schedule customer delivery and reserve stock from source warehouse"
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Client Name</label>
            <input
              type="text"
              placeholder="e.g. Apex Manufacturing Corp"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
            />
          </div>

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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pick Location / Rack</label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Pick</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Order Notes / Waybill</label>
            <textarea
              rows={2}
              placeholder="e.g. Expedited courier service, gate 4 delivery"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Stock Invariant:</strong> Dispatching an order will verify available stock in the selected bin. If quantity is insufficient, the system will prevent execution and protect inventory integrity.
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
              {submitting ? 'Creating...' : 'Register Delivery Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Deliveries;
