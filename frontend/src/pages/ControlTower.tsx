import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Layers,
  AlertTriangle,
  ShieldAlert,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  TrendingDown,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  Package,
} from 'lucide-react';
import api from '../services/api';
import { ControlTowerData } from '../types';
import { Badge, getSeverityBadgeVariant, getStatusBadgeVariant } from '../components/common/Badge';
import { ConfidenceGauge } from '../components/common/ConfidenceGauge';

interface ControlTowerProps {
  navigate: (path: string) => void;
  onOpenCountModal: () => void;
}

export const ControlTower: React.FC<ControlTowerProps> = ({ navigate, onOpenCountModal }) => {
  const [data, setData] = useState<ControlTowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFacility, setActiveFacility] = useState<string>(
    localStorage.getItem('stocksense_active_warehouse') || 'ALL'
  );

  const fetchTowerData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/control-tower');
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Control Tower data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTowerData();

    // Listen to facility change events from top navbar
    const handleFacilityChange = (e: any) => {
      setActiveFacility(e.detail?.warehouseId || 'ALL');
      fetchTowerData();
    };
    window.addEventListener('stocksense:warehouse_changed', handleFacilityChange);
    return () => window.removeEventListener('stocksense:warehouse_changed', handleFacilityChange);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-purple-600">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Syncing Inventory Reality Engine...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-slate-600 max-w-md mx-auto mt-12 bg-white rounded-3xl border border-purple-100 shadow-card">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-900 mb-1">Unable to Load Control Tower</h3>
        <p className="text-xs text-rose-600 font-medium mb-4">{error || 'Network error encountered.'}</p>
        <button
          onClick={fetchTowerData}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, confidence, needsAttention, recentMovements } = data;

  const topCards = [
    { label: 'Total SKUs', value: metrics.totalProducts, icon: Boxes, color: 'text-purple-900', path: '/products', badge: 'Active' },
    { label: 'On-Hand Units', value: metrics.totalStock.toLocaleString(), icon: Layers, color: 'text-purple-700', path: '/stock' },
    { label: 'Low Stock Alerts', value: metrics.lowStockCount, icon: TrendingDown, color: metrics.lowStockCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-600', path: '/products?lowStock=true', alert: metrics.lowStockCount > 0 },
    { label: 'Open Exceptions', value: metrics.openExceptions, icon: ShieldAlert, color: metrics.openExceptions > 0 ? 'text-pink-600 font-bold' : 'text-slate-600', path: '/exceptions', alert: metrics.openExceptions > 0 },
    { label: 'Critical Severity', value: metrics.criticalExceptions, icon: AlertTriangle, color: metrics.criticalExceptions > 0 ? 'text-rose-600 font-black' : 'text-slate-600', path: '/exceptions?severity=CRITICAL', critical: metrics.criticalExceptions > 0 },
    { label: 'Pending Receipts', value: metrics.pendingReceipts, icon: ArrowDownToLine, color: 'text-indigo-700', path: '/receipts' },
    { label: 'Pending Deliveries', value: metrics.pendingDeliveries, icon: ArrowUpFromLine, color: 'text-purple-800', path: '/deliveries' },
    { label: 'Active Transfers', value: metrics.pendingTransfers, icon: ArrowLeftRight, color: 'text-purple-600', path: '/transfers' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-7 animate-fadeIn">
      {/* Control Tower Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-100/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Inventory Control Tower
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              Live Reality Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time consensus between digital ledger transactions and physical facility reality.
          </p>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/receipts')}
            className="px-3.5 py-1.5 bg-white/80 hover:bg-white border border-purple-200/80 text-purple-900 rounded-xl text-xs font-semibold shadow-xs transition-all hover:border-purple-300"
          >
            + New Receipt
          </button>
          <button
            onClick={() => navigate('/transfers')}
            className="px-3.5 py-1.5 bg-white/80 hover:bg-white border border-purple-200/80 text-purple-900 rounded-xl text-xs font-semibold shadow-xs transition-all hover:border-purple-300"
          >
            + Transfer Stock
          </button>
          <button
            onClick={() => navigate('/deliveries')}
            className="px-3.5 py-1.5 bg-white/80 hover:bg-white border border-purple-200/80 text-purple-900 rounded-xl text-xs font-semibold shadow-xs transition-all hover:border-purple-300"
          >
            + New Delivery
          </button>
          <button
            onClick={onOpenCountModal}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Audit Count</span>
          </button>
        </div>
      </div>

      {/* Hero Visual Cards Trio (Modern Inventory Inspiration) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Inventory Confidence Gauge */}
        <ConfidenceGauge confidence={confidence} />

        {/* Card 2: Operational Exception Radar */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/70 p-5 shadow-card hover:border-purple-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-pink-600" />
                Exception Radar
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800">
                {metrics.openExceptions} Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Operational Variance & Discrepancies
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Exceptions are raised only when physical audit counts violate mathematical tolerance limits.
            </p>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-purple-100/60">
              <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-center">
                <span className="block text-[10px] uppercase font-bold text-rose-600">Critical</span>
                <span className="text-lg font-black font-mono text-rose-700">{metrics.criticalExceptions}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                <span className="block text-[10px] uppercase font-bold text-amber-600">Low Stock</span>
                <span className="text-lg font-black font-mono text-amber-700">{metrics.lowStockCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
                <span className="block text-[10px] uppercase font-bold text-purple-600">Pending</span>
                <span className="text-lg font-black font-mono text-purple-700">{needsAttention.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/exceptions')}
            className="w-full mt-4 py-2 bg-purple-50 hover:bg-purple-100/80 text-purple-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-purple-200/60"
          >
            <span>Triage All Exceptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Dark Card (Hero Highlight & Steel Rods Scenario Spotlight) */}
        <div className="glass-card-dark p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-pink-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Core Discrepancy Flow
              </span>
              <span className="text-xs font-mono font-bold text-purple-300">INC-024</span>
            </div>
            <h3 className="text-sm font-bold text-white leading-snug">
              Steel Rods Physical Discrepancy
            </h3>
            <p className="text-xs text-purple-200/70 mt-1.5 leading-relaxed">
              Book record says 100 kg, but physical verification detected 83 kg (-17 kg variance). 2 customer deliveries are potentially affected.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-purple-400/20 backdrop-blur-xs flex items-center justify-between text-xs">
              <span className="text-purple-300 font-medium">Tolerance Status</span>
              <span className="font-bold text-pink-400 font-mono">OUTSIDE TOLERANCE</span>
            </div>
          </div>

          <button
            onClick={() => {
              const steelExc = needsAttention.find((e) => e.sku === 'SR001' || e.exceptionNumber === 'INC-024');
              if (steelExc) navigate(`/exceptions/${steelExc.id}`);
              else navigate('/exceptions');
            }}
            className="w-full mt-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-900/50 flex items-center justify-center gap-1.5"
          >
            <span>Launch Steel Rods Investigation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 8 Essential Key Operational Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {topCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(c.path)}
              className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-purple-100/70 hover:border-purple-300 hover:shadow-card transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 group-hover:text-purple-600 mb-1.5">
                <Icon className="w-4 h-4" />
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="block text-[11px] font-semibold text-slate-500 truncate">{c.label}</span>
              <span className={`text-lg font-black font-mono tracking-tight ${c.color} block mt-0.5`}>
                {c.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Needs Attention & Prioritized Queue */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/70 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              Needs Attention Triage
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 font-bold font-mono">
              {needsAttention.length} Pending Actions
            </span>
          </div>
          <button
            onClick={() => navigate('/exceptions')}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            View All Exceptions <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Prioritized strictly by operational urgency: Critical Discrepancies $\rightarrow$ High-Risk Variances $\rightarrow$ Negative Stock $\rightarrow$ Low Stock Reorder Thresholds.
        </p>

        <div className="space-y-3 pt-1">
          {needsAttention.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <span>All warehouse inventory locations are currently within tolerance. No active exceptions detected.</span>
            </div>
          ) : (
            needsAttention.map((exc) => (
              <div
                key={exc.id}
                onClick={() => navigate(`/exceptions/${exc.id}`)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                  exc.severity === 'CRITICAL'
                    ? 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300 hover:shadow-sm'
                    : exc.severity === 'HIGH'
                    ? 'bg-pink-50/30 border-pink-200/80 hover:border-pink-300 hover:shadow-sm'
                    : 'bg-purple-50/20 border-purple-100 hover:border-purple-200 hover:shadow-sm'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getSeverityBadgeVariant(exc.severity)} size="sm">
                      {exc.severity}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {exc.exceptionNumber}
                    </span>
                    <span className="text-xs font-bold text-purple-950">
                      {exc.product?.name} ({exc.sku})
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1">{exc.notes}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span>
                      Facility: <strong>{exc.warehouse?.name}</strong> / {exc.location?.name}
                    </span>
                    <span>•</span>
                    <Badge variant={getStatusBadgeVariant(exc.status)} size="sm">
                      {exc.status}
                    </Badge>
                    {exc.owner && (
                      <>
                        <span>•</span>
                        <span>Investigator: <strong>{exc.owner.name}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/exceptions/${exc.id}`);
                    }}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 group-hover:scale-[1.02]"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Stock Movement Ledger Feed */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/70 p-6 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Live Stock Movement Ledger
            </h3>
          </div>
          <button
            onClick={() => navigate('/ledger')}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            View Complete Ledger ({metrics.totalStock} items) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 border-y border-purple-100 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3.5">Timestamp</th>
                <th className="py-3 px-3.5">Operation</th>
                <th className="py-3 px-3.5">Reference</th>
                <th className="py-3 px-3.5">Product (SKU)</th>
                <th className="py-3 px-3.5">Source → Destination</th>
                <th className="py-3 px-3.5 text-right">Quantity Change</th>
                <th className="py-3 px-3.5 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {recentMovements.map((m) => (
                <tr key={m.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">
                    {new Date(m.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="font-bold text-slate-800">{m.operation}</span>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono font-bold text-purple-700">{m.referenceId}</td>
                  <td className="py-2.5 px-3.5">
                    <span className="font-semibold text-slate-800">{m.product?.name}</span>{' '}
                    <span className="font-mono text-slate-400">({m.sku})</span>
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600">
                    {m.sourceName || '—'} → {m.destName || '—'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                    <span
                      className={
                        m.quantityChange > 0
                          ? 'text-emerald-600'
                          : m.quantityChange < 0
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }
                    >
                      {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-800 font-bold">
                    {m.balanceAfter}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
