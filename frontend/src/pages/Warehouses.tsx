import React, { useEffect, useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Boxes,
  ShieldAlert,
  Plus,
  ArrowRight,
  RefreshCw,
  Building2,
  Layers,
  MapPinned,
} from 'lucide-react';
import api from '../services/api';
import { Warehouse } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

interface WarehousesProps {
  navigate: (path: string) => void;
}

export const Warehouses: React.FC<WarehousesProps> = ({ navigate }) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for New Warehouse
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal State for New Location
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [targetWhId, setTargetWhId] = useState('');
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locRack, setLocRack] = useState('');
  const [locShelf, setLocShelf] = useState('');
  const [submittingLocation, setSubmittingLocation] = useState(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whCode || !whName) return;
    setSubmitting(true);
    try {
      await api.post('/warehouses', {
        code: whCode.toUpperCase(),
        name: whName,
        address: whAddress,
      });
      setIsModalOpen(false);
      setWhCode('');
      setWhName('');
      setWhAddress('');
      fetchWarehouses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddLocation = (warehouseId: string) => {
    setTargetWhId(warehouseId);
    setLocName('');
    setLocCode('');
    setLocRack('');
    setLocShelf('');
    setIsLocationModalOpen(true);
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWhId || !locName || !locCode) return;
    setSubmittingLocation(true);
    try {
      await api.post('/warehouses/locations', {
        warehouseId: targetWhId,
        name: locName,
        code: locCode.toUpperCase(),
        rack: locRack || undefined,
        shelf: locShelf || undefined,
      });
      setIsLocationModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create location');
    } finally {
      setSubmittingLocation(false);
    }
  };

  const totalFacilities = warehouses.length;
  const totalLocations = warehouses.reduce((sum, w) => sum + (w.locations?.length || 0), 0);
  const totalStockAllWh = warehouses.reduce((sum, w) => sum + (w.totalStockQuantity || 0), 0);
  const totalExceptionsAllWh = warehouses.reduce((sum, w) => sum + (w.openExceptionsCount || 0), 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-sm shadow-purple-600/10">
              <WarehouseIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Multi-Warehouse Facilities</h1>
              <p className="text-xs text-slate-500">
                Logistics hubs, storage racks, and isolated physical inventory bins.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchWarehouses}
            disabled={loading}
            className="p-2.5 rounded-xl border border-purple-100/80 bg-white/80 hover:bg-purple-50/60 text-slate-600 hover:text-purple-700 transition-colors shadow-card"
            title="Refresh facilities"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse Facility</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Facilities</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{totalFacilities}</div>
          <div className="text-[11px] text-slate-400 mt-1">Configured distribution nodes</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Storage Bins & Racks</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 mt-2">{totalLocations}</div>
          <div className="text-[11px] text-slate-400 mt-1">Internal pick & pack locations</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total System Units</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {totalStockAllWh.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all active facilities</div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-pink-600">Facility Exceptions</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-pink-600 mt-2">{totalExceptionsAllWh}</div>
          <div className="text-[11px] text-slate-400 mt-1">Discrepancies under audit</div>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="glass-card p-5 space-y-4 hover:border-purple-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{wh.name}</h3>
                    {wh.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-purple-800 font-bold block mt-0.5">
                    {wh.code}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shadow-2xs">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
              </div>

              {wh.address && <p className="text-xs text-slate-500 leading-relaxed">{wh.address}</p>}

              {/* Facility Metrics Trio */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-purple-100/70 text-center">
                <div className="p-2 bg-purple-50/50 rounded-xl border border-purple-100/60">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Locations</span>
                  <span className="text-base font-bold font-mono text-slate-800">
                    {wh.locationsCount || wh.locations?.length || 0}
                  </span>
                </div>
                <div className="p-2 bg-purple-50/50 rounded-xl border border-purple-100/60">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Units</span>
                  <span className="text-base font-bold font-mono text-purple-700">
                    {wh.totalStockQuantity?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="p-2 bg-pink-50/50 rounded-xl border border-pink-100">
                  <span className="block text-[10px] uppercase font-bold text-pink-500">Exceptions</span>
                  <span className="text-base font-bold font-mono text-pink-700">
                    {wh.openExceptionsCount || 0}
                  </span>
                </div>
              </div>

              {/* Storage Locations Pill List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Designated Storage Bins:
                  </span>
                  <button
                    onClick={() => handleOpenAddLocation(wh.id)}
                    className="text-[10px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Bin</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {wh.locations?.slice(0, 5).map((loc) => (
                    <span
                      key={loc.id}
                      className="px-2 py-0.5 rounded-lg bg-white border border-purple-100 text-slate-700 text-[11px] font-medium shadow-2xs"
                    >
                      {loc.name}
                    </span>
                  ))}
                  {(wh.locations?.length || 0) > 5 && (
                    <span className="text-[11px] text-purple-600 font-semibold px-1 py-0.5">
                      +{(wh.locations?.length || 0) - 5} more
                    </span>
                  )}
                  {(!wh.locations || wh.locations.length === 0) && (
                    <span className="text-[11px] text-slate-400 italic">No bins registered</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-purple-100/70 flex items-center gap-2">
              <button
                onClick={() => navigate(`/stock?warehouseId=${wh.id}`)}
                className="flex-1 py-2 bg-purple-50 hover:bg-purple-100/70 text-purple-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-purple-200/60"
              >
                <span>Inspect Bins</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleOpenAddLocation(wh.id)}
                className="p-2 bg-white hover:bg-purple-50 text-slate-600 hover:text-purple-700 rounded-xl border border-purple-100 shadow-2xs transition-colors"
                title="Add new storage bin to warehouse"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Warehouse Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Warehouse Facility"
        subtitle="Expand physical supply network with isolated bin locations"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Code</label>
              <input
                type="text"
                placeholder="e.g. WH-SOUTH"
                value={whCode}
                onChange={(e) => setWhCode(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono uppercase font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name</label>
              <input
                type="text"
                placeholder="e.g. Southern Distribution Hub"
                value={whName}
                onChange={(e) => setWhName(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address</label>
            <input
              type="text"
              placeholder="e.g. 500 Portside Terminal Road"
              value={whAddress}
              onChange={(e) => setWhAddress(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-purple-100">
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
              {submitting ? 'Creating...' : 'Register Facility'}
            </button>
          </div>
        </form>
      </Modal>

      {/* New Storage Location Modal */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Add Storage Bin / Rack"
        subtitle="Create a discrete physical storage location inside this facility"
      >
        <form onSubmit={handleCreateLocation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location Name</label>
              <input
                type="text"
                placeholder="e.g. Bin B-04"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location Code</label>
              <input
                type="text"
                placeholder="e.g. LOC-B04"
                value={locCode}
                onChange={(e) => setLocCode(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs font-mono uppercase font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rack Identifier (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Rack-B"
                value={locRack}
                onChange={(e) => setLocRack(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shelf Identifier (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Shelf-2"
                value={locShelf}
                onChange={(e) => setLocShelf(e.target.value)}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingLocation}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
            >
              {submittingLocation ? 'Creating...' : 'Create Location Bin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default Warehouses;
