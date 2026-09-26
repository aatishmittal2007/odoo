import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Info, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { ConfidenceData, ConfidenceFactor } from '../../types';

interface ConfidenceGaugeProps {
  confidence: ConfidenceData;
  compact?: boolean;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence, compact = false }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 stroke-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 stroke-amber-600 bg-amber-50 border-amber-200';
    if (score >= 50) return 'text-orange-600 stroke-orange-600 bg-orange-50 border-orange-200';
    return 'text-rose-600 stroke-rose-600 bg-rose-50 border-rose-200';
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" /> High Integrity
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <ShieldAlert className="w-3.5 h-3.5" /> Moderate Risk
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            <ShieldAlert className="w-3.5 h-3.5" /> Low Reliability
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <ShieldX className="w-3.5 h-3.5" /> Critical Attention
          </span>
        );
    }
  };

  const getFactorIcon = (type: ConfidenceFactor['type']) => {
    switch (type) {
      case 'POSITIVE':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'CRITICAL':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
    }
  };

  // SVG Gauge calculations
  const strokeWidth = 8;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence.score / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-200 stroke-current"
              strokeWidth="12"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className={`${getScoreColor(confidence.score).split(' ')[1]} transition-all duration-1000 ease-out`}
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
        <span className="text-xs font-medium text-slate-600">{confidence.rating}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Inventory Reality Confidence
            </h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-xs rounded shadow-lg z-20">
                Transparent deterministic operational reliability indicator based on verification recency, active exceptions, and balance health.
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent scoring engine • Not a black-box ML prediction
          </p>
        </div>
        {getRatingBadge(confidence.rating)}
      </div>

      <div className="mt-4 flex items-center gap-6">
        {/* Radial Meter */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-slate-100 stroke-current"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
            />
            <circle
              className={`${getScoreColor(confidence.score).split(' ')[1]} transition-all duration-1000 ease-out`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {confidence.score}%
            </span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Score</span>
          </div>
        </div>

        {/* Summary Description & Toggle */}
        <div className="flex-1">
          <p className="text-sm text-slate-700 leading-snug">
            {confidence.description}
          </p>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            {showBreakdown ? 'Hide factor breakdown' : 'Why this score? (Explainable factors)'}
            {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Itemized factor breakdown */}
      {showBreakdown && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 animate-fadeIn">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Deterministic Scoring Breakdown
          </h4>
          <div className="space-y-2">
            {confidence.factors.map((f, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 text-xs p-2 rounded-lg bg-slate-50 border border-slate-150"
              >
                <div className="flex items-start gap-2.5">
                  {getFactorIcon(f.type)}
                  <div>
                    <span className="font-semibold text-slate-800">{f.factor}: </span>
                    <span className="text-slate-600">{f.description}</span>
                  </div>
                </div>
                <span
                  className={`font-mono font-bold shrink-0 ${
                    f.impactPoints > 0
                      ? 'text-emerald-600'
                      : f.impactPoints < 0
                      ? 'text-rose-600'
                      : 'text-slate-400'
                  }`}
                >
                  {f.impactPoints > 0 ? `+${f.impactPoints}` : f.impactPoints === 0 ? '0' : f.impactPoints} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
