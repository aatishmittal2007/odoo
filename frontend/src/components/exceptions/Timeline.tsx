import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal, ClipboardCheck, Clock } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  operation: string;
  referenceType: string;
  referenceId: string;
  source?: string;
  destination?: string;
  quantityChange: number;
  balanceAfter: number;
  notes?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  onSelectEvent?: (referenceType: string, referenceId: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ events, onSelectEvent }) => {
  const getEventIcon = (operation: string) => {
    switch (operation) {
      case 'RECEIPT':
        return <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />;
      case 'DELIVERY':
        return <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />;
      case 'TRANSFER_IN':
      case 'TRANSFER_OUT':
      case 'TRANSFER':
        return <ArrowLeftRight className="w-3.5 h-3.5 text-sky-600" />;
      case 'ADJUSTMENT':
        return <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />;
      case 'PHYSICAL_COUNT':
        return <ClipboardCheck className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getEventBadge = (operation: string) => {
    switch (operation) {
      case 'RECEIPT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DELIVERY':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'TRANSFER_IN':
      case 'TRANSFER_OUT':
      case 'TRANSFER':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'ADJUSTMENT':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'PHYSICAL_COUNT':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((e, index) => {
        const isDiscrepancy = e.operation === 'PHYSICAL_COUNT';

        return (
          <div key={e.id || index} className="relative group">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                isDiscrepancy
                  ? 'border-rose-500 ring-4 ring-rose-100'
                  : 'border-slate-300 group-hover:border-emerald-500 transition-colors'
              }`}
            >
              {getEventIcon(e.operation)}
            </div>

            {/* Event Card */}
            <div
              onClick={() => onSelectEvent?.(e.referenceType, e.referenceId)}
              className={`p-3.5 rounded-xl border transition-all ${
                isDiscrepancy
                  ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              } ${onSelectEvent ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {formatTime(e.timestamp)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {formatDate(e.timestamp)}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getEventBadge(
                      e.operation
                    )}`}
                  >
                    {e.operation.replace('_', ' ')} #{e.referenceId}
                  </span>
                </div>

                {/* Quantity Change */}
                <div className="text-right">
                  <span
                    className={`font-mono text-xs font-bold ${
                      e.quantityChange > 0
                        ? 'text-emerald-600'
                        : e.quantityChange < 0
                        ? 'text-rose-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {e.quantityChange > 0 ? `+${e.quantityChange}` : e.quantityChange}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono">
                    Bal: {e.balanceAfter}
                  </span>
                </div>
              </div>

              {/* Source & Destination */}
              {(e.source || e.destination) && (
                <div className="mt-1.5 text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                  {e.source && <span className="font-medium text-slate-700">{e.source}</span>}
                  {e.source && e.destination && <span className="text-slate-400">→</span>}
                  {e.destination && <span className="font-medium text-slate-800">{e.destination}</span>}
                </div>
              )}

              {/* Notes */}
              {e.notes && (
                <p className="mt-1 text-xs text-slate-500 italic bg-slate-50/60 px-2 py-1 rounded border border-slate-100">
                  "{e.notes}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
