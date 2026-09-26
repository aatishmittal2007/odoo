import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Bell,
  RefreshCw,
  Warehouse as WarehouseIcon,
  ChevronRight,
  AlertCircle,
  Package,
  Layers,
  Truck,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenCountModal: () => void;
  navigate: (path: string) => void;
  onRefreshData?: () => void;
  currentPath?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCountModal,
  navigate,
  onRefreshData,
  currentPath = '/',
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Facility filter state (persisted across views)
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    localStorage.getItem('stocksense_active_warehouse') || 'ALL'
  );

  // Notifications dropdown
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentExceptions, setRecentExceptions] = useState<any[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch warehouses for global facility selector
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const res = await api.get('/warehouses');
        setWarehouses(res.data || []);
      } catch (err) {
        // non-blocking
      }
    };
    fetchFacilities();
  }, []);

  // Fetch recent active notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/exceptions?limit=5');
        setRecentExceptions(res.data?.filter((e: any) => e.status !== 'RESOLVED' && e.status !== 'CLOSED') || []);
      } catch (err) {
        // non-blocking
      }
    };
    fetchNotifications();
  }, []);

  const handleFacilityChange = (whId: string) => {
    setSelectedWarehouseId(whId);
    localStorage.setItem('stocksense_active_warehouse', whId);
    window.dispatchEvent(new CustomEvent('stocksense:warehouse_changed', { detail: { warehouseId: whId } }));
    if (onRefreshData) onRefreshData();
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data);
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (path: string) => {
    navigate(path);
    setShowResults(false);
    setSearchQuery('');
  };

  // Compute breadcrumbs
  const getBreadcrumbs = () => {
    const segments = currentPath.split('/').filter(Boolean);
    if (segments.length === 0) return ['Control Tower'];
    return segments.map((s) => {
      return s
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-purple-100/60 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Breadcrumbs & Page Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-purple-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate('/')}>
            StockSense
          </span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={idx === breadcrumbs.length - 1 ? 'font-bold text-slate-800' : 'text-slate-500'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Middle: Global Smart Search */}
      <div ref={searchRef} className="relative w-80 lg:w-96">
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU, Product, INC-024, Order #, Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults) setShowResults(true);
            }}
            className="w-full pl-9 pr-4 py-2 bg-purple-50/40 hover:bg-purple-50/70 border border-purple-100/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 focus:bg-white transition-all font-medium text-slate-800"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="w-3.5 h-3.5 text-purple-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showResults && searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-card border border-purple-100 py-2 z-50 max-h-96 overflow-y-auto animate-fadeIn">
            {/* Products */}
            {searchResults.products?.length > 0 && (
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Products</span>
                {searchResults.products.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectResult(`/products/${p.id}`)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-purple-50 text-left text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block">{p.name}</span>
                        <span className="font-mono text-purple-600 text-[10px]">SKU: {p.sku}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Exceptions */}
            {searchResults.exceptions?.length > 0 && (
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Exceptions</span>
                {searchResults.exceptions.map((e: any) => (
                  <button
                    key={e.id}
                    onClick={() => handleSelectResult(`/exceptions/${e.id}`)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-pink-50 text-left text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{e.exceptionNumber}</span>
                        <span className="text-slate-500 text-[11px] truncate max-w-[200px] block">{e.notes}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Deliveries */}
            {searchResults.deliveries?.length > 0 && (
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Delivery Orders</span>
                {searchResults.deliveries.map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectResult('/deliveries')}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 text-left text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-slate-800">{d.deliveryNumber}</span>
                      <span className="text-slate-500 text-[11px]">({d.customer})</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!searchResults.products?.length &&
              !searchResults.exceptions?.length &&
              !searchResults.deliveries?.length && (
                <div className="px-4 py-4 text-center text-xs text-slate-500">
                  No matching inventory records or exceptions found.
                </div>
              )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Global Facility Selector */}
        <div className="relative hidden sm:block">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50/70 border border-purple-200/70 rounded-xl text-xs font-semibold text-purple-900">
            <WarehouseIcon className="w-3.5 h-3.5 text-purple-600" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => handleFacilityChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-purple-950 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Warehouses (Network)</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notifications Dropdown */}
        <div ref={notificationRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors border border-purple-100/80 relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {recentExceptions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                {recentExceptions.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-card border border-purple-100 p-3 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-800">Operational Alerts</span>
                <span className="text-[10px] text-purple-600 font-semibold cursor-pointer" onClick={() => navigate('/exceptions')}>
                  View all
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentExceptions.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No active exceptions! Inventory healthy.</div>
                ) : (
                  recentExceptions.map((exc) => (
                    <div
                      key={exc.id}
                      onClick={() => {
                        navigate(`/exceptions/${exc.id}`);
                        setShowNotifications(false);
                      }}
                      className="p-2 rounded-xl bg-purple-50/50 hover:bg-purple-100/50 cursor-pointer border border-purple-100 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="font-bold text-slate-800">{exc.exceptionNumber}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            exc.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : exc.severity === 'HIGH'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {exc.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">{exc.notes}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Real-time Refresh */}
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            title="Refresh Real-time Data"
            className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors border border-purple-100/80"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Primary CTA: Record Count */}
        <button
          onClick={onOpenCountModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Record Count</span>
        </button>
      </div>
    </header>
  );
};
