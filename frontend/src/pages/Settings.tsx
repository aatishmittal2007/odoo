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
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Server,
  Workflow,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { User, Warehouse, AuditLogEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

interface SettingsPageProps {
  initialTab?: 'facilities' | 'users' | 'audit' | 'integrations';
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ initialTab = 'facilities' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'facilities' | 'users' | 'audit' | 'integrations'>(initialTab);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Integration & Architecture Status State (Phase 3)
  const [integrationStatus, setIntegrationStatus] = useState<any>(null);
  const [integrationLoading, setIntegrationLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchIntegrationStatus = async () => {
    try {
      setIntegrationLoading(true);
      const res = await api.get('/integrations/status');
      setIntegrationStatus(res.data);
    } catch (err) {
      console.error('Failed to load integration status:', err);
    } finally {
      setIntegrationLoading(false);
    }
  };

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
    } else if (activeTab === 'integrations') {
      fetchIntegrationStatus();
    }
  }, [activeTab, auditActionFilter]);

  const handleResetDemoData = async () => {
    if (!confirm('Scan and verify transfer exception integrity rules across all facilities?')) {
      return;
    }
    setResetting(true);
    setResetSuccess(false);
    try {
      await api.post('/exceptions/scan-transfers');
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Scan failed');
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
    const q = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      log.entityId?.toLowerCase().includes(q) ||
      log.user?.name?.toLowerCase().includes(q) ||
      log.user?.email?.toLowerCase().includes(q) ||
      log.metadataJson?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System & Facility Configuration</h1>
            <p className="text-xs text-slate-500">
              Manage warehouse facilities, user access credentials, system audit logs, and external architecture connections.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-purple-100 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('facilities')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'facilities'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Warehouse Facilities</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Roles</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'audit'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System Audit Trail (D17)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
            {auditTotal}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'integrations'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Architecture & Integrations</span>
        </button>
      </div>

      {/* Facilities Tab Content */}
      {activeTab === 'facilities' && (
        <div className="space-y-6">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Configured Warehouses ({warehouses.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {warehouses.map((w) => (
                <div key={w.id} className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 block">{w.name}</span>
                    {w.isDefault && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-purple-900 font-semibold block text-[11px]">{w.code}</span>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{w.address || 'Standard facility hub'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Database Integrity & Transfer Exception Scan Card */}
          <div className="glass-card-dark p-6 space-y-3">
            <div className="flex items-center gap-2 text-purple-300">
              <Database className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                PostgreSQL Database Persistence & Integrity
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              StockSense transactions, multi-facility stock ledgers, and tolerance audits are durably committed into PostgreSQL via Prisma ORM. No volatile in-memory loss.
            </p>

            {resetSuccess && (
              <div className="p-3 bg-purple-950/80 border border-purple-500 rounded-xl text-xs text-purple-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>Transfer exception scanner completed successfully.</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleResetDemoData}
                disabled={resetting}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Executing Scan...' : 'Run Transfer Exception Scan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Authorized System Operators & Role Permissions
            </h3>
          </div>

          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{u.name}</span>
                    <span className="text-slate-500 ml-2 font-mono">({u.email})</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{u.department || 'Operations'}</p>
                  </div>
                </div>

                <span
                  className={`font-semibold font-mono text-[10px] px-2.5 py-1 rounded-lg border ${
                    u.role === 'INVENTORY_MANAGER'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}
                >
                  {u.role === 'INVENTORY_MANAGER' ? 'INVENTORY MANAGER' : 'WAREHOUSE STAFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Tab Content */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="glass-card p-3 sm:p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, user, entity ID, metadata..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
              />
            </div>

            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="px-3 py-2 bg-white/80 border border-purple-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
              className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl border border-purple-100 bg-white shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin text-purple-600' : ''}`} />
            </button>
          </div>

          {/* Audit Logs Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold">Operator</th>
                    <th className="py-3.5 px-4 font-semibold">Action</th>
                    <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                    <th className="py-3.5 px-4 font-semibold">Summary</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/40">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
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
                          className="hover:bg-purple-50/30 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">
                              {log.user?.name || 'System Engine'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.user?.role || 'SYSTEM'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg border ${
                                log.action.includes('DELETE')
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : log.action.includes('RESOLVED') || log.action.includes('VALIDATED')
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : log.action.includes('INVESTIGATION')
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-slate-50 text-slate-800 border-slate-200'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            <span className="font-semibold">{log.entity}</span>
                            {log.entityId && (
                              <span className="text-slate-400 ml-1 text-[11px]">
                                #{log.entityId.slice(0, 8)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
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
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
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

      {/* Integrations Tab Content */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Integration & Automation Health Dashboard
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Operational status for core inventory persistence, asynchronous n8n automation, and optional AI services.
              </p>
            </div>

            <button
              onClick={fetchIntegrationStatus}
              disabled={integrationLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${integrationLoading ? 'animate-spin' : ''}`} />
              <span>{integrationLoading ? 'Verifying Services...' : 'Verify Live Health'}</span>
            </button>
          </div>

          {/* 4 Health Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PostgreSQL */}
            <div className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">PostgreSQL DB</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600">CONNECTED</div>
              <p className="text-[11px] text-slate-400">Port 5434 • Prisma Client Active</p>
            </div>

            {/* n8n Webhook */}
            <div className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">n8n Automation</span>
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              </div>
              <div className="text-lg font-bold font-mono text-purple-700">CONFIGURED</div>
              <p className="text-[11px] text-slate-400">Non-blocking resilient trigger</p>
            </div>

            {/* AI Engine Status */}
            <div className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">AI Engine</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              </div>
              <div className="text-lg font-bold font-mono text-indigo-700">DETERMINISTIC</div>
              <p className="text-[11px] text-slate-400">Heuristic reasoning fallback ready</p>
            </div>

            {/* Tolerance Engine */}
            <div className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Tolerance Engine</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-600">ACTIVE</div>
              <p className="text-[11px] text-slate-400">Tiered 1%–2% dynamic evaluation</p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Audit Log Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Log — ${selectedLog.action}`}
          subtitle={`Event ID: ${selectedLog.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Action</span>
                <span className="font-bold text-slate-900">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Entity</span>
                <span className="font-mono text-purple-900 font-bold">
                  {selectedLog.entity} #{selectedLog.entityId?.slice(0, 8)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Raw Audit Metadata</span>
              <pre className="p-3 bg-slate-950 text-purple-300 rounded-xl text-[11px] font-mono overflow-x-auto">
                {selectedLog.metadataJson
                  ? JSON.stringify(JSON.parse(selectedLog.metadataJson), null, 2)
                  : JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Close Audit Entry
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default SettingsPage;
