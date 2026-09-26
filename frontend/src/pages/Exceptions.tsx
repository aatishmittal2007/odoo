import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Filter,
  Search,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  User,
  Warehouse as WarehouseIcon,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { ExceptionItem } from '../types';
import { Badge, getSeverityBadgeVariant, getStatusBadgeVariant } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

interface ExceptionsProps {
  navigate: (path: string) => void;
}

export const Exceptions: React.FC<ExceptionsProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'OPEN' | 'CRITICAL' | 'ASSIGNED_TO_ME'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (quickFilter === 'OPEN') params.append('status', 'OPEN');
      if (quickFilter === 'CRITICAL') params.append('severity', 'CRITICAL');
      if (quickFilter === 'ASSIGNED_TO_ME' && user) params.append('ownerId', user.id);

      if (selectedSeverity !== 'ALL') params.append('severity', selectedSeverity);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/exceptions?${params.toString()}`);
      setExceptions(res.data);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, [quickFilter, selectedSeverity, selectedStatus, selectedType, search]);

  const exceptionTypes = [
    { value: 'ALL', label: 'All Exception Types' },
    { value: 'INVENTORY_DISCREPANCY', label: 'Inventory Discrepancy' },
    { value: 'LOCATION_MISMATCH', label: 'Location Mismatch' },
    { value: 'UNUSUAL_ADJUSTMENT', label: 'Unusual Adjustment' },
    { value: 'COUNT_OVERDUE', label: 'Count Overdue' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'NEGATIVE_STOCK', label: 'Negative Stock' },
    { value: 'TRANSFER_EXCEPTION', label: 'Transfer Exception' },
  ];

  // Stats calculation
  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL').length;
  const highCount = exceptions.filter((e) => e.severity === 'HIGH').length;
  const openCount = exceptions.filter((e) => e.status !== 'RESOLVED' && e.status !== 'CLOSED').length;
  const resolvedCount = exceptions.filter((e) => e.status === 'RESOLVED').length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-100/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Exceptions & Discrepancies
            </h1>
            <span className="text-xs font-bold font-mono px-3 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
              {exceptions.length} Recorded
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated detection and deterministic resolution for out-of-tolerance physical inventory discrepancies.
          </p>
        </div>

        {/* Quick Filter Pill Group */}
        <div className="flex items-center gap-1.5 p-1 bg-purple-50/70 rounded-xl border border-purple-100/80 text-xs">
          <button
            onClick={() => setQuickFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              quickFilter === 'ALL'
                ? 'bg-white text-purple-900 shadow-sm border border-purple-100'
                : 'text-slate-500 hover:text-purple-900'
            }`}
          >
            All Incidents
          </button>
          <button
            onClick={() => setQuickFilter('OPEN')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              quickFilter === 'OPEN'
                ? 'bg-white text-purple-900 shadow-sm border border-purple-100'
                : 'text-slate-500 hover:text-purple-900'
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setQuickFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              quickFilter === 'CRITICAL'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            Critical ({criticalCount})
          </button>
          {user && (
            <button
              onClick={() => setQuickFilter('ASSIGNED_TO_ME')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                quickFilter === 'ASSIGNED_TO_ME'
                  ? 'bg-white text-purple-900 shadow-sm border border-purple-100'
                  : 'text-slate-500 hover:text-purple-900'
              }`}
            >
              Assigned to Me
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/70 p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Open</span>
          <span className="text-2xl font-black font-mono text-purple-950 block mt-1">{openCount}</span>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-rose-100/80 p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Critical Urgency</span>
          <span className="text-2xl font-black font-mono text-rose-600 block mt-1">{criticalCount}</span>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-pink-100/80 p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500">High Severity</span>
          <span className="text-2xl font-black font-mono text-pink-600 block mt-1">{highCount}</span>
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-100/80 p-4 shadow-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Resolved & Reconciled</span>
          <span className="text-2xl font-black font-mono text-emerald-700 block mt-1">{resolvedCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/70 p-4 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by Incident #, SKU, Notes, Product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            {exceptionTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exception Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-purple-600">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-600">Loading Exception Registry...</span>
          </div>
        ) : exceptions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white/80 rounded-2xl border border-purple-100">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-700">No matching exceptions found</h4>
            <p className="text-xs text-slate-500 mt-1">Physical inventory matches system tolerance rules.</p>
          </div>
        ) : (
          exceptions.map((exc) => {
            const isResolved = exc.status === 'RESOLVED';
            const isCritical = exc.severity === 'CRITICAL';
            const isHigh = exc.severity === 'HIGH';

            return (
              <div
                key={exc.id}
                onClick={() => navigate(`/exceptions/${exc.id}`)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isResolved
                    ? 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                    : isCritical
                    ? 'bg-rose-50/30 border-rose-200/80 hover:border-rose-400 hover:shadow-card'
                    : isHigh
                    ? 'bg-pink-50/30 border-pink-200/80 hover:border-pink-400 hover:shadow-card'
                    : 'bg-white/90 border-purple-100/80 hover:border-purple-300 hover:shadow-card'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge variant={getSeverityBadgeVariant(exc.severity)} size="sm">
                      {exc.severity}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      {exc.exceptionNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {exc.product?.name} ({exc.sku})
                    </span>
                    <Badge variant={getStatusBadgeVariant(exc.status)} size="sm">
                      {exc.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{exc.notes}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <WarehouseIcon className="w-3.5 h-3.5 text-purple-500" />
                      Facility: <strong>{exc.warehouse?.name}</strong> / {exc.location?.name}
                    </span>
                    {exc.owner && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Owner: <strong>{exc.owner.name}</strong>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(exc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/exceptions/${exc.id}`);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                      isResolved
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : isCritical
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-purple-700 hover:bg-purple-800 text-white group-hover:scale-[1.02]'
                    }`}
                  >
                    <span>{isResolved ? 'View Resolution' : 'Investigate'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
