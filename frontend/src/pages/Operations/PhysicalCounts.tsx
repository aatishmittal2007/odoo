import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Plus, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { PhysicalCount } from '../../types';

interface PhysicalCountsProps {
  onOpenCountModal: () => void;
  navigate: (path: string) => void;
}

export const PhysicalCounts: React.FC<PhysicalCountsProps> = ({ onOpenCountModal, navigate }) => {
  const [counts, setCounts] = useState<PhysicalCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory/physical-counts');
      setCounts(res.data);
    } catch (err) {
      console.error('Failed to load physical counts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Physical Verification Counts & Audit Logs
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 8 — Physical verification. Recording counts does NOT silently overwrite ledger balances; variances trigger discrepancy exceptions automatically.
          </p>
        </div>

        <button
          onClick={onOpenCountModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Physical Count</span>
        </button>
      </div>

      {/* Counts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Count Number</th>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Warehouse & Rack</th>
                <th className="py-3 px-4 text-right">System Recorded</th>
                <th className="py-3 px-4 text-right">Physical Count</th>
                <th className="py-3 px-4 text-right">Variance Units</th>
                <th className="py-3 px-4 text-right">Variance %</th>
                <th className="py-3 px-4">Audited At</th>
                <th className="py-3 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading count history...
                  </td>
                </tr>
              ) : counts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No physical count audits recorded. Click "Record Physical Count" to perform one.
                  </td>
                </tr>
              ) : (
                counts.map((c) => {
                  const hasDiscrepancy = c.variance !== 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {c.countNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.product?.name}</div>
                        <span className="font-mono text-slate-400 text-[11px]">{c.product?.sku}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.warehouse?.name} / {c.location?.name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {c.systemQuantity} {c.product?.uom}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {c.physicalQuantity} {c.product?.uom}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            c.variance === 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }
                        >
                          {c.variance > 0 ? `+${c.variance}` : c.variance} {c.product?.uom}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            c.variance === 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }
                        >
                          {c.variancePercentage > 0 ? `+${c.variancePercentage.toFixed(1)}` : c.variancePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(c.countedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        {c.status === 'RECONCILED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Reconciled
                          </span>
                        ) : hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Discrepancy Flagged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Verified Match
                          </span>
                        )}
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
  );
};
