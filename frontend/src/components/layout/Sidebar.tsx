import React from 'react';
import {
  Radio,
  ShieldAlert,
  Boxes,
  Layers,
  Warehouse as WarehouseIcon,
  MapPin,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  SearchCode,
  CheckSquare,
  PieChart,
  CheckCircle2,
  ScrollText,
  Activity,
  Sliders,
  Building2,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';

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
        { label: 'Exceptions', path: '/exceptions', icon: ShieldAlert, badge: 'Live' },
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
      ],
    },
    {
      title: 'VERIFICATION',
      items: [
        { label: 'Physical Counts', path: '/physical-counts', icon: ClipboardCheck },
      ],
    },
    {
      title: 'INVESTIGATION',
      items: [
        { label: 'Investigations', path: '/investigations', icon: SearchCode },
        { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Root Causes', path: '/root-causes', icon: PieChart },
        { label: 'Resolutions', path: '/resolutions', icon: CheckCircle2 },
      ],
    },
    {
      title: 'INSIGHTS',
      items: [
        { label: 'Stock Ledger', path: '/ledger', icon: ScrollText },
        { label: 'Process Health', path: '/process-health', icon: Activity },
      ],
    },
    {
      title: 'CONFIGURATION',
      items: [
        { label: 'Reordering Rules', path: '/reordering-rules', icon: Sliders },
        { label: 'Facility Settings', path: '/warehouse-settings', icon: Building2 },
        { label: 'Users & Roles', path: '/users-roles', icon: Users },
        { label: 'System Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0d0b18] text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-purple-950/40 select-none z-20 shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-purple-950/50 bg-[#090713]">
        <BrandLogo size="md" inverted={true} />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-purple-950">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-[10px] font-bold text-purple-400/60 uppercase tracking-widest">
              {section.title}
            </h4>
            <div className="space-y-0.5 pt-0.5">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? currentPath === '/'
                    : currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));

                return (
                  <button
                    key={itemIdx}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-purple-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
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

      {/* Persona Role Switcher & User Profile Footer */}
      <div className="p-3 border-t border-purple-950/60 bg-[#090713]">
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/40">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm shadow-purple-600/30">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</div>
                <div className="text-[10px] text-purple-300/70 font-mono truncate">
                  {user?.role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : 'Warehouse Staff'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Persona Switcher for Hackathon Testing */}
          <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">Role Simulator:</span>
            <div className="flex gap-1">
              <button
                onClick={() => switchRole('INVENTORY_MANAGER')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  user?.role === 'INVENTORY_MANAGER'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                Manager
              </button>
              <button
                onClick={() => switchRole('WAREHOUSE_STAFF')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  user?.role === 'WAREHOUSE_STAFF'
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                Staff
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
