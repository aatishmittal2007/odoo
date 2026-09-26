import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Search, Filter, AlertTriangle, ArrowRight, ShieldCheck, Edit, Trash2, Archive } from 'lucide-react';
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
        reorderLevel: parseFloat(newProdReorder) || 10,
        reorderQuantity: parseFloat(newProdReorderQty) || 20,
        warehouseId: newProdWh,
        locationId: newProdLoc,
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
    setEditCategory(p.categoryId);
    setEditUom(p.uom);
    setEditReorderLevel(p.reorderLevel.toString());
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
        categoryId: editCategory,
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

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete or archive "${productName}"? If stock or ledger movements exist, it will be safely deactivated.`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.delete(`/products/${productId}`);
      alert(res.data.message || 'Product updated');
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to delete/archive product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Product Master & Stock Registry
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise product catalogue with unit allocations, reorder rules, and operational confidence scores.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            filterLowStock
              ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400/20'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">On-Hand Stock</th>
                <th className="py-3 px-4 text-right">Reorder Threshold</th>
                <th className="py-3 px-4 text-center">Open Exceptions</th>
                <th className="py-3 px-4 text-center">Confidence</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading product inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}`)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </div>
                        {p.isActive === false && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                            Archived
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{p.sku}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.uom}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      <span className={p.isLowStock ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200' : ''}>
                        {p.totalStock} {p.uom}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {p.reorderLevel} {p.uom}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.openExceptionsCount > 0 ? (
                        <Badge variant={p.hasCriticalException ? 'critical' : 'high'} size="sm">
                          {p.openExceptionsCount} Active
                        </Badge>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(p);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${p.id}`);
                          }}
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold transition-colors"
                        >
                          Manage →
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
        subtitle="Step 1 — Product definition, initial stock allocation, and reorder levels"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
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
                placeholder="e.g. Structural Steel Beams"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono uppercase font-bold"
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                placeholder="e.g. kg, units, meters"
                value={newProdUom}
                onChange={(e) => setNewProdUom(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Threshold</label>
              <input
                type="number"
                value={newProdReorder}
                onChange={(e) => setNewProdReorder(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Batch Qty</label>
              <input
                type="number"
                value={newProdReorderQty}
                onChange={(e) => setNewProdReorderQty(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Initial Stock Allocation */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Initial Stock Allocation & Storage Location
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Warehouse</label>
                <select
                  value={newProdWh}
                  onChange={(e) => setNewProdWh(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Location / Rack</label>
                <select
                  value={newProdLoc}
                  onChange={(e) => setNewProdLoc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
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
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                <input
                  type="number"
                  step="any"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
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
                id="editIsActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-800">
                Active Product in Catalog (uncheck to deactivate/archive)
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteProduct(editingProduct.id, editingProduct.name)}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive / Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                  }}
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
      )}
    </div>
  );
};
