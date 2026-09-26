import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Users,
  Building2,
  RefreshCw,
  CheckCircle,
  Database,
  ShieldCheck,
  Search,
  FileText,
  Clock,
  Eye,
} from 'lucide-react';
import api from '../services/api';
import { User, Warehouse, AuditLogEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'facilities' | 'audit'>('facilities');
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const [uRes, wRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/warehouses'),
      ]);
      setUsers(uRes.data);
      setWarehouses(wRes.data);
    } catch (err) {
      console.error('Failed to load settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const params = new URLSearchParams();
      if (auditActionFilter !== 'ALL') params.append('action', auditActionFilter);
      params.append('limit', '100');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setAuditLogs(res.data.logs || []);
      setAuditTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, auditActionFilter]);

  const handleResetDemoData = async () => {
    if (!confirm('Reset demo data to initial scenario state (Steel Rods INC-024, 100 kg system vs 83 physical)?')) {
      return;
    }
    setResetting(true);
    setResetSuccess(false);
    try {
      await api.post('/dashboard/reset-demo');
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const auditActions = [
    { value: 'ALL', label: 'All Audit Actions' },
    { value: 'LOGIN', label: 'User Logins' },
    { value: 'PRODUCT_CREATE', label: 'Product Creations' },
    { value: 'PRODUCT_UPDATE', label: 'Product Updates' },
    { value: 'PRODUCT_DELETE', label: 'Product Deletions / Archives' },
    { value: 'PHYSICAL_COUNT', label: 'Physical Counts Recorded' },
    { value: 'INVESTIGATION_START', label: 'Investigations Launched' },
    { value: 'TASK_CREATE', label: 'Tasks Created' },
    { value: 'TASK_UPDATE', label: 'Tasks Updated' },
    { value: 'EXCEPTION_RESOLVED', label: 'Exceptions Resolved' },
    { value: 'RECEIPT_VALIDATED', label: 'Receipts Validated' },
    { value: 'DELIVERY_VALIDATED', label: 'Deliveries Validated' },
    { value: 'TRANSFER_VALIDATED', label: 'Transfers Validated' },
    { value: 'ADJUSTMENT_CREATED', label: 'Adjustments Created' },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const term = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      (log.entityId && log.entityId.toLowerCase().includes(term)) ||
      (log.user?.name && log.user.name.toLowerCase().includes(term)) ||
      (log.metadataJson && log.metadataJson.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System & Facility Administration
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Manage warehouse facility nodes, user access roles, and immutable D17 audit logs.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('facilities')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'facilities'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Facilities & User Directory</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System Audit Trail (D17)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {auditTotal}
          </span>
        </button>
      </div>

      {/* Facilities Tab Content */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          {/* User Directory */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                User Roles & Access Permissions
              </h3>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{u.name}</span>
                      <span className="text-slate-500 ml-2 font-mono">({u.email})</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{u.department || 'Operations'}</p>
                    </div>
                  </div>

                  <span
                    className={`font-semibold font-mono text-[10px] px-2.5 py-1 rounded-md border ${
                      u.role === 'INVENTORY_MANAGER'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-sky-50 text-sky-800 border-sky-200'
                    }`}
                  >
                    {u.role === 'INVENTORY_MANAGER' ? 'INVENTORY MANAGER' : 'WAREHOUSE STAFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warehouses configuration */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Configured Warehouses ({warehouses.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {warehouses.map((w) => (
                <div key={w.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <span className="font-bold text-slate-900 block">{w.name}</span>
                  <span className="font-mono text-slate-400 block text-[11px]">{w.code}</span>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{w.address || 'Standard facility'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Demo Controls Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Database className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Demo Scenario State & Integrity
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              StockSense runs with transparent deterministic rules on SQLite with Prisma ORM. All ledger movements, variances, business impacts, and root causes persist across browser refreshes.
            </p>

            {resetSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Scan and integrity checks completed successfully.</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleResetDemoData}
                disabled={resetting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Executing Check...' : 'Run Transfer Exception Scan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab Content */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, user, entity ID, metadata..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              {auditActions.map((act) => (
                <option key={act.value} value={act.value}>
                  {act.label}
                </option>
              ))}
            </select>

            <button
              onClick={fetchAuditLogs}
              title="Refresh Audit Logs"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Summary</th>
                    <th className="py-3 px-4 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Loading D17 Audit Logs...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No audit logs match criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      let metaObj: any = null;
                      try {
                        if (log.metadataJson) metaObj = JSON.parse(log.metadataJson);
                      } catch (e) {}

                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-slate-900 block">
                              {log.user?.name || 'System Engine'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.user?.role || 'SYSTEM'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                                log.action.includes('DELETE')
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : log.action.includes('RESOLVED') || log.action.includes('VALIDATED')
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : log.action.includes('INVESTIGATION')
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-50 text-slate-800 border-slate-200'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-700">
                            <span className="font-semibold">{log.entity}</span>
                            {log.entityId && (
                              <span className="text-slate-400 ml-1 text-[11px]">
                                #{log.entityId.slice(0, 8)}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                            {metaObj ? (
                              <span className="font-mono text-[11px]">
                                {Object.entries(metaObj)
                                  .slice(0, 3)
                                  .map(([k, v]) => `${k}: ${String(v)}`)
                                  .join(', ')}
                              </span>
                            ) : (
                              log.metadataJson || '—'
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Log Record`}
          subtitle={`Immutable D17 entry logged at ${new Date(selectedLog.timestamp).toISOString()}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Action</span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  {selectedLog.action}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Entity</span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  {selectedLog.entity} #{selectedLog.entityId || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Operator</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedLog.user?.name || 'System / Automated Engine'}
                </span>
                {selectedLog.user?.email && (
                  <span className="text-slate-500 font-mono text-[11px]">{selectedLog.user.email}</span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Exact Timestamp</span>
                <span className="font-mono text-slate-800 block mt-0.5">
                  {new Date(selectedLog.timestamp).toLocaleString([], { dateStyle: 'full', timeStyle: 'medium' })}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Metadata Payload (JSON)
              </span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                {selectedLog.metadataJson
                  ? JSON.stringify(JSON.parse(selectedLog.metadataJson), null, 2)
                  : '{}'}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
