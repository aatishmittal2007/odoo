import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Edit,
  Trash2,
  Archive,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Product, Category, Warehouse, Location } from '../types';
import { Badge, getSeverityBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface ProductsProps {
  navigate: (path: string) => void;
  initialLowStock?: boolean;
}

export const Products: React.FC<ProductsProps> = ({ navigate, initialLowStock = false }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filterLowStock, setFilterLowStock] = useState(initialLowStock);

  // New Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdUom, setNewProdUom] = useState('units');
  const [newProdReorder, setNewProdReorder] = useState('20');
  const [newProdReorderQty, setNewProdReorderQty] = useState('50');
  const [newProdWh, setNewProdWh] = useState('');
  const [newProdLoc, setNewProdLoc] = useState('');
  const [newProdInitialStock, setNewProdInitialStock] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUom, setEditUom] = useState('units');
  const [editReorderLevel, setEditReorderLevel] = useState('20');
  const [editReorderQuantity, setEditReorderQuantity] = useState('20');
  const [editCostPrice, setEditCostPrice] = useState('0');
  const [editCountingPeriodDays, setEditCountingPeriodDays] = useState('30');
  const [editIsActive, setEditIsActive] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('categoryId', selectedCategory);
      if (filterLowStock) params.append('lowStock', 'true');
      if (search.trim()) params.append('search', search.trim());

      const [prodRes, catRes, whRes] = await Promise.all([
        api.get(`/products?${params.toString()}`),
        api.get('/products/categories'),
        api.get('/warehouses'),
      ]);

      setProducts(prodRes.data);
      setCategories(catRes.data);
      setWarehouses(whRes.data);
      if (catRes.data[0] && !newProdCategory) setNewProdCategory(catRes.data[0].id);
      if (whRes.data[0] && !newProdWh) setNewProdWh(whRes.data[0].id);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, filterLowStock, search]);

  useEffect(() => {
    if (!newProdWh) return;
    api.get(`/warehouses/locations?warehouseId=${newProdWh}`).then((res) => {
      setLocations(res.data);
      if (res.data[0]) setNewProdLoc(res.data[0].id);
    });
  }, [newProdWh]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdSku || !newProdCategory) {
      setFormError('Name, SKU, and Category are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/products', {
        name: newProdName,
        sku: newProdSku.toUpperCase(),
        categoryId: newProdCategory,
        uom: newProdUom,
        reorderLevel: parseFloat(newProdReorder) || 20,
        reorderQuantity: parseFloat(newProdReorderQty) || 50,
        initialWarehouseId: newProdWh || undefined,
        initialLocationId: newProdLoc || undefined,
        initialStock: parseFloat(newProdInitialStock) || 0,
      });

      setIsModalOpen(false);
      setNewProdName('');
      setNewProdSku('');
      setNewProdInitialStock('0');
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditSku(p.sku);
    setEditCategory(p.categoryId || '');
    setEditUom(p.uom || 'units');
    setEditReorderLevel(p.reorderLevel?.toString() || '20');
    setEditReorderQuantity((p.reorderQuantity ?? 20).toString());
    setEditCostPrice((p.costPrice ?? 0).toString());
    setEditCountingPeriodDays((p.countingPeriodDays ?? 30).toString());
    setEditIsActive(p.isActive !== false);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await api.put(`/products/${editingProduct.id}`, {
        name: editName,
        sku: editSku.toUpperCase(),
        categoryId: editCategory || undefined,
        uom: editUom,
        reorderLevel: parseFloat(editReorderLevel) || 10,
        reorderQuantity: parseFloat(editReorderQuantity) || 20,
        costPrice: parseFloat(editCostPrice) || 0,
        countingPeriodDays: parseInt(editCountingPeriodDays) || 30,
        isActive: editIsActive,
      });

      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete or archive "${name}"? If stock transactions exist, the product will be safely marked as archived.`)) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to archive product');
    }
  };

  // Metrics
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const totalUnits = products.reduce((acc, p) => acc + (p.totalStock || 0), 0);
  const activeExceptionsCount = products.reduce((acc, p) => acc + (p.openExceptionsCount || 0), 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Master Catalog</h1>
              <p className="text-xs text-slate-500">
                Centralized registry with unit allocations, reorder rules, and operational reality scores.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh product list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active SKUs</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalProducts}</div>
          <div className="text-[11px] text-slate-400 mt-1">Catalog items tracked</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Low Stock SKUs</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{lowStockCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">At or below reorder threshold</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Total Units On-Hand</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">{totalUnits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all facilities & bins</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-pink-600">Incident Flags</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-pink-600 mt-2">{activeExceptionsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unresolved inventory exceptions</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white/80 border border-purple-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterLowStock
                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/20'
                : 'bg-white/80 text-slate-600 border-purple-100 hover:bg-purple-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Product Name & SKU</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Unit</th>
                <th className="py-3.5 px-4 font-semibold text-right">On-Hand Stock</th>
                <th className="py-3.5 px-4 font-semibold text-right">Reorder Threshold</th>
                <th className="py-3.5 px-4 font-semibold text-center">Open Exceptions</th>
                <th className="py-3.5 px-4 font-semibold text-center">Confidence</th>
                <th className="py-3.5 px-4 font-semibold text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading product inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {p.name}
                        </div>
                        {p.isActive === false && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            Archived
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-purple-900 bg-purple-50/80 px-1.5 py-0.2 rounded text-[10px] border border-purple-100/60 font-semibold">
                        {p.sku}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium text-[11px] border border-purple-100">
                        {p.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.uom}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      <span
                        className={
                          p.isLowStock
                            ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'
                            : ''
                        }
                      >
                        {p.totalStock} {p.uom}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {p.reorderLevel} {p.uom}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.openExceptionsCount > 0 ? (
                        <Badge variant={p.hasCriticalException ? 'critical' : 'high'} size="sm">
                          {p.openExceptionsCount} Active
                        </Badge>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          p.confidenceScore >= 85
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.confidenceScore >= 70
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.confidenceScore}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(p);
                          }}
                          className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${p.id}`);
                          }}
                          className="px-2.5 py-1 text-purple-700 hover:bg-purple-100/70 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Catalog Product"
        subtitle="Product definition, initial stock allocation, and reorder levels"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
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
                placeholder="e.g. Structural Steel Beams"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                placeholder="e.g. SB006"
                value={newProdSku}
                onChange={(e) => setNewProdSku(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono uppercase font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure (UoM)</label>
              <input
                type="text"
                placeholder="units, kg, meters"
                value={newProdUom}
                onChange={(e) => setNewProdUom(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Point</label>
              <input
                type="number"
                value={newProdReorder}
                onChange={(e) => setNewProdReorder(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Batch Qty</label>
              <input
                type="number"
                value={newProdReorderQty}
                onChange={(e) => setNewProdReorderQty(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                required
              />
            </div>
          </div>

          {/* Initial Stock Allocation */}
          <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-purple-900">
              Initial Stock Allocation & Facility Storage Bin
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse</label>
                <select
                  value={newProdWh}
                  onChange={(e) => setNewProdWh(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Location / Rack</label>
                <select
                  value={newProdLoc}
                  onChange={(e) => setNewProdLoc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Initial Stock Intake</label>
                <input
                  type="number"
                  step="any"
                  value={newProdInitialStock}
                  onChange={(e) => setNewProdInitialStock(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
            >
              {submitting ? 'Creating...' : 'Create Product & Log Initial Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          title={`Edit Product — ${editingProduct.name}`}
          subtitle="Update catalog specifications, reorder levels, cost price, and status"
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateProduct} className="space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure (UoM)</label>
                <input
                  type="text"
                  value={editUom}
                  onChange={(e) => setEditUom(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Threshold</label>
                <input
                  type="number"
                  value={editReorderLevel}
                  onChange={(e) => setEditReorderLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Batch Qty</label>
                <input
                  type="number"
                  value={editReorderQuantity}
                  onChange={(e) => setEditReorderQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono"
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
                  className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Count Cycle (Days)</label>
                <input
                  type="number"
                  value={editCountingPeriodDays}
                  onChange={(e) => setEditCountingPeriodDays(e.target.value)}
                  className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono"
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
                Active Catalog Product (uncheck to deactivate/archive)
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => handleDeleteProduct(editingProduct.id, editingProduct.name)}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive Product</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                  }}
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
      )}
    </div>
  );
};
export default Products;
