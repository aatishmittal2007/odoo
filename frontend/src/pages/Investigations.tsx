import React, { useEffect, useState } from 'react';
import {
  SearchCode,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User as UserIcon,
  Warehouse as WarehouseIcon,
  CheckSquare,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { ExceptionItem } from '../types';
import { Badge, getSeverityBadgeVariant, getStatusBadgeVariant } from '../components/common/Badge';

interface InvestigationsProps {
  navigate: (path: string) => void;
}

export const Investigations: React.FC<InvestigationsProps> = ({ navigate }) => {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exceptions');
      setExceptions(res.data);
    } catch (err) {
      console.error('Failed to load investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  // Filter for active investigations (NEW, INVESTIGATING, ACTION_REQUIRED)
  const activeInvestigations = exceptions.filter((ex) => ex.status !== 'RESOLVED' && ex.status !== 'CLOSED');

  const filtered = activeInvestigations.filter((ex) => {
    const matchesSearch =
      ex.exceptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      ex.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.product?.sku.toLowerCase().includes(search.toLowerCase()) ||
      ex.warehouse?.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.type.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || ex.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalCount = activeInvestigations.filter((ex) => ex.severity === 'CRITICAL').length;
  const highCount = activeInvestigations.filter((ex) => ex.severity === 'HIGH').length;
  const inProgressCount = activeInvestigations.filter((ex) => ex.status === 'INVESTIGATING').length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <SearchCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Investigations</h1>
              <p className="text-xs text-slate-500">
                Audited root cause workflows, evidence collection, and multi-step investigation checklists.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInvestigations}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh investigations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Casework</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <SearchCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{activeInvestigations.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Exceptions undergoing audit</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Critical Priority</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 mt-2">{criticalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires immediate triage</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">High Priority</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{highCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">High variance / orders impacted</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">In Investigation</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Assigned with active tasks</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident #, product, SKU, or facility..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                severityFilter === sev
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-white/60 text-slate-600 hover:bg-purple-50 border border-purple-100/60'
              }`}
            >
              {sev === 'ALL' ? 'All Severities' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Investigations List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-12 text-center text-slate-400 font-medium">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
            Loading active investigations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-400">
            No active investigations matching the selected criteria.
          </div>
        ) : (
          filtered.map((ex) => {
            const completedTasks = ex.tasks?.filter((t) => t.isCompleted).length || 0;
            const totalTasks = ex.tasks?.length || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={ex.id}
                onClick={() => navigate(`/exceptions/${ex.id}`)}
                className="glass-card p-5 hover:border-purple-300 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={getSeverityBadgeVariant(ex.severity)} size="sm">
                      {ex.severity}
                    </Badge>
                    <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors">
                      {ex.exceptionNumber}
                    </span>
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      {ex.type}
                    </span>
                    <Badge variant={getStatusBadgeVariant(ex.status)} size="sm">
                      {ex.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                    <span className="font-semibold text-slate-900">{ex.product?.name}</span>
                    <span className="font-mono text-purple-800 bg-purple-50/60 px-1.5 py-0.2 rounded border border-purple-100">
                      {ex.product?.sku}
                    </span>
                    <div className="flex items-center gap-1 text-slate-500">
                      <WarehouseIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ex.warehouse?.name} / {ex.location?.name}</span>
                    </div>
                    {ex.owner && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lead: {ex.owner.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-center">
                  {/* Task checklist progress */}
                  <div className="text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-1.5 text-xs text-slate-700 font-semibold mb-1">
                      <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>{completedTasks}/{totalTasks} Tasks Done</span>
                    </div>
                    <div className="w-28 h-1.5 bg-purple-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button className="p-2 text-slate-400 group-hover:text-purple-700 group-hover:bg-purple-50 rounded-xl transition-all">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default Investigations;
