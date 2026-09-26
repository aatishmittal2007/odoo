import React, { useState } from 'react';
import { FileText, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, SlidersHorizontal, ClipboardCheck, ExternalLink } from 'lucide-react';
import { ExceptionEvidence } from '../../types';
import { Modal } from '../common/Modal';

interface EvidencePanelProps {
  evidence: ExceptionEvidence[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<ExceptionEvidence | null>(null);

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'RECEIPT':
        return <ArrowDownToLine className="w-4 h-4 text-emerald-600" />;
      case 'DELIVERY':
        return <ArrowUpFromLine className="w-4 h-4 text-amber-600" />;
      case 'TRANSFER':
        return <ArrowLeftRight className="w-4 h-4 text-sky-600" />;
      case 'ADJUSTMENT':
        return <SlidersHorizontal className="w-4 h-4 text-orange-600" />;
      case 'PHYSICAL_COUNT':
        return <ClipboardCheck className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  const getMetadata = (item: ExceptionEvidence) => {
    if (!item.metadataJson) return null;
    try {
      return JSON.parse(item.metadataJson);
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Documentary Evidence & Transactions ({evidence.length})
        </h4>
        <span className="text-[11px] text-slate-400">Click any record to inspect audit log</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {evidence.map((item) => {
          const meta = getMetadata(item);

          return (
            <div
              key={item.id}
              onClick={() => setSelectedEvidence(item)}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition-all shadow-2xs group flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200/60 transition-colors shrink-0 mt-0.5">
                  {getEvidenceIcon(item.referenceType)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {item.referenceType} #{item.referenceId}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{item.title}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {meta?.quantityChange !== undefined && (
                <span
                  className={`text-xs font-mono font-bold shrink-0 ${
                    meta.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {meta.quantityChange > 0 ? `+${meta.quantityChange}` : meta.quantityChange}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Inspect Evidence Modal */}
      <Modal
        isOpen={Boolean(selectedEvidence)}
        onClose={() => setSelectedEvidence(null)}
        title={`Audit Inspection: ${selectedEvidence?.referenceType} #${selectedEvidence?.referenceId}`}
        subtitle={`Recorded on ${selectedEvidence ? new Date(selectedEvidence.timestamp).toLocaleString() : ''}`}
      >
        {selectedEvidence && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Title / Descriptor</span>
              <p className="text-sm font-semibold text-slate-900 mt-1">{selectedEvidence.title}</p>
            </div>

            {selectedEvidence.metadataJson && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                  Transaction Metadata Payload
                </span>
                <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                  <pre>{JSON.stringify(JSON.parse(selectedEvidence.metadataJson), null, 2)}</pre>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
