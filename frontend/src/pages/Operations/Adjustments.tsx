import React, { useEffect, useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  Building2,
  Calendar,
  User as UserIcon,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import { Adjustment, Warehouse, Location, Product } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

export const Adjustments: React.FC = () => {
  const { user } = useAuth();
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'WRITE_OFF' | 'SURPLUS'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'DECREMENT' | 'INCREMENT'>('DECREMENT');
  const [quantityMagnitude, setQuantityMagnitude] = useState('3');
  const [reason, setReason] = useState('Damaged stock during handling');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setErrorMsg(null);
    try {
      const mag = parseFloat(quantityMagnitude) || 0;
      const signedQty = adjustmentType === 'DECREMENT' ? -Math.abs(mag) : Math.abs(mag);

      await api.post('/inventory/adjustments', {
        warehouseId,
        locationId,
        productId,
        quantityChange: signedQty,
        reason,
      });
      setIsModalOpen(false);
      setQuantityMagnitude('3');
      fetchAdjustments();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to submit adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered adjustments
  const filteredAdjustments = adjustments.filter((a) => {
    const matchesSearch =
      a.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      a.product?.sku.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase()) ||
      a.warehouse?.name.toLowerCase().includes(search.toLowerCase());

    const isWriteOff = a.quantityChange < 0;
    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'WRITE_OFF' && isWriteOff) ||
      (typeFilter === 'SURPLUS' && !isWriteOff);

    return matchesSearch && matchesType;
  });

  const totalAdjustments = adjustments.length;
  const writeOffsCount = adjustments.filter((a) => a.quantityChange < 0).length;
  const surplusCount = adjustments.filter((a) => a.quantityChange > 0).length;
  const totalNetDelta = adjustments.reduce((sum, a) => sum + a.quantityChange, 0);

  const quickReasons = [
    'Damaged stock during handling',
    'Scrap / expired shelf-life',
    'Found unrecorded items during cycle count',
    'Supplier shipping discrepancy write-off',
    'Sample extraction for quality assurance',
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shadow-sm shadow-rose-600/10">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Adjustments</h1>
              <p className="text-xs text-slate-500">
                Audited manual corrections and write-offs. High adjustments automatically trigger discrepancy exceptions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAdjustments}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh adjustments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setErrorMsg(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Adjustments</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalAdjustments}</div>
          <div className="text-[11px] text-slate-400 mt-1">Manual ledger corrections logged</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Write-Offs (Negative)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-2">{writeOffsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Damaged / lost inventory debited</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Surplus Additions (Positive)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{surplusCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Recovered / found stock credited</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Net Inventory Delta</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${totalNetDelta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {totalNetDelta > 0 ? `+${totalNetDelta}` : totalNetDelta}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cumulative units across corrections</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product, SKU, facility, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'WRITE_OFF', 'SURPLUS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === t
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-white/60 text-slate-600 hover:bg-purple-50 border border-purple-100/60'
              }`}
            >
              {t === 'ALL' ? 'All Corrections' : t === 'WRITE_OFF' ? 'Write-Offs Only (-)' : 'Surplus Only (+)'}
            </button>
          ))}
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Adjustment ID</th>
                <th className="py-3.5 px-4 font-semibold">Product Name & SKU</th>
                <th className="py-3.5 px-4 font-semibold">Facility & Storage Bin</th>
                <th className="py-3.5 px-4 font-semibold text-right">Quantity Delta</th>
                <th className="py-3.5 px-4 font-semibold">Mandatory Business Reason</th>
                <th className="py-3.5 px-4 font-semibold">Adjusted By</th>
                <th className="py-3.5 px-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading adjustments data...
                  </td>
                </tr>
              ) : filteredAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No stock adjustments match the criteria.
                  </td>
                </tr>
              ) : (
                filteredAdjustments.map((a) => {
                  const isNegative = a.quantityChange < 0;
                  const isLarge = Math.abs(a.quantityChange) >= 10;

                  return (
                    <tr key={a.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-500 bg-purple-50/60 px-2 py-0.5 rounded text-[11px]">
                          {a.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{a.product?.name}</div>
                        <span className="text-[11px] font-mono text-slate-400">SKU: {a.product?.sku}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{a.warehouse?.name}</div>
                        <div className="text-[11px] text-slate-400">{a.location?.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                            isNegative
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isNegative ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {a.quantityChange > 0 ? `+${a.quantityChange}` : a.quantityChange} {a.product?.uom || 'units'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-800 font-medium">{a.reason}</span>
                          {isLarge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title="High-magnitude adjustment">
                              High Impact
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{a.user?.name || 'Inventory Manager'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Adjustment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Stock Adjustment / Write-Off"
        subtitle="Manually correct ledger quantities with verified business justification"
      >
        <form onSubmit={handleCreateAdjustment} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Warehouse</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Storage Bin</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('DECREMENT')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    adjustmentType === 'DECREMENT'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Write-Off (-)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('INCREMENT')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    adjustmentType === 'INCREMENT'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Surplus Found (+)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Magnitude</label>
            <input
              type="number"
              min="0.01"
              step="any"
              value={quantityMagnitude}
              onChange={(e) => setQuantityMagnitude(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mandatory Business Justification</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this inventory write-off or addition is required..."
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              required
            />
            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickReasons.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-900 leading-relaxed">
              <strong>Manager Authorization Required:</strong> All manual adjustments create permanent double-sided ledger entries under your credentials (<code>{user?.email}</code>). High variances generate automatic audit exceptions.
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
              {submitting ? 'Applying...' : 'Post Stock Adjustment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Adjustments;
