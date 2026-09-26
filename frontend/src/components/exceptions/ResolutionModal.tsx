import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CheckCircle2, AlertCircle, Wrench } from 'lucide-react';

interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exceptionNumber: string;
  variance: number;
  productUom?: string;
  onResolve: (data: {
    rootCause: string;
    explanation?: string;
    correctiveAction?: string;
    resolutionNotes?: string;
  }) => Promise<void>;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  isOpen,
  onClose,
  exceptionNumber,
  variance,
  productUom = 'units',
  onResolve,
}) => {
  const [rootCause, setRootCause] = useState('Transfer error');
  const [explanation, setExplanation] = useState('17 units were found in Rack C. Location was not updated during transfer.');
  const [correctiveAction, setCorrectiveAction] = useState('ADJUST_INVENTORY');
  const [resolutionNotes, setResolutionNotes] = useState('Physical audit confirmed misplaced stock. Reconciling inventory balances to physical reality.');
  const [submitting, setSubmitting] = useState(false);

  const rootCauses = [
    'Transfer error',
    'Location error',
    'Counting error',
    'Receiving error',
    'Picking error',
    'Damaged stock',
    'Wrong location',
    'System/process error',
    'Unknown',
    'Other',
  ];

  const correctiveActions = [
    {
      id: 'ADJUST_INVENTORY',
      label: 'Adjust Inventory & Reconcile Balances',
      desc: `Post an adjustment to align system ledger with the verified physical count (${variance > 0 ? '+' : ''}${variance} ${productUom}).`,
    },
    {
      id: 'UPDATE_LOCATION',
      label: 'Update Physical Location Assignment',
      desc: 'Move misplaced inventory into correct system bin without changing total company stock.',
    },
    {
      id: 'CREATE_TRANSFER',
      label: 'Schedule Corrective Internal Transfer',
      desc: 'Create an immediate corrective transfer to shift items back to intended rack.',
    },
    {
      id: 'FOLLOWUP_TASK',
      label: 'Create Continuous Audit Follow-up Task',
      desc: 'Assign weekly cycle counts to this aisle for process enforcement.',
    },
    {
      id: 'MARK_RESOLVED',
      label: 'Mark Resolved (Administrative Dismissal)',
      desc: 'Accept current count difference as operational variance within tolerance.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCause) return;
    setSubmitting(true);
    try {
      await onResolve({
        rootCause,
        explanation,
        correctiveAction,
        resolutionNotes,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Close & Resolve Incident: ${exceptionNumber}`}
      subtitle="Complete human root-cause determination and initiate corrective actions"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Root Cause Taxonomy Dropdown */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Operational Root Cause Taxonomy <span className="text-rose-500">*</span>
          </label>
          <select
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            required
          >
            {rootCauses.map((rc) => (
              <option key={rc} value={rc}>
                {rc}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Categorize the operational failure to power continuous Process Health analytics.
          </p>
        </div>

        {/* Detailed Explanation */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Detailed Incident Explanation
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            placeholder="e.g. 17 units were found in Rack C. Location was not updated during transfer."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            required
          />
        </div>

        {/* Corrective Action Options */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Select Corrective Action
          </label>
          <div className="space-y-2">
            {correctiveActions.map((action) => (
              <label
                key={action.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  correctiveAction === action.id
                    ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="correctiveAction"
                  value={action.id}
                  checked={correctiveAction === action.id}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900">{action.label}</span>
                  <span className="block text-[11px] text-slate-600 mt-0.5">{action.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Resolution Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Closing Audit Notes
          </label>
          <input
            type="text"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Resolving...' : 'Resolve Exception & Apply Action'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
