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
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading Inventory Control Tower...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-slate-600">
        <p className="text-rose-600 font-semibold mb-2">{error || 'Unable to load dashboard'}</p>
        <button
          onClick={fetchTowerData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const { metrics, confidence, needsAttention, recentMovements } = data;

  const topCards = [
    { label: 'Total Products', value: metrics.totalProducts, icon: Boxes, color: 'text-slate-900', path: '/products' },
    { label: 'Total On-Hand Stock', value: metrics.totalStock.toLocaleString(), icon: Layers, color: 'text-emerald-700', path: '/stock' },
    { label: 'Low Stock Alerts', value: metrics.lowStockCount, icon: TrendingDown, color: metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-600', path: '/products?lowStock=true' },
    { label: 'Open Exceptions', value: metrics.openExceptions, icon: ShieldAlert, color: metrics.openExceptions > 0 ? 'text-orange-600' : 'text-slate-600', path: '/exceptions' },
    { label: 'Critical Exceptions', value: metrics.criticalExceptions, icon: AlertTriangle, color: metrics.criticalExceptions > 0 ? 'text-rose-600 font-bold' : 'text-slate-600', path: '/exceptions?severity=CRITICAL' },
    { label: 'Pending Receipts', value: metrics.pendingReceipts, icon: ArrowDownToLine, color: 'text-sky-700', path: '/receipts' },
    { label: 'Pending Deliveries', value: metrics.pendingDeliveries, icon: ArrowUpFromLine, color: 'text-indigo-700', path: '/deliveries' },
    { label: 'Active Transfers', value: metrics.pendingTransfers, icon: ArrowLeftRight, color: 'text-purple-700', path: '/transfers' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventory Control Tower
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Reality Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritizes discrepancies, operational exceptions, and down-stream business impact over passive reporting.
          </p>
        </div>

        {/* Quick Operations Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/receipts')}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            + Receipt
          </button>
          <button
            onClick={() => navigate('/transfers')}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            + Transfer
          </button>
          <button
            onClick={() => navigate('/deliveries')}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            + Delivery
          </button>
          <button
            onClick={onOpenCountModal}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Count</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {topCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(c.path)}
              className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400 group-hover:text-slate-600 mb-1.5">
                <Icon className="w-4 h-4" />
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="block text-[11px] font-medium text-slate-500 truncate">{c.label}</span>
              <span className={`text-lg font-bold font-mono tracking-tight ${c.color} block mt-0.5`}>
                {c.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Needs Attention & Inventory Confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prioritized Needs Attention (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Needs Attention
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
                {needsAttention.length} Pending
              </span>
            </div>
            <button
              onClick={() => navigate('/exceptions')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              View All Exceptions <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Ranked by urgency: Critical → High → Medium → Low. Immediate action required to prevent shipment delays.
          </p>

          <div className="space-y-3">
            {needsAttention.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active inventory exceptions detected. Facility is operating within normal variance.
              </div>
            ) : (
              needsAttention.map((exc) => (
                <div
                  key={exc.id}
                  onClick={() => navigate(`/exceptions/${exc.id}`)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    exc.severity === 'CRITICAL'
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                      : exc.severity === 'HIGH'
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
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
                      <span className="text-xs font-semibold text-slate-800">
                        {exc.product?.name} ({exc.sku})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">{exc.notes}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{exc.warehouse?.name} / {exc.location?.name}</span>
                      <span>•</span>
                      <Badge variant={getStatusBadgeVariant(exc.status)} size="sm">
                        {exc.status}
                      </Badge>
                      {exc.owner && (
                        <>
                          <span>•</span>
                          <span>Owner: {exc.owner.name}</span>
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
                      className="px-3.5 py-1.5 bg-slate-900 group-hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
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

        {/* Right Col: Inventory Confidence Card */}
        <div className="space-y-6">
          <ConfidenceGauge confidence={confidence} />

          {/* Quick Demo Scenario Highlight Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-xl p-5 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                Core Demo Highlight
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">INC-024</span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Steel Rods Discrepancy & Downstream Impact
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              System: 100 kg • Physical: 83 kg (-17 kg variance). 2 active delivery orders at risk with a 53-unit potential shortage.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  const steelExc = needsAttention.find((e) => e.sku === 'SR001' || e.exceptionNumber === 'INC-024');
                  if (steelExc) navigate(`/exceptions/${steelExc.id}`);
                  else navigate('/exceptions');
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold text-center transition-colors shadow-sm"
              >
                Inspect INC-024 Incident Flow →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Stock Movements Ledger Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Live Stock Movement Ledger
            </h3>
          </div>
          <button
            onClick={() => navigate('/ledger')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View Complete Ledger ({metrics.totalStock} items) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-y border-slate-200 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Product (SKU)</th>
                <th className="py-2.5 px-3">Source → Destination</th>
                <th className="py-2.5 px-3 text-right">Quantity Change</th>
                <th className="py-2.5 px-3 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-500">
                    {new Date(m.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-800">{m.operation}</span>
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">{m.referenceId}</td>
                  <td className="py-2 px-3">
                    <span className="font-medium text-slate-800">{m.product?.name}</span>{' '}
                    <span className="font-mono text-slate-400">({m.sku})</span>
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {m.sourceName || '—'} → {m.destName || '—'}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold">
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
                  <td className="py-2 px-3 text-right font-mono text-slate-700 font-semibold">
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
