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
  Sparkles,
  BrainCircuit,
  Check,
  ListChecks,
  AlertCircle,
  FileText,
  Calculator,
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

  // OpenRouter AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [detailRes, usersRes] = await Promise.all([
        api.get(`/exceptions/${id}`),
        api.get('/auth/users'),
      ]);
      setData(detailRes.data);
      setUsers(usersRes.data);

      if (detailRes.data.exception?.aiAnalysis) {
        const raw = detailRes.data.exception.aiAnalysis;
        setAiAnalysis({
          summary: raw.summary,
          facts: typeof raw.factsJson === 'string' ? JSON.parse(raw.factsJson) : raw.facts || [],
          potential_causes: typeof raw.potentialCausesJson === 'string' ? JSON.parse(raw.potentialCausesJson) : raw.potential_causes || [],
          recommended_checks: typeof raw.recommendedChecksJson === 'string' ? JSON.parse(raw.recommendedChecksJson) : raw.recommended_checks || [],
          modelUsed: raw.modelUsed,
          confidence: raw.confidence,
        });
      }

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

  const handleGenerateAiAnalysis = async () => {
    try {
      setAiLoading(true);
      setAiError(null);
      const res = await api.post(`/ai/exceptions/${id}/summary`);
      setAiAnalysis(res.data);
    } catch (err: any) {
      setAiError(
        err.response?.data?.error ||
        'AI analysis is temporarily unavailable. The core exception investigation and resolution workflow remain fully functional without external keys.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-purple-600">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Retrieving Incident Dossier & Evidence...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-slate-600 max-w-md mx-auto mt-12 bg-white rounded-3xl border border-purple-100 shadow-card">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-900 mb-1">Incident Not Found</h3>
        <p className="text-xs text-rose-600 font-medium mb-4">{error || 'Unable to locate exception records.'}</p>
        <button
          onClick={() => navigate('/exceptions')}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          Return to Exceptions
        </button>
      </div>
    );
  }

  const { exception, summary, timeline, potentialInvestigationAreas, businessImpact } = data;
  const isResolved = exception.status === 'RESOLVED';

  // Parse explainable severity metadata
  let severityMeta: any = null;
  if (exception.severityMetaJson) {
    try {
      severityMeta = JSON.parse(exception.severityMetaJson);
    } catch {
      severityMeta = null;
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-purple-100/60">
        <button
          onClick={() => navigate('/exceptions')}
          className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exceptions Control Tower</span>
        </button>

        <div className="flex items-center gap-2.5">
          <Badge variant={getSeverityBadgeVariant(exception.severity)} size="lg">
            {exception.severity} SEVERITY
          </Badge>
          <Badge variant={getStatusBadgeVariant(exception.status)} size="lg">
            {exception.status}
          </Badge>
        </div>
      </div>

      {/* Incident Title Header Card */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-purple-100/80 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl font-black text-purple-950">
                {exception.exceptionNumber}
              </span>
              <span className="text-slate-300">•</span>
              <h1 className="text-xl font-bold text-slate-900">
                {exception.product?.name} Physical Discrepancy
              </h1>
              <span className="font-mono text-sm text-purple-600 font-semibold">
                (SKU: {exception.sku})
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{exception.notes}</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 shrink-0">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>
              Recorded {new Date(exception.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-purple-50/50 border border-purple-100/70 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-500">System Recorded Stock</span>
            <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
              {summary.systemQuantity} <span className="text-xs font-normal text-slate-500">{exception.product?.uom}</span>
            </span>
          </div>

          <div className="p-3.5 bg-purple-50/50 border border-purple-100/70 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-500">Physical Verified Count</span>
            <span className="text-2xl font-black font-mono text-purple-950 mt-1 block">
              {summary.physicalQuantity} <span className="text-xs font-normal text-slate-500">{exception.product?.uom}</span>
            </span>
          </div>

          <div className="p-3.5 bg-pink-50/50 border border-pink-200/80 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-pink-600">Variance Delta</span>
            <span className="text-2xl font-black font-mono text-pink-700 mt-1 block">
              {summary.variance > 0 ? `+${summary.variance}` : summary.variance} <span className="text-xs font-normal text-pink-600">{exception.product?.uom}</span>
            </span>
          </div>

          <div className="p-3.5 bg-pink-50/50 border border-pink-200/80 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-pink-600">Variance Percentage</span>
            <span className="text-2xl font-black font-mono text-pink-700 mt-1 block">
              {summary.variancePercentage > 0 ? `+${summary.variancePercentage.toFixed(1)}` : summary.variancePercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* WHY THIS EXCEPTION EXISTS — Explainable Severity Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/80 p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-900">
              Why This Exception Exists (Deterministic Engine Rationale)
            </h3>
          </div>
          {severityMeta && (
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
              Severity Score: {severityMeta.totalScore}/14
            </span>
          )}
        </div>

        <div className="p-3.5 bg-purple-50/40 border border-purple-100/70 rounded-xl text-xs space-y-2">
          {severityMeta?.reasons && severityMeta.reasons.length > 0 ? (
            <ul className="space-y-1.5">
              {severityMeta.reasons.map((r: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                  <span className="font-medium">{r}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600">
              Calculated dynamically by the StockSense Deterministic Exception Engine based on physical variance exceeding allowed tolerance limits.
            </p>
          )}
        </div>
      </div>

      {/* Downstream Business Impact */}
      <BusinessImpact impact={businessImpact} productUom={exception.product?.uom} />

      {/* Resolution Banner if Resolved */}
      {isResolved && exception.resolution && (
        <div className="p-5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-700" />
            <h3 className="text-sm font-bold text-purple-950 uppercase tracking-wider">
              Incident Resolved & Root Cause Reconciled
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div>
              <span className="block text-slate-500 font-medium">Root Cause:</span>
              <strong className="text-purple-900 text-sm font-black">{exception.resolution.rootCause}</strong>
            </div>
            <div>
              <span className="block text-slate-500 font-medium">Corrective Action Taken:</span>
              <strong className="text-slate-800">{exception.resolution.correctiveAction}</strong>
            </div>
            <div>
              <span className="block text-slate-500 font-medium">Resolution Timestamp:</span>
              <span className="text-slate-700 font-mono">
                {new Date(exception.resolution.resolvedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          {exception.resolution.explanation && (
            <p className="text-xs text-purple-900 italic pt-2 border-t border-purple-200/60 mt-2">
              "{exception.resolution.explanation}"
            </p>
          )}
        </div>
      )}

      {/* AI Analysis Card (Optional & Decoupled) */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/80 shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#120f24] via-[#1a1438] to-[#2d1b4e] p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  StockSense AI Discrepancy Synthesis
                </h3>
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 font-mono">
                  Optional Analysis
                </span>
              </div>
              <p className="text-xs text-purple-200/70 mt-0.5">
                Multi-factor hypothesis generation synthesizing ledger movement history and linked physical counts.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateAiAnalysis}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? 'Synthesizing Dossier...' : aiAnalysis ? 'Re-run AI Analysis' : 'Generate AI Analysis'}</span>
          </button>
        </div>

        {/* Governance Disclaimer */}
        <div className="px-5 py-2.5 bg-purple-50/30 border-b border-purple-100 flex items-center gap-2 text-[11px] text-slate-500">
          <span className="font-bold text-slate-700">Governance Rule:</span>
          <span>
            AI provides observational hypothesis generation. Core inventory decisions and root cause determinations are strictly recorded by authorized managers.
          </span>
        </div>

        {/* AI Error Fallback */}
        {aiError && (
          <div className="p-4 m-5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Service Notice:</strong>
              <span>{aiError}</span>
            </div>
          </div>
        )}

        {/* AI Content */}
        {aiAnalysis ? (
          <div className="p-5 space-y-4">
            <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider block">
                Executive Synthesis ({aiAnalysis.modelUsed || 'OpenRouter / Deterministic Fallback'})
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {aiAnalysis.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Verified Facts */}
              <div className="p-4 bg-purple-50/30 border border-purple-100 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-purple-700">
                  <Check className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Authoritative Database Facts</h4>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {(aiAnalysis.facts || []).map((fact: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: Potential Causes (Hypotheses) */}
              <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <BrainCircuit className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Potential Causes (Hypotheses)</h4>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {(aiAnalysis.potential_causes || []).map((cause: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">{cause}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Recommended Operator Checks */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-200/80 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-indigo-800">
                  <ListChecks className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">Recommended Operator Checks</h4>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {(aiAnalysis.recommended_checks || []).map((check: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      <span className="leading-snug">{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : !aiLoading && !aiError ? (
          <div className="p-8 text-center space-y-1.5">
            <p className="text-xs text-slate-600 font-semibold">
              AI analysis is optional. Click <strong>Generate AI Analysis</strong> to evaluate hypotheses.
            </p>
            <p className="text-[11px] text-slate-400">
              The application remains 100% functional and auditable with AI disabled.
            </p>
          </div>
        ) : null}
      </div>

      {/* Middle Two-Column Grid: Timeline & Evidence vs Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Timeline & Evidence Panel */}
        <div className="space-y-6">
          {/* Chronological Event Timeline */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/80 p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Chronological Inventory Event Timeline
              </h3>
              <span className="text-[11px] text-purple-700 font-mono font-bold">
                {timeline.length} movements tracked
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Complete historical transaction ledger for {exception.product?.name} leading to variance detection.
            </p>

            <Timeline events={timeline} />
          </div>

          {/* Evidence Panel */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/80 p-5 shadow-card space-y-4">
            <EvidencePanel evidence={exception.evidence || []} />
          </div>
        </div>

        {/* Right Column: Investigation Workspace & Potential Areas */}
        <div className="space-y-6">
          {/* Investigation Box with Checklist Tasks */}
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

          {/* Potential Investigation Areas (Human Guidance) */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/80 p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Potential Investigation Areas
              </h3>
            </div>
            <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-xl text-xs text-purple-950 leading-relaxed">
              <strong>Investigator Guidance:</strong> Evidence surfaces operational areas for verification. Root causes are confirmed by human staff after inspecting physical shelves and manifests.
            </div>

            <div className="space-y-2 pt-1">
              {potentialInvestigationAreas.map((area: any, index: number) => (
                <div
                  key={index}
                  className="p-3 rounded-xl border border-purple-100/80 bg-purple-50/20 space-y-1 text-xs"
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
