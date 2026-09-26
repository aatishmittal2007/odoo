import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  User as UserIcon,
  ShieldCheck,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { ExceptionItem } from '../types';
import { Badge, getSeverityBadgeVariant } from '../components/common/Badge';

interface ResolutionsProps {
  navigate: (path: string) => void;
}

export const Resolutions: React.FC<ResolutionsProps> = ({ navigate }) => {
  const [resolvedExceptions, setResolvedExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rootCauseFilter, setRootCauseFilter] = useState('ALL');

  const fetchResolutions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exceptions');
      const resolved = (res.data as ExceptionItem[]).filter(
        (ex) => ex.status === 'RESOLVED' || ex.status === 'CLOSED'
      );
      setResolvedExceptions(resolved);
    } catch (err) {
      console.error('Failed to load resolutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolutions();
  }, []);

  const rootCauses = Array.from(
    new Set(
      resolvedExceptions
        .map((ex) => ex.resolution?.rootCause)
        .filter((rc): rc is string => Boolean(rc))
    )
  );

  const filtered = resolvedExceptions.filter((ex) => {
    const matchesSearch =
      ex.exceptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      ex.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.product?.sku.toLowerCase().includes(search.toLowerCase()) ||
      (ex.resolution?.explanation || '').toLowerCase().includes(search.toLowerCase()) ||
      (ex.resolution?.rootCause || '').toLowerCase().includes(search.toLowerCase());

    const matchesCause =
      rootCauseFilter === 'ALL' || ex.resolution?.rootCause === rootCauseFilter;

    return matchesSearch && matchesCause;
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm shadow-emerald-600/10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resolved Incident Log</h1>
              <p className="text-xs text-slate-500">
                Audited repository of completed investigations, verified root causes, and corrective actions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchResolutions}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh resolutions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Resolutions</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {resolvedExceptions.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Discrepancies reconciled & closed</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Root Causes Classified</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">{rootCauses.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Vulnerability types addressed</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Audit Status</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 mt-2">100% Traceable</div>
          <div className="text-[11px] text-slate-400 mt-1">Logged with double-sided ledger proof</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident #, explanation, SKU, or root cause..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        {rootCauses.length > 0 && (
          <select
            value={rootCauseFilter}
            onChange={(e) => setRootCauseFilter(e.target.value)}
            className="px-3 py-2 bg-white/80 border border-purple-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">All Root Causes</option>
            {rootCauses.map((rc) => (
              <option key={rc} value={rc}>
                {rc.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Resolutions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-12 text-center text-slate-400 font-medium">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
            Loading resolved incident records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-400">
            No resolved incidents match the criteria.
          </div>
        ) : (
          filtered.map((ex) => (
            <div
              key={ex.id}
              onClick={() => navigate(`/exceptions/${ex.id}`)}
              className="glass-card p-5 hover:border-purple-300 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={getSeverityBadgeVariant(ex.severity)} size="sm">
                    {ex.severity}
                  </Badge>
                  <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                    {ex.exceptionNumber}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    RESOLVED
                  </span>
                  <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 font-mono">
                    {ex.resolution?.rootCause?.replace(/_/g, ' ') || 'Resolved'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {ex.resolvedAt
                      ? new Date(ex.resolvedAt).toLocaleDateString()
                      : new Date(ex.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-purple-100/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Investigation Finding</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {ex.resolution?.explanation || 'Investigated and reconciled.'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Corrective Action Taken</span>
                  <p className="text-purple-900 font-medium mt-0.5">
                    {ex.resolution?.correctiveAction || 'Physical bin adjusted to restore ledger parity.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Target: <strong>{ex.product?.name}</strong> ({ex.product?.sku})</span>
                <div className="flex items-center gap-1 text-purple-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>View Case Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default Resolutions;
