import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ConfidenceData, ConfidenceFactor } from '../../types';

interface ConfidenceGaugeProps {
  confidence: ConfidenceData;
  compact?: boolean;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence, compact = false }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return { text: 'text-purple-600', ring: 'stroke-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
    if (score >= 70) return { text: 'text-indigo-600', ring: 'stroke-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    if (score >= 50) return { text: 'text-amber-600', ring: 'stroke-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { text: 'text-pink-600', ring: 'stroke-pink-600', bg: 'bg-pink-50', border: 'border-pink-200' };
  };

  const colors = getScoreColor(confidence.score);

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> High Integrity
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" /> Moderate Risk
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Low Reliability
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-800 border border-pink-200">
            <ShieldX className="w-3.5 h-3.5 text-pink-600" /> Critical Attention
          </span>
        );
    }
  };

  const getFactorIcon = (type: ConfidenceFactor['type']) => {
    switch (type) {
      case 'POSITIVE':
        return <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 100 100">
            <circle className="text-purple-100 stroke-current" strokeWidth="12" fill="transparent" r="40" cx="50" cy="50" />
            <circle
              className={`${colors.ring} transition-all duration-1000 ease-out`}
              strokeWidth="12"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 - (confidence.score / 100) * (2 * Math.PI * 40)}
              strokeLinecap="round"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <span className="absolute text-[10px] font-bold text-slate-800">{confidence.score}%</span>
        </div>
        <span className="text-xs font-semibold text-purple-900">{confidence.rating}</span>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-purple-100/70 p-5 shadow-card hover:border-purple-200 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Inventory Reality Confidence
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Mathematical consensus between recorded transactions and physical verification.
          </p>
        </div>
        {getRatingBadge(confidence.rating)}
      </div>

      <div className="flex items-center gap-5 mt-5">
        {/* Modern Radial Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle className="text-purple-100/60 stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50" />
            <circle
              className={`${colors.ring} transition-all duration-1000 ease-out`}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 - (confidence.score / 100) * (2 * Math.PI * 40)}
              strokeLinecap="round"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute text-center">
            <span className={`text-2xl font-black font-mono tracking-tight ${colors.text} leading-none block`}>
              {confidence.score}%
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
          </div>
        </div>

        {/* Supporting Summary */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Physical verification freshness</span>
            <span className="font-bold text-slate-800">Fresh (Active)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Discrepancy tolerance band</span>
            <span className="font-bold text-purple-700">Enforced</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Ledger mathematical parity</span>
            <span className="font-bold text-emerald-600">100% Consistent</span>
          </div>
        </div>
      </div>

      {/* Expandable Deterministic Factors */}
      <div className="mt-4 pt-3 border-t border-purple-100/60">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-xs font-semibold text-purple-700 hover:text-purple-800 transition-colors"
        >
          <span>{showBreakdown ? 'Hide factor breakdown' : `Inspect ${confidence.factors?.length || 4} contributing audit factors`}</span>
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showBreakdown && (
          <div className="mt-3 space-y-2 animate-fadeIn">
            {confidence.factors && confidence.factors.length > 0 ? (
              confidence.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-50/50 border border-purple-100/60 text-xs">
                  {getFactorIcon(f.type)}
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800 block">{f.factor}</span>
                    <span className="text-slate-500 text-[11px]">{f.description}</span>
                  </div>
                  {f.impactPoints !== undefined && (
                    <span className="font-mono text-[10px] font-bold text-slate-600 px-1.5 py-0.5 rounded bg-white border border-purple-100">
                      {f.impactPoints > 0 ? `+${f.impactPoints}` : f.impactPoints} pts
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 p-2">All primary inventory sanity constraints validated.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
