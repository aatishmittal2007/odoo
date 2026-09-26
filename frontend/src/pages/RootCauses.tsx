import React, { useEffect, useState } from 'react';
import {
  PieChart as PieIcon,
  Search,
  Filter,
  RefreshCw,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Badge } from '../components/common/Badge';

interface RootCausesProps {
  navigate: (path: string) => void;
}

export const RootCauses: React.FC<RootCausesProps> = ({ navigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/process-health');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load root cause analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rootCauses = data?.rootCauseBreakdown || [];

  const filtered = rootCauses.filter((rc: any) =>
    rc.rootCause.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Root Cause Repository</h1>
              <p className="text-xs text-slate-500">
                Pareto analysis of recurring operational vulnerabilities, supplier errors, and warehouse anomalies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh repository"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Identified Categories</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{rootCauses.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unique discrepancy sources</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Primary Vulnerability</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 mt-2 truncate">
            {rootCauses[0]?.rootCause?.replace(/_/g, ' ') || 'None'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {rootCauses[0]?.percentage || 0}% of all verified incidents
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Total Classified Cases</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">
            {data?.totalResolved || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Audited with verified corrective action</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search root cause category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>
      </div>

      {/* Root Causes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 glass-card p-12 text-center text-slate-400 font-medium">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
            Loading root causes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 glass-card p-12 text-center text-slate-400">
            No root cause classifications found.
          </div>
        ) : (
          filtered.map((rc: any) => (
            <div
              key={rc.rootCause}
              onClick={() => navigate('/process-health')}
              className="glass-card p-5 hover:border-purple-300 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                  {rc.rootCause.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                  {rc.percentage}% share
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-purple-100/60 pt-3">
                <span>{rc.count} confirmed incidents</span>
                <div className="flex items-center gap-1 text-purple-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Inspect Pareto Analysis</span>
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
export default RootCauses;
