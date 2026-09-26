import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Warehouse,
  MapPin,
  Package,
  Layers,
  RefreshCw,
  Sparkles,
  PieChart as PieIcon,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { Badge } from '../components/common/Badge';

export const ProcessHealth: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [selectedRootCause, setSelectedRootCause] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/process-health');
      setHealthData(res.data);
      if (res.data.rootCauseBreakdown?.length > 0 && !selectedRootCause) {
        handleSelectRootCause(res.data.rootCauseBreakdown[0].rootCause);
      }
    } catch (err) {
      console.error('Failed to load Process Health:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRootCause = async (cause: string) => {
    setSelectedRootCause(cause);
    try {
      setLoadingDrilldown(true);
      const res = await api.get(`/dashboard/drilldown/${encodeURIComponent(cause)}`);
      setDrilldownData(res.data);
    } catch (err) {
      console.error('Failed to load drilldown:', err);
    } finally {
      setLoadingDrilldown(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const COLORS = ['#7c3aed', '#ec4899', '#a855f7', '#6366f1', '#06b6d4', '#f59e0b', '#10b981'];

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const { totalResolved, rootCauseBreakdown, keyMetrics, severityDistribution } = healthData || {};

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Process Health & Root Cause Analytics</h1>
              <p className="text-xs text-slate-500">
                Deterministic Pareto insights computed dynamically from verified incident resolution records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resolved Incidents</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalResolved || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Audited with verified root cause</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Resolution Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">
            {keyMetrics?.resolutionRate || 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total lifetime incident closure</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">MTTR Turnaround</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
            {keyMetrics?.avgResolutionTimeHours || 0} hrs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Mean Time to Resolve</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Leading Discrepancy Cause</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 mt-2 truncate">
            {rootCauseBreakdown?.[0]?.rootCause?.replace(/_/g, ' ') || 'None'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {rootCauseBreakdown?.[0]?.percentage || 0}% of all discrepancies
          </div>
        </div>
      </div>

      {/* Main Charts: Root Cause Breakdown & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie & Bar Chart (2 cols) */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Root Cause Distribution (Pareto Analysis)
              </h2>
            </div>
            <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
              Interactive Filter
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rootCauseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="rootCause"
                  >
                    {rootCauseBreakdown?.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} incidents`,
                      name?.replace(/_/g, ' '),
                    ]}
                    contentStyle={{
                      backgroundColor: '#090713',
                      borderColor: '#4c1d95',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Root Cause Chips / Selection List */}
            <div className="space-y-2 overflow-y-auto max-h-64 pr-2">
              {rootCauseBreakdown?.map((item: any, idx: number) => {
                const isSelected = selectedRootCause === item.rootCause;
                const color = COLORS[idx % COLORS.length];

                return (
                  <div
                    key={item.rootCause}
                    onClick={() => handleSelectRootCause(item.rootCause)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-100/60 border-purple-400/80 shadow-2xs'
                        : 'bg-white/60 border-purple-100/70 hover:bg-purple-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {item.rootCause.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.count} incidents • {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-700' : 'text-slate-300'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Severity Breakdown Bar */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Severity Distribution
            </h2>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityDistribution || []}>
                <XAxis dataKey="severity" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090713',
                    borderColor: '#4c1d95',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Root Cause Drilldown Details */}
      {selectedRootCause && drilldownData && (
        <div className="glass-card p-6 space-y-4 border-l-4 border-l-purple-600">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  Root Cause Investigation Drilldown
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedRootCause.replace(/_/g, ' ')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Historical incidents, affected products, and verified corrective actions.
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold border border-purple-200">
                {drilldownData.totalIncidents || 0} Incidents
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                Avg Resolution: {drilldownData.avgResolutionHours || 0} hrs
              </span>
            </div>
          </div>

          {/* Incidents Table / Cards */}
          <div className="space-y-2 pt-2">
            {drilldownData.incidents?.map((inc: any) => (
              <div
                key={inc.id}
                className="p-3 bg-white border border-purple-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={inc.severity === 'CRITICAL' ? 'critical' : 'high'} size="sm">
                    {inc.severity}
                  </Badge>
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {inc.exceptionNumber}
                    </span>
                    <span className="text-xs text-slate-600 ml-2 font-medium">
                      {inc.product?.name} ({inc.product?.sku})
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Warehouse: {inc.warehouse?.name} / {inc.location?.name}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 max-w-md">
                  <div className="font-medium text-slate-800 italic">"{inc.resolution?.explanation}"</div>
                  {inc.resolution?.correctiveAction && (
                    <div className="text-[11px] text-purple-700 mt-0.5">
                      Action: <strong>{inc.resolution.correctiveAction}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ProcessHealth;
