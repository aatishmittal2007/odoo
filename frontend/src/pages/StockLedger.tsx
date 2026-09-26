import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  User as UserIcon,
  Tag,
  Hash,
} from 'lucide-react';
import api from '../services/api';
import { StockLedgerEntry } from '../types';
import { Modal } from '../components/common/Modal';

export const StockLedger: React.FC = () => {
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [operationFilter, setOperationFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected entry for modal view
  const [selectedEntry, setSelectedEntry] = useState<StockLedgerEntry | null>(null);

  const fetchLedger = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (operationFilter !== 'ALL') params.append('operation', operationFilter);
      if (search.trim()) params.append('search', search.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', targetPage.toString());
      params.append('pageSize', pageSize.toString());

      const res = await api.get(`/inventory/ledger?${params.toString()}`);
      setEntries(res.data.entries || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchLedger(1);
  }, [operationFilter, search, startDate, endDate, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchLedger(newPage);
  };

  const handleClearFilters = () => {
    setSearch('');
    setOperationFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const operations = [
    { value: 'ALL', label: 'All Operations' },
    { value: 'RECEIPT', label: 'Receipts (+)' },
    { value: 'DELIVERY', label: 'Deliveries (-)' },
    { value: 'TRANSFER_IN', label: 'Transfer In (+)' },
    { value: 'TRANSFER_OUT', label: 'Transfer Out (-)' },
    { value: 'ADJUSTMENT', label: 'Adjustments' },
    { value: 'COUNT_RECONCILE', label: 'Physical Reconciliation' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ScrollText className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Double-Sided Stock Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete, immutable audit trail. Every inventory balance modification generates an auditable debit/credit event.
          </p>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1.5 bg-slate-900 text-white rounded-lg self-start sm:self-auto">
          {total} Total Ledger Entries
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU, reference # (R102, T208), location, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>

        <select
          value={operationFilter}
          onChange={(e) => setOperationFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
        >
          {operations.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Start Date"
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="End Date"
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {(search || operationFilter !== 'ALL' || startDate || endDate) && (
          <button
            onClick={handleClearFilters}
            className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-medium transition-colors"
          >
            Clear
          </button>
        )}

        <button
          onClick={() => fetchLedger(page)}
          title="Refresh"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4 font-mono">Reference</th>
                <th className="py-3 px-4">Source Location</th>
                <th className="py-3 px-4">Destination Location</th>
                <th className="py-3 px-4 text-right">Quantity Change</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4">Auditor / User</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading Stock Ledger transactions...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No ledger transactions match criteria.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {new Date(entry.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {entry.product?.name}
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{entry.sku}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-800">{entry.operation}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {entry.referenceId}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {entry.sourceName || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {entry.destName || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      <span
                        className={
                          entry.quantityChange > 0
                            ? 'text-emerald-600'
                            : entry.quantityChange < 0
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }
                      >
                        {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {entry.balanceAfter}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {entry.user?.name || 'System / Auto'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800"
                        title="View transaction details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-900">{entries.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-900">{Math.min(page * pageSize, total)}</span> of{' '}
            <span className="font-bold text-slate-900">{total}</span> ledger entries
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title={`Ledger Transaction ${selectedEntry.referenceId}`}
          subtitle="Double-sided immutable ledger record and balance snapshot"
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Top Badge & Metric */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Operation</span>
                <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                  {selectedEntry.operation}
                </span>
                <span className="text-xs text-slate-500">Reference: {selectedEntry.referenceType} #{selectedEntry.referenceId}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Quantity Delta</span>
                <span
                  className={`text-2xl font-bold font-mono ${
                    selectedEntry.quantityChange > 0
                      ? 'text-emerald-600'
                      : selectedEntry.quantityChange < 0
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {selectedEntry.quantityChange > 0 ? `+${selectedEntry.quantityChange}` : selectedEntry.quantityChange}{' '}
                  <span className="text-xs font-normal text-slate-500">{selectedEntry.product?.uom || ''}</span>
                </span>
                <span className="text-xs font-mono text-slate-600 block mt-0.5">
                  Balance After: <span className="font-bold text-slate-900">{selectedEntry.balanceAfter}</span> {selectedEntry.product?.uom || ''}
                </span>
              </div>
            </div>

            {/* Product & Movement Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Product</span>
                <div className="font-bold text-slate-900">{selectedEntry.product?.name}</div>
                <div className="font-mono text-slate-500">SKU: {selectedEntry.sku}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Timestamp</span>
                <div className="font-mono text-slate-800">
                  {new Date(selectedEntry.timestamp).toLocaleString([], {
                    dateStyle: 'full',
                    timeStyle: 'medium',
                  })}
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Source Location</span>
                <div className="font-semibold text-slate-800">{selectedEntry.sourceName || 'External / Opening Balance'}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Destination Location</span>
                <div className="font-semibold text-slate-800">{selectedEntry.destName || 'External / Consumed'}</div>
              </div>
            </div>

            {/* Auditor / Operator */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Audited / Executed By</span>
              <div className="flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-900">{selectedEntry.user?.name || 'System Auto Engine'}</span>
                {selectedEntry.user?.email && (
                  <span className="text-slate-500 font-mono">({selectedEntry.user.email})</span>
                )}
              </div>
            </div>

            {/* Notes / Reason */}
            {selectedEntry.notes && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Audit Log Notes & Rationale</span>
                <p className="text-slate-700 font-medium">{selectedEntry.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
