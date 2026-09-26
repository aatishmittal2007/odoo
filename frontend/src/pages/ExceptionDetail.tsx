import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { Badge, getSeverityBadgeVariant, getStatusBadgeVariant } from '../components/common/Badge';
import { Timeline } from '../components/exceptions/Timeline';
import { EvidencePanel } from '../components/exceptions/EvidencePanel';
import { BusinessImpact } from '../components/exceptions/BusinessImpact';
import { InvestigationBox } from '../components/exceptions/InvestigationBox';
import { ResolutionModal } from '../components/exceptions/ResolutionModal';
import { User } from '../types';

interface ExceptionDetailProps {
  id: string;
  navigate: (path: string) => void;
}

export const ExceptionDetail: React.FC<ExceptionDetailProps> = ({ id, navigate }) => {
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [detailRes, usersRes] = await Promise.all([
        api.get(`/exceptions/${id}`),
        api.get('/auth/users'),
      ]);
      setData(detailRes.data);
      setUsers(usersRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load exception details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStartInvestigation = async (formData: any) => {
    await api.post(`/exceptions/${id}/investigate`, formData);
    await fetchDetails();
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean, notes?: string) => {
    await api.patch(`/exceptions/tasks/${taskId}`, { isCompleted, notes });
    await fetchDetails();
  };

  const handleUpdateTask = async (taskId: string, updateData: any) => {
    await api.patch(`/exceptions/tasks/${taskId}`, updateData);
    await fetchDetails();
  };

  const handleAddTask = async (taskData: any, assignedToId?: string) => {
    const payload = typeof taskData === 'string'
      ? { title: taskData, assignedToId }
      : taskData;
    await api.post(`/exceptions/${id}/tasks`, payload);
    await fetchDetails();
  };

  const handleResolve = async (resolveData: any) => {
    await api.post(`/exceptions/${id}/resolve`, resolveData);
    await fetchDetails();
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading Incident Dossier...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-slate-600">
        <p className="text-rose-600 font-semibold mb-2">{error || 'Incident not found'}</p>
        <button
          onClick={() => navigate('/exceptions')}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
        >
          Return to Exceptions
        </button>
      </div>
    );
  }

  const { exception, summary, timeline, potentialInvestigationAreas, businessImpact } = data;
  const isResolved = exception.status === 'RESOLVED';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/exceptions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exceptions Control Tower</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge variant={getSeverityBadgeVariant(exception.severity)} size="lg">
            {exception.severity} SEVERITY
          </Badge>
          <Badge variant={getStatusBadgeVariant(exception.status)} size="lg">
            {exception.status}
          </Badge>
        </div>
      </div>

      {/* Incident Title Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-slate-900">
                {exception.exceptionNumber}
              </span>
              <span className="text-slate-300">•</span>
              <h1 className="text-xl font-bold text-slate-900">
                {exception.product?.name} Discrepancy
              </h1>
              <span className="font-mono text-sm text-slate-500 font-medium">
                ({exception.sku})
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{exception.notes}</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Reported {new Date(exception.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards (Section 12) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">System Recorded</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              {summary.systemQuantity} {exception.product?.uom}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Physical Verified Count</span>
            <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
              {summary.physicalQuantity} {exception.product?.uom}
            </span>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-rose-500">Variance Units</span>
            <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block">
              {summary.variance > 0 ? `+${summary.variance}` : summary.variance} {exception.product?.uom}
            </span>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-rose-500">Variance Percentage</span>
            <span className="text-2xl font-bold font-mono text-rose-700 mt-1 block">
              {summary.variancePercentage > 0 ? `+${summary.variancePercentage.toFixed(1)}` : summary.variancePercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Downstream Business Impact (Section 15) */}
      <BusinessImpact impact={businessImpact} productUom={exception.product?.uom} />

      {/* Resolution Banner if Resolved (Section 18) */}
      {isResolved && exception.resolution && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">
              Incident Resolved & Root Cause Recorded
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div>
              <span className="block text-slate-500 font-medium">Root Cause:</span>
              <strong className="text-emerald-900 text-sm font-bold">{exception.resolution.rootCause}</strong>
            </div>
            <div>
              <span className="block text-slate-500 font-medium">Corrective Action Taken:</span>
              <strong className="text-slate-800">{exception.resolution.correctiveAction}</strong>
            </div>
            <div>
              <span className="block text-slate-500 font-medium">Resolution Time:</span>
              <span className="text-slate-700 font-mono">
                {new Date(exception.resolution.resolvedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          {exception.resolution.explanation && (
            <p className="text-xs text-emerald-900/90 italic pt-1 border-t border-emerald-200/60 mt-2">
              "{exception.resolution.explanation}"
            </p>
          )}
        </div>
      )}

      {/* Middle Two-Column Grid: Timeline & Evidence vs Investigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Timeline (Section 12) & Evidence Panel (Section 13) */}
        <div className="space-y-6">
          {/* Chronological Event Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Chronological Inventory Event Timeline
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {timeline.length} movements tracked
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Complete historical event ledger for {exception.product?.name} leading to variance detection.
            </p>

            <Timeline events={timeline} />
          </div>

          {/* Evidence Panel (Section 13) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <EvidencePanel evidence={exception.evidence || []} />
          </div>
        </div>

        {/* Right Col: Investigation Workflow (Section 16, 17) & Investigation Areas (Section 14) */}
        <div className="space-y-6">
          {/* Investigation Box with Checklist */}
          <InvestigationBox
            exceptionId={exception.id}
            status={exception.status}
            investigation={exception.investigation}
            tasks={exception.tasks || []}
            users={users}
            onStartInvestigation={handleStartInvestigation}
            onToggleTask={handleToggleTask}
            onUpdateTask={handleUpdateTask}
            onAddTask={handleAddTask}
            onOpenResolutionModal={() => setIsResolutionModalOpen(true)}
          />

          {/* Section 14: DO NOT GUESS THE ROOT CAUSE - Potential Investigation Areas */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Potential Investigation Areas
              </h3>
            </div>
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs text-sky-900 leading-relaxed">
              <strong>Human Investigator Guidance:</strong> The system surfaces potentially relevant evidence based on transaction volume and variance patterns. It does <em>not</em> invent an unverified root cause—the human investigator determines confirmed reality.
            </div>

            <div className="space-y-2.5 pt-1">
              {potentialInvestigationAreas.map((area: any, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-slate-150 bg-slate-50/50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{area.area}</span>
                    <Badge variant={area.relevance === 'HIGH' ? 'high' : 'info'} size="sm">
                      {area.relevance} RELEVANCE
                    </Badge>
                  </div>
                  <p className="text-slate-600">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      <ResolutionModal
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
        exceptionNumber={exception.exceptionNumber}
        variance={summary.variance}
        productUom={exception.product?.uom}
        onResolve={handleResolve}
      />
    </div>
  );
};
