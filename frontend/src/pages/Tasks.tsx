import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Square,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  User as UserIcon,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { ExceptionItem, InvestigationTask } from '../types';
import { Badge, getSeverityBadgeVariant } from '../components/common/Badge';

interface TasksProps {
  navigate: (path: string) => void;
}

interface EnrichedTask extends InvestigationTask {
  parentException: {
    id: string;
    exceptionNumber: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    productName: string;
    productSku: string;
    warehouseName: string;
  };
}

export const Tasks: React.FC<TasksProps> = ({ navigate }) => {
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exceptions');
      const exceptions: ExceptionItem[] = res.data;

      const allTasks: EnrichedTask[] = [];
      exceptions.forEach((ex) => {
        if (ex.tasks && ex.tasks.length > 0) {
          ex.tasks.forEach((t) => {
            allTasks.push({
              ...t,
              parentException: {
                id: ex.id,
                exceptionNumber: ex.exceptionNumber,
                severity: ex.severity,
                productName: ex.product?.name || 'Unknown Item',
                productSku: ex.product?.sku || 'SKU',
                warehouseName: ex.warehouse?.name || 'Warehouse',
              },
            });
          });
        }
      });

      // Sort by incomplete first, then sortOrder
      allTasks.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return a.sortOrder - b.sortOrder;
      });

      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    setTogglingId(taskId);
    try {
      await api.patch(`/exceptions/tasks/${taskId}`, {
        isCompleted: !currentCompleted,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !currentCompleted } : t))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update task');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.parentException.exceptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.parentException.productName.toLowerCase().includes(search.toLowerCase()) ||
      t.parentException.productSku.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'TODO' && !t.isCompleted) ||
      (statusFilter === 'COMPLETED' && t.isCompleted);

    return matchesSearch && matchesStatus;
  });

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => !t.isCompleted).length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Investigation Action Tasks</h1>
              <p className="text-xs text-slate-500">
                Actionable verification checklists assigned to resolve discrepancies and restore inventory confidence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Checklists</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalTasks}</div>
          <div className="text-[11px] text-slate-400 mt-1">Audit tasks generated</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Action Pending</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{pendingTasks}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting physical inspection</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Completed & Verified</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{completedTasks}</div>
          <div className="text-[11px] text-slate-400 mt-1">Evidence confirmed by investigator</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, incident #, SKU, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'TODO', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-white/60 text-slate-600 hover:bg-purple-50 border border-purple-100/60'
              }`}
            >
              {st === 'ALL' ? 'All Tasks' : st === 'TODO' ? 'Pending Action' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-12 text-center text-slate-400 font-medium">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
            Loading investigation tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-400">
            No investigation tasks found matching the criteria.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`glass-card p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                t.isCompleted ? 'opacity-70 bg-purple-50/20' : 'hover:border-purple-300'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <button
                  onClick={() => handleToggleTask(t.id, t.isCompleted)}
                  disabled={togglingId === t.id}
                  className="mt-0.5 text-purple-600 hover:text-purple-700 transition-colors shrink-0"
                >
                  {t.isCompleted ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 hover:text-purple-600" />
                  )}
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold text-slate-900 ${
                        t.isCompleted ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {t.title}
                    </span>
                    <Badge variant={getSeverityBadgeVariant(t.parentException.severity)} size="sm">
                      {t.parentException.severity}
                    </Badge>
                  </div>

                  {t.description && (
                    <p className="text-[11px] text-slate-500 leading-relaxed">{t.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                    <span>Target: {t.parentException.productName} ({t.parentException.productSku})</span>
                    <span>•</span>
                    <span>Facility: {t.parentException.warehouseName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <button
                  onClick={() => navigate(`/exceptions/${t.parentException.id}`)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold flex items-center gap-1.5 border border-purple-200/60 transition-colors"
                >
                  <span>{t.parentException.exceptionNumber}</span>
                  <ArrowRight className="w-3 h-3 text-purple-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default Tasks;
