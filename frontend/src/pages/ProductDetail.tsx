import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  MapPin,
  ShieldAlert,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  ScrollText,
  Clock,
  Warehouse as WarehouseIcon,
  RefreshCw,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Badge, getSeverityBadgeVariant, getStatusBadgeVariant } from '../components/common/Badge';
import { ConfidenceGauge } from '../components/common/ConfidenceGauge';
import { Modal } from '../components/common/Modal';

interface ProductDetailProps {
  id: string;
  navigate: (path: string) => void;
  onOpenCountModal: (productId?: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ id, navigate, onOpenCountModal }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editUom, setEditUom] = useState('units');
  const [editReorderLevel, setEditReorderLevel] = useState('20');
  const [editReorderQuantity, setEditReorderQuantity] = useState('20');
  const [editCostPrice, setEditCostPrice] = useState('0');
  const [editCountingPeriodDays, setEditCountingPeriodDays] = useState('30');
  const [editIsActive, setEditIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!product) return;
    setEditName(product.name);
    setEditSku(product.sku);
    setEditUom(product.uom);
    setEditReorderLevel(product.reorderLevel?.toString() || '20');
    setEditReorderQuantity((product.reorderQuantity ?? 20).toString());
    setEditCostPrice((product.costPrice ?? 0).toString());
    setEditCountingPeriodDays((product.countingPeriodDays ?? 30).toString());
    setEditIsActive(product.isActive !== false);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.put(`/products/${id}`, {
        name: editName,
        sku: editSku.toUpperCase(),
        uom: editUom,
        reorderLevel: parseFloat(editReorderLevel) || 10,
        reorderQuantity: parseFloat(editReorderQuantity) || 20,
        costPrice: parseFloat(editCostPrice) || 0,
        countingPeriodDays: parseInt(editCountingPeriodDays) || 30,
        isActive: editIsActive,
      });
      setIsEditModalOpen(false);
      fetchProduct();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete or archive product "${product?.name}"? If stock or ledger movements exist, it will be safely deactivated.`
      )
    )
      return;
    try {
      setLoading(true);
      await api.delete(`/products/${id}`);
      navigate('/products');
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to delete/archive product');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading && !product) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-500">
        Product not found.{' '}
        <button onClick={() => navigate('/products')} className="text-purple-600 font-bold underline">
          Return to catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        {/* Quick Operations Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-purple-100/80 hover:bg-purple-50 text-slate-800 rounded-xl text-xs font-semibold shadow-card transition-colors"
          >
            <Edit className="w-3.5 h-3.5 text-purple-600" />
            <span>Edit Product</span>
          </button>
          <button
            onClick={() => navigate('/receipts')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-purple-100/80 hover:bg-purple-50 text-slate-800 rounded-xl text-xs font-semibold shadow-card transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
            <span>Receive</span>
          </button>
          <button
            onClick={() => navigate('/deliveries')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-purple-100/80 hover:bg-purple-50 text-slate-800 rounded-xl text-xs font-semibold shadow-card transition-colors"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />
            <span>Deliver</span>
          </button>
          <button
            onClick={() => navigate('/transfers')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-purple-100/80 hover:bg-purple-50 text-slate-800 rounded-xl text-xs font-semibold shadow-card transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transfer</span>
          </button>
          <button
            onClick={() => navigate('/adjustments')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-purple-100/80 hover:bg-purple-50 text-slate-800 rounded-xl text-xs font-semibold shadow-card transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-600" />
            <span>Adjust</span>
          </button>
          <button
            onClick={() => onOpenCountModal(product.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Physical Count</span>
          </button>
          <button
            onClick={() => navigate(`/ledger?productId=${product.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-card transition-colors"
          >
            <ScrollText className="w-3.5 h-3.5 text-purple-300" />
            <span>View Ledger</span>
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-bold">
                {product.sku}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                {product.category?.name || 'General'}
              </span>
              {product.isActive === false ? (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 font-semibold font-mono">
                  Archived / Inactive
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-mono">
                  Active
                </span>
              )}
            </div>
            {product.description && <p className="text-xs text-slate-500 mt-2">{product.description}</p>}
          </div>

          <div className="flex items-center gap-6 text-right flex-wrap">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total System Stock</span>
              <span className="text-2xl font-bold font-mono text-slate-900">
                {product.totalStock} {product.uom}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Reorder Threshold</span>
              <span className="text-2xl font-bold font-mono text-slate-500">
                {product.reorderLevel} {product.uom}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Reorder Batch Qty</span>
              <span className="text-2xl font-bold font-mono text-purple-700">
                {product.reorderQuantity ?? 20} {product.uom}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Confidence + Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confidence Gauge */}
        <div>{product.confidence && <ConfidenceGauge confidence={product.confidence} />}</div>

        {/* Location Stock Breakdown */}
        <div className="lg:col-span-2 glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stock Availability by Warehouse & Location Bin
            </h3>
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
              {product.stockBalances?.length || 0} Storage Bins
            </span>
          </div>

          <div className="space-y-2">
            {product.stockBalances?.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">No storage bin allocations logged.</div>
            ) : (
              product.stockBalances?.map((b: any) => (
                <div
                  key={b.id}
                  className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white border border-purple-100 shadow-2xs">
                      <WarehouseIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">{b.warehouse?.name}</span>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                        <span>
                          Location: <strong className="text-slate-700">{b.location?.name}</strong>
                        </span>
                        {b.location?.rack && <span>• Rack {b.location.rack}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-slate-900">
                      {b.quantity} {product.uom}
                    </span>
                    {b.lastVerifiedAt && (
                      <span className="block text-[10px] text-slate-400 font-mono">
                        Verified {new Date(b.lastVerifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Open Exceptions for this product */}
      {product.exceptions?.length > 0 && (
        <div className="glass-card p-5 space-y-3 border-l-4 border-l-pink-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-pink-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-700">
                Active Discrepancy Exceptions ({product.exceptions.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('/exceptions')}
              className="text-xs text-pink-600 hover:text-pink-700 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {product.exceptions.map((ex: any) => (
              <div
                key={ex.id}
                onClick={() => navigate(`/exceptions/${ex.id}`)}
                className="p-3 bg-white border border-pink-100 hover:border-pink-300 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={getSeverityBadgeVariant(ex.severity)} size="sm">
                    {ex.severity}
                  </Badge>
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-pink-600 transition-colors">
                      {ex.exceptionNumber}
                    </span>
                    <span className="text-xs text-slate-500 ml-2 font-medium">{ex.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusBadgeVariant(ex.status)} size="sm">
                    {ex.status}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Movement Ledger Timeline */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Audit Trail & Transaction History ({product.ledgerEntries?.length || 0})
            </h3>
          </div>
          <button
            onClick={() => navigate(`/ledger?productId=${product.id}`)}
            className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
          >
            <span>Full Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Operation</th>
                <th className="py-2.5 px-3">Warehouse & Bin</th>
                <th className="py-2.5 px-3 text-right">Delta</th>
                <th className="py-2.5 px-3 text-right">Balance After</th>
                <th className="py-2.5 px-3">Reference / Notes</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {!product.ledgerEntries || product.ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No ledger transactions recorded for this product yet.
                  </td>
                </tr>
              ) : (
                product.ledgerEntries.slice(0, 10).map((l: any) => {
                  const isPositive = l.quantityChange > 0;
                  return (
                    <tr key={l.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{l.operation}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {l.warehouse?.name} / {l.location?.name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${l.quantityChange}` : l.quantityChange} {product.uom}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-semibold">
                        {l.balanceAfter} {product.uom}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {l.referenceType} ({l.referenceId?.slice(0, 8)})
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">
                        {new Date(l.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Product — ${product.name}`}
        subtitle="Update catalog specifications, reorder levels, cost price, and status"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono uppercase font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UoM</label>
              <input
                type="text"
                value={editUom}
                onChange={(e) => setEditUom(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Point</label>
              <input
                type="number"
                value={editReorderLevel}
                onChange={(e) => setEditReorderLevel(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Qty</label>
              <input
                type="number"
                value={editReorderQuantity}
                onChange={(e) => setEditReorderQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($)</label>
              <input
                type="number"
                step="any"
                value={editCostPrice}
                onChange={(e) => setEditCostPrice(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-800">
              Active Catalog Product
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Archive Product</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
              >
                {submitting ? 'Saving...' : 'Save Product Changes'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ProductDetail;
