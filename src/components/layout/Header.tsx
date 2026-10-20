import React, { useState } from 'react';
import {
  Search,
  X,
  Sun,
  Moon,
  Languages,
  Settings,
  Building2,
  User,
  Download,
  Filter
} from 'lucide-react';
import { EnterpriseDomain, ENTERPRISE_DOMAINS, ModuleId, UserRole, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface HeaderProps {
  currentModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  selectedDomain: EnterpriseDomain | 'ALL';
  onChangeDomain: (domain: EnterpriseDomain | 'ALL') => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  userRole: UserRole;
  onChangeRole?: (role: UserRole) => void;
  currentUser?: UserProfile;
  onOpenExportModal: () => void;
  onOpenHelpModal?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onSelectModule,
  selectedDomain,
  onChangeDomain,
  searchTerm,
  onSearchChange,
  userRole,
  onChangeRole,
  currentUser,
  onOpenExportModal,
  sidebarCollapsed,
  onToggleSidebar
}) => {
  const [showDomainFilter, setShowDomainFilter] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'VI' | 'EN'>('VI');

  const displayName = currentUser?.fullName?.toUpperCase() || 'CHUNG MINH HUY';
  const displayDepartment = currentUser?.department || 'Hội sở';
  const displayStaffId = currentUser?.staffId || '2593';
  const displayRole = currentUser?.role || userRole;

  // Extract initials for the blue avatar circle (e.g. CM for Chung Minh Huy)
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'CM';
  };

  const avatarInitials = currentUser?.fullName ? getInitials(currentUser.fullName) : 'CM';

  return (
    <header className="h-16 shrink-0 bg-white border-b border-stone-200/80 px-6 flex items-center justify-between gap-4 sticky top-0 z-20 select-none">
      {/* Left side: Sidebar Toggle & Search Input - matching image.png */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className="w-9 h-9 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors shadow-2xs cursor-pointer shrink-0"
            aria-label="Toggle Sidebar"
          >
            {/* Split panel icon identical to screenshot */}
            <svg
              className="w-4 h-4 text-stone-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="3" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}

        {/* Search bar matching screenshot design */}
        <div className="relative w-60 sm:w-72 lg:w-80">
          <div className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs shadow-2xs hover:border-stone-300 focus-within:border-emerald-600 transition-all">
            <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-stone-800 placeholder-stone-400 text-xs"
            />
            {searchTerm ? (
              <button
                onClick={() => onSearchChange('')}
                className="text-stone-400 hover:text-stone-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-500 font-semibold shrink-0">
                ⌘ K
              </kbd>
            )}
          </div>
        </div>

        {/* Compact Domain Filter dropdown button */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowDomainFilter(!showDomainFilter)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors shadow-2xs cursor-pointer',
              selectedDomain !== 'ALL'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            )}
            title="Lọc theo miền nghiệp vụ"
          >
            <Filter className="w-3 h-3 text-stone-400" />
            <span className="truncate max-w-[120px]">
              {selectedDomain === 'ALL' ? 'Tất cả miền' : selectedDomain}
            </span>
          </button>

          {showDomainFilter && (
            <div className="absolute left-0 mt-1 w-52 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-50 max-h-72 overflow-y-auto">
              <button
                onClick={() => {
                  onChangeDomain('ALL');
                  setShowDomainFilter(false);
                }}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer',
                  selectedDomain === 'ALL' ? 'bg-[#dcfce7] text-stone-900 font-bold' : 'hover:bg-stone-50 text-stone-700'
                )}
              >
                Tất cả miền (17)
              </button>
              {ENTERPRISE_DOMAINS.map((domain) => (
                <button
                  key={domain}
                  onClick={() => {
                    onChangeDomain(domain);
                    setShowDomainFilter(false);
                  }}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer truncate',
                    selectedDomain === domain ? 'bg-[#dcfce7] text-stone-900 font-bold' : 'hover:bg-stone-50 text-stone-700'
                  )}
                >
                  {domain}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: User Capsule & Action Buttons - matching image.png */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* User Info Capsule matching screenshot */}
        <div className="hidden sm:flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs shadow-2xs relative">
          <span className="font-bold text-stone-900 text-xs tracking-tight uppercase">
            {displayName}
          </span>
          <span
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-2xs cursor-pointer select-none transition-all hover:opacity-90 active:scale-95",
              displayRole === 'Maker'
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : displayRole === 'Checker'
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : displayRole === 'Administrator'
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-stone-600 text-white hover:bg-stone-700"
            )}
            title="Nhấn để chuyển đổi vai trò hệ thống (Maker, Checker, Administrator, View-only)"
          >
            {displayRole}
          </span>
          <span className="text-stone-200 font-light">|</span>
          <span className="text-stone-600 text-xs flex items-center gap-1 font-medium">
            <Building2 className="w-3.5 h-3.5 text-stone-400" />
            {displayDepartment}
          </span>
          <span className="text-stone-200 font-light">|</span>
          <span className="text-stone-600 text-xs flex items-center gap-1 font-medium">
            <User className="w-3.5 h-3.5 text-stone-400" />
            ID: {displayStaffId}
          </span>

          {showRoleDropdown && onChangeRole && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-xl p-1.5 z-50 text-xs text-left">
              <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase">
                Chọn vai trò phân quyền
              </div>
              {(['Maker', 'Checker', 'Administrator', 'View-only'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    onChangeRole(r);
                    setShowRoleDropdown(false);
                  }}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer',
                    displayRole === r
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
                        'w-2 h-2 rounded-full',
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
                  {displayRole === r && <span className="text-emerald-700 text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action icons row matching screenshot */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle icon (Sun) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Language Toggle icon (Languages / 文A) */}
          <button
            onClick={() => setLanguage(language === 'VI' ? 'EN' : 'VI')}
            title={`Ngôn ngữ hiện tại: ${language} (Bấm để đổi)`}
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer relative"
          >
            <Languages className="w-4 h-4" />
            <span className="sr-only">Toggle Language</span>
          </button>

          {/* Export button */}
          <button
            onClick={onOpenExportModal}
            title="Xuất catalog dữ liệu (JSON)"
            className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer hidden lg:block"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Settings icon button (Cog) */}
          <button
            onClick={() => onSelectModule('settings')}
            title="Cài đặt & Phân quyền"
            className={cn(
              'p-2 rounded-xl transition-colors cursor-pointer',
              currentModule === 'settings'
                ? 'bg-stone-100 text-stone-900 font-bold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            )}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Avatar Circle matching screenshot (Blue with initials CM) */}
          <div
            onClick={() => onSelectModule('settings')}
            title={`${displayName} · Bấm để xem tài khoản`}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer select-none ml-1 transition-transform hover:scale-105"
          >
            {avatarInitials}
          </div>
        </div>
      </div>
    </header>
  );
};
