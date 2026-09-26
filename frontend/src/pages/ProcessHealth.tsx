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

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const { totalResolved, rootCauseBreakdown, keyMetrics, severityDistribution } = healthData || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Process Health & Root Cause Analytics
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Aggregated analytics computed dynamically from all stored, human-verified incident resolutions. No hardcoded statistics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Resolved Incidents
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {totalResolved || 0}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Audited & classified
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Resolution Rate
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-600 mt-1 block">
            {keyMetrics?.resolutionRate || 0}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Lifetime incident closure
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Mean Time To Resolve (MTTR)
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {keyMetrics?.avgResolutionTimeHours || 0} hrs
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Average turnaround
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Primary Vulnerability
          </span>
          <span className="text-xl font-bold text-amber-700 mt-1 block truncate">
            {rootCauseBreakdown?.[0]?.rootCause || 'None'}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {rootCauseBreakdown?.[0]?.percentage || 0}% of all discrepancies
          </span>
        </div>
      </div>

      {/* Main Charts: Root Cause Breakdown & Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie & Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Root Cause Distribution (Actual Resolved Incidents)
            </h2>
            <span className="text-xs text-slate-400">Click a category below to drill down</span>
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
                    formatter={(value: any, name: any, item: any) => [
                      `${value} incidents (${item.payload.percentage}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Clickable Category List with exact % */}
            <div className="space-y-2">
              {rootCauseBreakdown?.map((rc: any, index: number) => {
                const isSelected = selectedRootCause === rc.rootCause;

                return (
                  <button
                    key={rc.rootCause}
                    onClick={() => handleSelectRootCause(rc.rootCause)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-semibold">{rc.rootCause}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span>{rc.count} incidents</span>
                      <span className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-900'}`}>
                        {rc.percentage}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Severity of Resolved Incidents (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Resolved by Severity
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityDistribution}>
                <XAxis dataKey="severity" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 20: PROCESS DRILL-DOWN PANEL */}
      {selectedRootCause && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Process Drill-Down: {selectedRootCause}
                </h3>
                <p className="text-xs text-slate-500">
                  Analyzing root patterns, failure pathways, and repeated location bottlenecks.
                </p>
              </div>
            </div>

            <Badge variant="high" size="lg">
              {drilldownData?.totalIncidents || 0} Total Incidents
            </Badge>
          </div>

          {loadingDrilldown ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading root cause drill-down...</div>
          ) : drilldownData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Most Common Problematic Route */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Most Common Failure Pathway / Route
                </span>
                {drilldownData.mostCommonRoutes?.length > 0 ? (
                  drilldownData.mostCommonRoutes.map((route: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {route.route}
                        </span>
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono">
                          {route.ratePercentage}% of failures
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Primary Issue: <strong>{route.primaryIssue}</strong>
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No recurring inter-facility routes recorded for this root cause.
                  </div>
                )}
              </div>

              {/* Affected Locations & Warehouses */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Affected Storage Locations
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {drilldownData.affectedLocations?.map((loc: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{loc.name}</span>
                        <span className="text-slate-400 text-[11px]">({loc.warehouseName})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{loc.count} incidents</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Affected Products */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Most Impacted Products
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {drilldownData.affectedProducts?.map((prod: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-slate-800">{prod.name}</span>
                        <span className="font-mono text-slate-400 text-[11px]">({prod.sku})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">{prod.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
