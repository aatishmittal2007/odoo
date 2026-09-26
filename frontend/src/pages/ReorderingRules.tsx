import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Boxes,
  ArrowDownToLine,
  TrendingDown,
  CheckCircle2,
  Edit,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Product } from '../types';

interface ReorderingRulesProps {
  navigate: (path: string) => void;
}

export const ReorderingRules: React.FC<ReorderingRulesProps> = ({ navigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'TRIGGERED' | 'HEALTHY'>('ALL');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products for reordering rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    const isTriggered = (p.totalStock || 0) <= (p.reorderLevel || 0);
    const matchesMode =
      filterMode === 'ALL' ||
      (filterMode === 'TRIGGERED' && isTriggered) ||
      (filterMode === 'HEALTHY' && !isTriggered);

    return matchesSearch && matchesMode;
  });

  const totalProducts = products.length;
  const triggeredCount = products.filter((p) => (p.totalStock || 0) <= (p.reorderLevel || 0)).length;
  const healthyCount = totalProducts - triggeredCount;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Automated Reordering Rules</h1>
              <p className="text-xs text-slate-500">
                Minimum safety stock thresholds, replenishment batch quantities, and real-time trigger tracking.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh rules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Configured Rules</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalProducts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Catalog items with min-max rules</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Replenishment Triggered</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{triggeredCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Below safety stock threshold</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Healthy Buffer</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{healthyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sufficient operational buffer</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'TRIGGERED', 'HEALTHY'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === m
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-white/60 text-slate-600 hover:bg-purple-50 border border-purple-100/60'
              }`}
            >
              {m === 'ALL' ? 'All Rules' : m === 'TRIGGERED' ? 'Triggered (Needs Order)' : 'Healthy'}
            </button>
          ))}
        </div>
      </div>

      {/* Reordering Rules Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Product Name & SKU</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold text-right">Current On-Hand</th>
                <th className="py-3.5 px-4 font-semibold text-right">Min Safety Level</th>
                <th className="py-3.5 px-4 font-semibold text-right">Suggested Batch Qty</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading reordering parameters...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const stock = p.totalStock || 0;
                  const threshold = p.reorderLevel || 0;
                  const isCritical = stock <= 0;
                  const isTriggered = stock <= threshold;

                  return (
                    <tr key={p.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <span className="font-mono text-purple-900 bg-purple-50/80 px-1.5 py-0.2 rounded text-[10px] border border-purple-100/60 font-semibold">
                          {p.sku}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium text-[11px] border border-purple-100">
                          {p.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        <span
                          className={
                            isCritical
                              ? 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                              : isTriggered
                              ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'
                              : 'text-slate-900'
                          }
                        >
                          {stock} {p.uom}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500 font-semibold">
                        {threshold} {p.uom}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-700">
                        {p.reorderQuantity ?? 20} {p.uom}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Out of Stock
                          </span>
                        ) : isTriggered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Reorder Triggered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Adequate Buffer
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isTriggered && (
                            <button
                              onClick={() => navigate('/receipts')}
                              className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center gap-1"
                            >
                              <ArrowDownToLine className="w-3 h-3" />
                              <span>Order</span>
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Inspect product configuration"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
};
export default ReorderingRules;
