import React, { useEffect, useState } from 'react';
import {
  Layers,
  Search,
  Warehouse as WarehouseIcon,
  MapPin,
  Package,
  RefreshCw,
  Building2,
  Calendar,
  ArrowRight,
  Boxes,
  ShieldCheck,
} from 'lucide-react';
import api from '../services/api';
import { StockBalance, Warehouse, Location } from '../types';

interface StockOverviewProps {
  navigate: (path: string) => void;
}

export const StockOverview: React.FC<StockOverviewProps> = ({ navigate }) => {
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedWarehouse !== 'ALL') params.append('warehouseId', selectedWarehouse);
      if (selectedLocation !== 'ALL') params.append('locationId', selectedLocation);
      if (search.trim()) params.append('search', search.trim());

      const [stockRes, whRes] = await Promise.all([
        api.get(`/inventory/stock?${params.toString()}`),
        api.get('/warehouses'),
      ]);

      setBalances(stockRes.data);
      setWarehouses(whRes.data);
    } catch (err) {
      console.error('Failed to load stock balances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [selectedWarehouse, selectedLocation, search]);

  useEffect(() => {
    if (selectedWarehouse === 'ALL') {
      setLocations([]);
      return;
    }
    api.get(`/warehouses/locations?warehouseId=${selectedWarehouse}`).then((res) => {
      setLocations(res.data);
    });
  }, [selectedWarehouse]);

  const totalStockAcrossLocations = balances.reduce((sum, b) => sum + b.quantity, 0);
  const totalBinsCount = balances.length;
  const uniqueProductsCount = new Set(balances.map((b) => b.productId)).size;

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Availability by Location</h1>
              <p className="text-xs text-slate-500">
                Multi-facility bin allocation, reserved stock, and physical location balances.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStock}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh stock levels"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Total Units Filtered</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">
            {totalStockAcrossLocations.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Available across selected bins</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Storage Bins</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalBinsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Racks & storage locations with stock</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Unique SKUs</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{uniqueProductsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Distinct catalog products stored</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Facilities Tracked</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{warehouses.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Warehouses configured in system</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product name, SKU, warehouse, or rack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-purple-50/40 border border-purple-100 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium text-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={selectedWarehouse}
            onChange={(e) => {
              setSelectedWarehouse(e.target.value);
              setSelectedLocation('ALL');
            }}
            className="px-3 py-2 bg-white/80 border border-purple-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>

          {locations.length > 0 && (
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-white/80 border border-purple-100 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="ALL">All Bins / Racks</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.rack ? `(Rack ${l.rack})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Stock Balances Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-50/50 text-slate-500 uppercase font-semibold border-b border-purple-100/60 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Warehouse Facility</th>
                <th className="py-3.5 px-4 font-semibold">Storage Location / Rack</th>
                <th className="py-3.5 px-4 font-semibold">Product Name & SKU</th>
                <th className="py-3.5 px-4 font-semibold text-right">Physical On-Hand</th>
                <th className="py-3.5 px-4 font-semibold text-right">Reserved Stock</th>
                <th className="py-3.5 px-4 font-semibold text-right">Available for Dispatch</th>
                <th className="py-3.5 px-4 font-semibold text-right">Last Verified Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                    Loading physical location balances...
                  </td>
                </tr>
              ) : balances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No stock recorded in selected storage bins.
                  </td>
                </tr>
              ) : (
                balances.map((b) => {
                  const available = b.quantity - b.reservedQuantity;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/products/${b.productId}`)}
                      className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700">
                            {b.warehouse?.code?.charAt(0) || 'W'}
                          </div>
                          <span className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                            {b.warehouse?.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{b.location?.name}</div>
                        {b.location?.rack && (
                          <span className="text-[11px] text-slate-400">Rack: {b.location.rack}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{b.product?.name}</div>
                        <span className="font-mono text-purple-900 bg-purple-50/80 px-1.5 py-0.2 rounded text-[10px] border border-purple-100/60 font-semibold">
                          {b.product?.sku}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {b.quantity} {b.product?.uom || 'units'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {b.reservedQuantity} {b.product?.uom || 'units'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-700">
                        {available} {b.product?.uom || 'units'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {b.lastVerifiedAt ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(b.lastVerifiedAt).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-sans">Pending initial audit</span>
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
export default StockOverview;
