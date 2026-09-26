import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Search,
  Building2,
  Calendar,
  ShieldCheck,
  Scale,
  Sparkles,
  Info,
} from 'lucide-react';
import api from '../../services/api';
import { PhysicalCount } from '../../types';

interface PhysicalCountsProps {
  onOpenCountModal: () => void;
  navigate: (path: string) => void;
}

export const PhysicalCounts: React.FC<PhysicalCountsProps> = ({ onOpenCountModal, navigate }) => {
  const [counts, setCounts] = useState<PhysicalCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DISCREPANCY' | 'MATCH' | 'RECONCILED'>('ALL');

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/physical-counts');
      setCounts(res.data);
    } catch (err) {
      console.error('Failed to load physical counts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  // Filtered counts
  const filteredCounts = counts.filter((c) => {
    const matchesSearch =
      c.countNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.product?.sku.toLowerCase().includes(search.toLowerCase()) ||
      c.warehouse?.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.name.toLowerCase().includes(search.toLowerCase());

    const hasDiscrepancy = c.variance !== 0;
    const isReconciled = c.status === 'RECONCILED';
    const isMatch = c.variance === 0;

    let matchesFilter = true;
    if (statusFilter === 'DISCREPANCY') matchesFilter = hasDiscrepancy && !isReconciled;
    else if (statusFilter === 'MATCH') matchesFilter = isMatch;
    else if (statusFilter === 'RECONCILED') matchesFilter = isReconciled;

    return matchesSearch && matchesFilter;
  });

  const totalCounts = counts.length;
  const matchCounts = counts.filter((c) => c.variance === 0).length;
  const discrepancyCounts = counts.filter((c) => c.variance !== 0 && c.status !== 'RECONCILED').length;
  const reconciledCounts = counts.filter((c) => c.status === 'RECONCILED').length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Physical Counts & Verification</h1>
              <p className="text-xs text-slate-500">
                Non-destructive audit counts evaluated by the tolerance engine. Variances trigger discrepancy exceptions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCounts}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh counts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={onOpenCountModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Physical Count</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Audits Recorded</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalCounts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total physical verifications</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Perfect Matches</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{matchCounts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Physical qty equals system ledger</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-pink-600">Active Discrepancies</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-pink-600 mt-2">{discrepancyCounts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Triggered investigation workflows</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Reconciled Audits</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">{reconciledCounts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Resolved with root cause evidence</div>
        </div>
      </div>

      {/* Non-Destructive Invariant Guarantee Banner */}
      <div className="glass-card p-4 border-l-4 border-l-purple-600 flex items-start gap-3 bg-purple-50/40">
        <Scale className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-purple-900 font-bold block mb-0.5">StockSense Reality Core Rule:</strong>
          Physical count audits <strong>never silently overwrite system balances</strong>. If a count is outside the automated tolerance threshold (e.g. 1% to 2% tiered tolerance), a formal discrepancy exception is raised, assigned for investigation, and requires root cause resolution before any ledger reconciliation occurs.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by count number, SKU, warehouse, or bin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'DISCREPANCY', 'MATCH', 'RECONCILED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-white/60 text-slate-600 hover:bg-purple-50 border border-purple-100/60'
              }`}
            >
              {st === 'ALL'
                ? 'All Audits'
                : st === 'DISCREPANCY'
                ? 'Discrepancies'
                : st === 'MATCH'
                ? 'Exact Matches'
                : 'Reconciled'}
            </button>
          ))}
        </div>
      </div>

      {/* Counts Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Count Number</th>
                <th className="py-3.5 px-4 font-semibold">Product Name & SKU</th>
                <th className="py-3.5 px-4 font-semibold">Facility & Storage Rack</th>
                <th className="py-3.5 px-4 font-semibold text-right">System Recorded</th>
                <th className="py-3.5 px-4 font-semibold text-right">Physical Count</th>
                <th className="py-3.5 px-4 font-semibold text-right">Variance Units</th>
                <th className="py-3.5 px-4 font-semibold text-right">Variance %</th>
                <th className="py-3.5 px-4 font-semibold">Audited At</th>
                <th className="py-3.5 px-4 font-semibold text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading count audits...
                  </td>
                </tr>
              ) : filteredCounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No physical count records match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCounts.map((c) => {
                  const hasDiscrepancy = c.variance !== 0;

                  return (
                    <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-purple-900 bg-purple-50/80 px-2 py-0.5 rounded-md border border-purple-100">
                          {c.countNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{c.product?.name}</div>
                        <span className="font-mono text-slate-400 text-[11px]">SKU: {c.product?.sku}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{c.warehouse?.name}</div>
                        <div className="text-[11px] text-slate-400">{c.location?.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {c.systemQuantity} {c.product?.uom || 'units'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {c.physicalQuantity} {c.product?.uom || 'units'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            c.variance === 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {c.variance > 0 ? `+${c.variance}` : c.variance}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={`text-xs ${
                            c.variance === 0
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {c.variancePercentage > 0 ? `+${c.variancePercentage.toFixed(1)}` : c.variancePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(c.countedAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.status === 'RECONCILED' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reconciled
                          </span>
                        ) : hasDiscrepancy ? (
                          <button
                            onClick={() => navigate('/exceptions')}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors shadow-2xs group"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Exception Active</span>
                            <ArrowRight className="w-3 h-3 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Verified Match
                          </span>
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
    </div>
  );
};
export default PhysicalCounts;
