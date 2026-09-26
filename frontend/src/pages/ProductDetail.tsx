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
    if (!confirm(`Are you sure you want to delete or archive product "${product?.name}"? If stock or ledger movements exist, it will be safely deactivated.`)) return;
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
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-500">
        Product not found.{' '}
        <button onClick={() => navigate('/products')} className="text-emerald-600 font-bold underline">
          Return to catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </button>

        {/* Section 24 Actions Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Edit className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit Product</span>
          </button>
          <button
            onClick={() => navigate('/receipts')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
            <span>Receive</span>
          </button>
          <button
            onClick={() => navigate('/deliveries')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-600" />
            <span>Deliver</span>
          </button>
          <button
            onClick={() => navigate('/transfers')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-600" />
            <span>Transfer</span>
          </button>
          <button
            onClick={() => navigate('/adjustments')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />
            <span>Adjust</span>
          </button>
          <button
            onClick={() => onOpenCountModal(product.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Count</span>
          </button>
          <button
            onClick={() => navigate(`/ledger?productId=${product.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>View Ledger</span>
          </button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
              <span className="font-mono text-sm px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                {product.sku}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                {product.category?.name}
              </span>
              {product.isActive === false ? (
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-semibold font-mono">
                  Archived / Inactive
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-mono">
                  Active
                </span>
              )}
            </div>
            {product.description && <p className="text-xs text-slate-500 mt-1">{product.description}</p>}
          </div>

          <div className="flex items-center gap-4 text-right flex-wrap">
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
              <span className="text-2xl font-bold font-mono text-slate-700">
                {product.reorderQuantity ?? 20} {product.uom}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Confidence + Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confidence Gauge */}
        <div>
          {product.confidence && <ConfidenceGauge confidence={product.confidence} />}
        </div>

        {/* Location Stock Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stock Availability by Warehouse & Location
            </h3>
            <span className="text-xs font-mono font-bold text-slate-700">
              {product.stockBalances?.length || 0} Storage Bins
            </span>
          </div>

          <div className="space-y-2">
            {product.stockBalances?.map((b: any) => (
              <div
                key={b.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <WarehouseIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{b.warehouse?.name}</span>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                      <span>Location: <strong>{b.location?.name}</strong></span>
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
            ))}
          </div>
        </div>
      </div>

      {/* Open Exceptions for this product */}
      {product.exceptions?.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-950">
              Active Unresolved Exceptions ({product.exceptions.length})
            </h3>
          </div>
          <div className="space-y-2">
            {product.exceptions.map((exc: any) => (
              <div
                key={exc.id}
                onClick={() => navigate(`/exceptions/${exc.id}`)}
                className="p-3 bg-rose-50/50 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Badge variant={getSeverityBadgeVariant(exc.severity)} size="sm">
                    {exc.severity}
                  </Badge>
                  <span className="font-mono font-bold text-slate-900">{exc.exceptionNumber}</span>
                  <span className="text-slate-700">{exc.notes}</span>
                </div>
                <button className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold">
                  Inspect →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Grid: Physical Count History & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Count History */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Physical Verification History
            </h3>
            <button
              onClick={() => onOpenCountModal(product.id)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              + Record Count
            </button>
          </div>

          <div className="space-y-2">
            {product.physicalCounts?.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No physical counts recorded yet.</p>
            ) : (
              product.physicalCounts?.map((c: any) => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{c.countNumber}</span>
                      <span className="text-slate-500">• {c.location?.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(c.countedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900">
                      Physical: {c.physicalQuantity} (Sys: {c.systemQuantity})
                    </span>
                    <span
                      className={`block font-mono text-[11px] font-bold ${
                        c.variance !== 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      Variance: {c.variance > 0 ? `+${c.variance}` : c.variance} ({c.variancePercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Ledger Movements */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Ledger Moves
            </h3>
            <button
              onClick={() => navigate(`/ledger?productId=${product.id}`)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View Full Ledger →
            </button>
          </div>

          <div className="space-y-2">
            {product.recentMovements?.map((m: any) => (
              <div
                key={m.id}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{m.operation}</span>
                    <span className="font-mono text-slate-400">#{m.referenceId}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold ${
                      m.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-mono">
                    Bal: {m.balanceAfter}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Product — ${product.name}`}
        subtitle="Update product parameters, thresholds, cost price, and active status"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={editSku}
                onChange={(e) => setEditSku(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure (UoM)</label>
              <input
                type="text"
                value={editUom}
                onChange={(e) => setEditUom(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Threshold</label>
              <input
                type="number"
                value={editReorderLevel}
                onChange={(e) => setEditReorderLevel(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Batch Qty</label>
              <input
                type="number"
                value={editReorderQuantity}
                onChange={(e) => setEditReorderQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Count Cycle (Days)</label>
              <input
                type="number"
                value={editCountingPeriodDays}
                onChange={(e) => setEditCountingPeriodDays(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="editIsActiveDetail"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="editIsActiveDetail" className="text-xs font-semibold text-slate-800">
              Active Product in Catalog (uncheck to deactivate/archive)
            </label>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Archive / Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
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
