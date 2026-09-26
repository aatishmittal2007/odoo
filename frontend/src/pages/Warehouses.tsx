import React, { useEffect, useState } from 'react';
import { Warehouse as WarehouseIcon, MapPin, Boxes, ShieldAlert, Plus, ArrowRight } from 'lucide-react';
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <WarehouseIcon className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Multi-Warehouse Facilities
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 25 — Multi-warehouse inventory nodes, internal storage bins, active stock balances, and local exceptions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Warehouse Facility</span>
        </button>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{wh.name}</h3>
                    {wh.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400 font-bold block mt-0.5">
                    {wh.code}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
              </div>

              {wh.address && <p className="text-xs text-slate-500">{wh.address}</p>}

              {/* Facility Metrics */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Locations</span>
                  <span className="text-base font-bold font-mono text-slate-800">
                    {wh.locationsCount || wh.locations?.length || 0}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Total Units</span>
                  <span className="text-base font-bold font-mono text-emerald-700">
                    {wh.totalStockQuantity?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="p-2 bg-rose-50 rounded-lg">
                  <span className="block text-[10px] uppercase font-bold text-rose-500">Exceptions</span>
                  <span className="text-base font-bold font-mono text-rose-700">
                    {wh.openExceptionsCount || 0}
                  </span>
                </div>
              </div>

              {/* Storage Locations Pill List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Designated Bins / Racks:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {wh.locations?.slice(0, 5).map((loc) => (
                    <span
                      key={loc.id}
                      className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
                    >
                      {loc.name}
                    </span>
                  ))}
                  {(wh.locations?.length || 0) > 5 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      +{(wh.locations?.length || 0) - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => navigate(`/stock?warehouseId=${wh.id}`)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <span>View Facility Stock Bins</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase font-bold"
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
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
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              {submitting ? 'Creating...' : 'Register Facility'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
