import React, { useState } from 'react';
import {
  LayoutGrid,
  BookOpen,
  Database,
  Radio,
  UserCheck,
  Clock,
  GitBranch,
  ShieldCheck,
  Zap,
  Settings,
  ChevronRight,
  User,
  ChevronsUpDown
} from 'lucide-react';
import { ModuleId, UserRole, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  currentUser?: UserProfile;
  collapsed: boolean;
  onToggleCollapse: () => void;
  pendingRequestsCount?: number;
}

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  userRole,
  onChangeRole,
  currentUser,
  collapsed,
  onToggleCollapse,
  pendingRequestsCount = 0
}) => {
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Clean navigation list without grouping annotations (removed General, Portals, System annotations)
  const navItems: NavItem[] = [
    {
      id: 'approval_hub',
      label: 'Dashboard',
      icon: LayoutGrid
    },
    {
      id: 'vocabulary',
      label: 'Business Vocabulary',
      icon: BookOpen
    },
    {
      id: 'data_dictionary',
      label: 'Data Dictionary',
      icon: Database
    },
    {
      id: 'event_taxonomy',
      label: 'Event Taxonomy',
      icon: Radio
    },
    {
      id: 'profile_config',
      label: 'Profile Configuration',
      icon: UserCheck
    },
    {
      id: 'customer_timeline',
      label: 'Customer Timeline',
      icon: Clock
    },
    {
      id: 'state_lifecycle',
      label: 'State & Lifecycle',
      icon: GitBranch
    },
    {
      id: 'suitability_gate',
      label: 'Suitability Gate',
      icon: ShieldCheck
    },
    {
      id: 'next_best_action',
      label: 'Next Best Action',
      icon: Zap
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  // User display name format (e.g. HUY CHUNG MINH)
  const displayName = currentUser?.fullName?.toUpperCase() || 'HUY CHUNG MINH';
  const displayStaffId = currentUser?.staffId || '2593';
  const roleTitle = currentUser?.role || userRole;

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-white border-r border-stone-200/80 transition-all duration-300 z-30 select-none shadow-[1px_0_6px_rgba(0,0,0,0.02)]',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-stone-100">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-matcha-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight text-stone-900">PHS PLATFORM</div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-xl bg-matcha-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
            <LayoutGrid className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <ChevronRight className={cn('w-4 h-4 transition-transform duration-200', !collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation Items List - Direct and clean without group headings */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer',
                isActive
                  ? 'bg-[#dcfce7] text-stone-900 font-semibold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 font-medium'
              )}
            >
              <IconComponent
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-stone-900' : 'text-stone-500'
                )}
              />

              {!collapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                  <span className="text-xs truncate">{item.label}</span>
                  {item.id === 'approval_hub' && pendingRequestsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                      {pendingRequestsCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom User Profile Section - Exactly matching reference design */}
      <div className="p-3 border-t border-stone-200/80 bg-white relative">
        {!collapsed ? (
          <div className="space-y-1">
            <div className="font-bold text-xs text-stone-900 tracking-tight uppercase truncate">
              {displayName}
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 cursor-pointer select-none transition-all hover:scale-105 active:scale-95",
                    roleTitle === 'Maker'
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                      : roleTitle === 'Checker'
                      ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                      : roleTitle === 'Administrator'
                      ? "bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100"
                      : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                  )}
                  title="Nhấn để đổi vai trò hệ thống (Maker, Checker, Administrator, View-only)"
                >
                  {roleTitle}
                </span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center gap-1 shrink-0">
                  <User className="w-3 h-3 text-stone-400" />
                  ID: {displayStaffId}
                </span>
              </div>

              {/* Role Switcher Menu Trigger */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="p-1 hover:bg-stone-100 rounded-md text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  title="Chuyển đổi vai trò người dùng"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                </button>

                {showRoleSwitcher && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-50 text-xs">
                    <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase">
                      Đổi vai trò hệ thống
                    </div>
                    {(['Maker', 'Checker', 'Administrator', 'View-only'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          onChangeRole(r);
                          setShowRoleSwitcher(false);
                        }}
                        className={cn(
                          'w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer',
                          userRole === r
                            ? r === 'Maker'
                              ? 'bg-emerald-50 text-emerald-800 font-bold'
                              : r === 'Checker'
                              ? 'bg-amber-50 text-amber-800 font-bold'
                              : r === 'Administrator'
                              ? 'bg-purple-50 text-purple-800 font-bold'
                              : 'bg-stone-100 text-stone-900 font-bold'
                            : 'hover:bg-stone-50 text-stone-700'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              r === 'Maker'
                                ? 'bg-emerald-500'
                                : r === 'Checker'
                                ? 'bg-amber-500'
                                : r === 'Administrator'
                                ? 'bg-purple-500'
                                : 'bg-stone-400'
                            )}
                          />
                          <span>{r}</span>
                        </div>
                        {userRole === r && <span className="text-emerald-700 text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs hover:scale-105 transition-all cursor-pointer"
              title={`${displayName} (${roleTitle})`}
            >
              CM
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
