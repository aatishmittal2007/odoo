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
  Boxes,
  CheckCircle2,
  ShieldCheck,
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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Double-Sided Stock Ledger</h1>
              <p className="text-xs text-slate-500">
                Immutable chronological event trail. Every balance change produces an audited transaction.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLedger(page)}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <div className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-mono font-bold shadow-card flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>{total.toLocaleString()} Immutable Records</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU, product, reference # (REC-01, DEL-02), or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <select
          value={operationFilter}
          onChange={(e) => setOperationFilter(e.target.value)}
          className="px-3 py-2 bg-white/80 border border-purple-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          {operations.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white/80 px-2.5 py-1 rounded-xl border border-purple-100">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Start Date"
            className="bg-transparent text-xs font-mono text-slate-700 focus:outline-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="End Date"
            className="bg-transparent text-xs font-mono text-slate-700 focus:outline-none"
          />
        </div>

        {(search || operationFilter !== 'ALL' || startDate || endDate) && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-medium transition-colors border border-rose-200"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Ledger Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                <th className="py-3.5 px-4 font-semibold">Product / SKU</th>
                <th className="py-3.5 px-4 font-semibold">Operation</th>
                <th className="py-3.5 px-4 font-semibold font-mono">Reference</th>
                <th className="py-3.5 px-4 font-semibold">Source Facility</th>
                <th className="py-3.5 px-4 font-semibold">Target Facility</th>
                <th className="py-3.5 px-4 font-semibold text-right">Quantity Delta</th>
                <th className="py-3.5 px-4 font-semibold text-right">Balance After</th>
                <th className="py-3.5 px-4 font-semibold">Authorized By</th>
                <th className="py-3.5 px-4 font-semibold text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading Stock Ledger transactions...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No ledger transactions match the search criteria.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isPositive = entry.quantityChange > 0;
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {new Date(entry.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {entry.product?.name}
                        </div>
                        <span className="font-mono text-purple-900 bg-purple-50/80 px-1.5 py-0.2 rounded text-[10px] border border-purple-100/60 font-semibold">
                          {entry.product?.sku}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-purple-100 text-[11px] shadow-2xs">
                          {entry.operation}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-900 font-bold">
                        {entry.referenceType} ({entry.referenceId?.slice(0, 8)})
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-800">{entry.sourceName || 'External Intake'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-800">{entry.destName || 'Storage Bin'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPositive ? `+${entry.quantityChange}` : entry.quantityChange} {entry.product?.uom || 'units'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {entry.balanceAfter} {entry.product?.uom || 'units'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.user?.name || 'System Automated'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntry(entry);
                          }}
                          className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Inspect Transaction Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-purple-100/60 bg-purple-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-bold text-slate-900">{entries.length}</span> of{' '}
            <span className="font-bold text-slate-900">{total}</span> total ledger movements
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-purple-100 bg-white hover:bg-purple-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-semibold px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-purple-100 bg-white hover:bg-purple-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title={`Ledger Transaction — ${selectedEntry.operation}`}
          subtitle={`Event ID: ${selectedEntry.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Product</span>
                <span className="font-bold text-slate-900">{selectedEntry.product?.name}</span>
                <span className="text-purple-700 font-mono block">SKU: {selectedEntry.product?.sku}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity Delta</span>
                <span
                  className={`font-mono text-base font-bold ${
                    selectedEntry.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {selectedEntry.quantityChange > 0 ? `+${selectedEntry.quantityChange}` : selectedEntry.quantityChange}{' '}
                  {selectedEntry.product?.uom}
                </span>
                <span className="text-slate-500 font-mono block">Balance After: {selectedEntry.balanceAfter}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Source Facility / Vendor</span>
                <span className="font-semibold text-slate-800">{selectedEntry.sourceName || 'External Intake'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination Facility / Customer</span>
                <span className="font-semibold text-slate-800">{selectedEntry.destName || 'Direct Storage'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Reference Entity</span>
                <span className="font-mono text-purple-900 font-bold">
                  {selectedEntry.referenceType} ({selectedEntry.referenceId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorized By</span>
                <span className="font-semibold text-slate-800">{selectedEntry.user?.name || 'System Actor'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Raw Audit Metadata</span>
              <pre className="p-3 bg-slate-950 text-purple-300 rounded-xl text-[11px] font-mono overflow-x-auto">
                {selectedEntry.notes
                  ? JSON.stringify({ notes: selectedEntry.notes, sku: selectedEntry.sku, operation: selectedEntry.operation, referenceId: selectedEntry.referenceId }, null, 2)
                  : JSON.stringify(selectedEntry, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Close Transaction
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default StockLedger;
