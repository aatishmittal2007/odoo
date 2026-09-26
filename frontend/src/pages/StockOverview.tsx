import React, { useEffect, useState } from 'react';
import { Layers, Search, Warehouse as WarehouseIcon, MapPin, Package, RefreshCw } from 'lucide-react';
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Stock Availability by Location
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time physical bin allocation, reserved stock, and location-level balances across all facilities.
          </p>
        </div>

        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Filtered Total Units:</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {totalStockAcrossLocations.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product name, SKU, warehouse, or rack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>

        <select
          value={selectedWarehouse}
          onChange={(e) => {
            setSelectedWarehouse(e.target.value);
            setSelectedLocation('ALL');
          }}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
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
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Bins / Racks</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.rack ? `(Rack ${l.rack})` : ''}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={fetchStock}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stock Balances Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Warehouse Facility</th>
                <th className="py-3 px-4">Storage Location / Rack</th>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Available Stock</th>
                <th className="py-3 px-4 text-right">Reserved Stock</th>
                <th className="py-3 px-4">Last Physical Audit</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading bin balances...
                  </td>
                </tr>
              ) : balances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No stock balances recorded.
                  </td>
                </tr>
              ) : (
                balances.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {b.warehouse?.name}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{b.location?.name}</span>
                      </div>
                      {b.location?.rack && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Rack {b.location.rack} • Shelf {b.location.shelf || '1'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{b.product?.name}</div>
                      <span className="font-mono text-slate-400 text-[11px]">{b.product?.sku}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {b.product?.category?.name || 'Standard'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {b.quantity} {b.product?.uom}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {b.reservedQuantity} {b.product?.uom}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {b.lastVerifiedAt ? new Date(b.lastVerifiedAt).toLocaleDateString() : 'Pending count'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/products/${b.productId}`)}
                        className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
