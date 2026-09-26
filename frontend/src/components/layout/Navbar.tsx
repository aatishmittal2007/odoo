import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Bell, RefreshCw, Warehouse, ChevronRight, AlertCircle, Package } from 'lucide-react';
import api from '../../services/api';

interface NavbarProps {
  onOpenCountModal: () => void;
  navigate: (path: string) => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCountModal, navigate, onRefreshData }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Global Smart Search */}
      <div ref={searchRef} className="relative w-96 max-w-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search SKU, Product, INC-024, Order #, Location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults) setShowResults(true);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {showResults && searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 max-h-96 overflow-y-auto">
            {/* Products */}
            {searchResults.products?.length > 0 && (
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Products</span>
                {searchResults.products.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectResult(`/products/${p.id}`)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 text-left text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <span className="font-mono text-slate-400 text-[11px]">({p.sku})</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Exceptions */}
            {searchResults.exceptions?.length > 0 && (
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exceptions</span>
                {searchResults.exceptions.map((e: any) => (
                  <button
                    key={e.id}
                    onClick={() => handleSelectResult(`/exceptions/${e.id}`)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 text-left text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-bold text-slate-900">{e.exceptionNumber}</span>
                      <span className="text-slate-600 truncate max-w-[200px]">{e.notes}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Deliveries */}
            {searchResults.deliveries?.length > 0 && (
              <div className="px-3 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivery Orders</span>
                {searchResults.deliveries.map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectResult('/deliveries')}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 text-left text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{d.deliveryNumber}</span>
                      <span className="text-slate-500 ml-2">Customer: {d.customer}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {(!searchResults.products?.length &&
              !searchResults.exceptions?.length &&
              !searchResults.deliveries?.length &&
              !searchResults.receipts?.length &&
              !searchResults.locations?.length) && (
              <div className="px-4 py-3 text-center text-xs text-slate-500">
                No matching inventory items, exceptions, or orders found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Active Facility Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 border border-slate-200">
          <Warehouse className="w-3.5 h-3.5 text-slate-500" />
          <span>Facility: <strong>Main Warehouse (WH-MAIN)</strong></span>
        </div>

        {/* Refresh data */}
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            title="Refresh Real-time Data"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Quick Action: Record Count */}
        <button
          onClick={onOpenCountModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Count</span>
        </button>
      </div>
    </header>
  );
};
