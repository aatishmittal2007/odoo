import React from 'react';
import {
  ShieldAlert,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  Activity,
  ScrollText,
  Warehouse as WarehouseIcon,
  MapPin,
  Settings,
  Users,
  Building2,
  Layers,
  LogOut,
  Radio,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, navigate }) => {
  const { user, switchRole, logout } = useAuth();

  const navSections = [
    {
      title: 'CONTROL',
      items: [
        { label: 'Control Tower', path: '/', icon: Radio },
        { label: 'Exceptions', path: '/exceptions', icon: ShieldAlert, badge: 'Active' },
      ],
    },
    {
      title: 'INVENTORY',
      items: [
        { label: 'Products', path: '/products', icon: Boxes },
        { label: 'Stock by Location', path: '/stock', icon: Layers },
        { label: 'Warehouses', path: '/warehouses', icon: WarehouseIcon },
        { label: 'Locations', path: '/locations', icon: MapPin },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Receipts', path: '/receipts', icon: ArrowDownToLine },
        { label: 'Deliveries', path: '/deliveries', icon: ArrowUpFromLine },
        { label: 'Internal Transfers', path: '/transfers', icon: ArrowLeftRight },
        { label: 'Adjustments', path: '/adjustments', icon: SlidersHorizontal },
        { label: 'Physical Counts', path: '/physical-counts', icon: ClipboardCheck },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { label: 'Process Health', path: '/process-health', icon: Activity },
        { label: 'Stock Ledger', path: '/ledger', icon: ScrollText },
      ],
    },
    {
      title: 'SETTINGS',
      items: [
        { label: 'Facility Settings', path: '/settings/warehouse', icon: Building2 },
        { label: 'Users & Roles', path: '/settings/users', icon: Users },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/60">
        <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
          <ShieldAlert className="w-5 h-5 text-emerald-100" />
        </div>
        <div>
          <span className="text-base font-bold tracking-wider text-white">
            STOCK<span className="text-emerald-400">SENSE</span>
          </span>
          <span className="block text-[10px] uppercase font-mono tracking-widest text-slate-400">
            Reality & Exception OS
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {section.title}
            </h4>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? currentPath === '/'
                    : currentPath.startsWith(item.path);

                return (
                  <button
                    key={itemIdx}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Persona Role Switcher & User Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  {user?.role === 'INVENTORY_MANAGER' ? 'Manager' : 'Staff'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick 1-click Role Switcher */}
          <div className="flex gap-1 pt-1.5 border-t border-slate-800/80">
            <button
              onClick={() => switchRole('INVENTORY_MANAGER')}
              className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold text-center transition-all ${
                user?.role === 'INVENTORY_MANAGER'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Manager View
            </button>
            <button
              onClick={() => switchRole('WAREHOUSE_STAFF')}
              className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold text-center transition-all ${
                user?.role === 'WAREHOUSE_STAFF'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Staff View
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
