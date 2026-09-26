import React, { useEffect, useState } from 'react';
import { ShieldAlert, Filter, Search, ArrowRight, AlertTriangle, CheckCircle2, User, Warehouse as WarehouseIcon } from 'lucide-react';
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
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'OPEN' | 'HIGH_PRIORITY' | 'ASSIGNED_TO_ME'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (quickFilter === 'OPEN') params.append('status', 'OPEN');
      if (quickFilter === 'HIGH_PRIORITY') params.append('severity', 'CRITICAL');
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Exception Control Tower
            </h1>
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
              {exceptions.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic triage of physical discrepancies, misplaced items, and inventory risk incidents.
          </p>
        </div>

        {/* Quick Quick Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setQuickFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              quickFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setQuickFilter('OPEN')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              quickFilter === 'OPEN' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setQuickFilter('HIGH_PRIORITY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              quickFilter === 'HIGH_PRIORITY' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            High Priority
          </button>
          <button
            onClick={() => setQuickFilter('ASSIGNED_TO_ME')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              quickFilter === 'ASSIGNED_TO_ME' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assigned to Me
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident # (INC-024), SKU, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="ACTION_REQUIRED">Action Required</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
        >
          {exceptionTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Exception Cards Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading exceptions...</div>
        ) : exceptions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 p-8 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No matching exceptions found</p>
            <p className="text-xs text-slate-500">All inventory discrepancies have been resolved or filtered out.</p>
          </div>
        ) : (
          exceptions.map((exc) => {
            const isResolved = exc.status === 'RESOLVED';

            return (
              <div
                key={exc.id}
                onClick={() => navigate(`/exceptions/${exc.id}`)}
                className={`p-4 bg-white rounded-xl border transition-all cursor-pointer hover:shadow-xs group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  exc.severity === 'CRITICAL' && !isResolved
                    ? 'border-rose-200 hover:border-rose-300'
                    : exc.severity === 'HIGH' && !isResolved
                    ? 'border-amber-200 hover:border-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge variant={getSeverityBadgeVariant(exc.severity)} size="sm">
                      {exc.severity}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {exc.exceptionNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {exc.product?.name}
                    </span>
                    <span className="font-mono text-slate-400 text-xs">
                      ({exc.sku})
                    </span>
                    <Badge variant={getStatusBadgeVariant(exc.status)} size="sm">
                      {exc.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-700 leading-snug">{exc.notes}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <WarehouseIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exc.warehouse?.name} / {exc.location?.name}</span>
                    </div>
                    {exc.owner && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Owner: <strong>{exc.owner.name}</strong></span>
                      </div>
                    )}
                    <span className="text-slate-400 font-mono text-[11px]">
                      Created {new Date(exc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Right button */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/exceptions/${exc.id}`);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${
                      isResolved
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-slate-900 group-hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <span>{isResolved ? 'Inspect Audit' : 'Investigate'}</span>
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
