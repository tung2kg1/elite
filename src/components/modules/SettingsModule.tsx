import React, { useState } from 'react';
import {
  User,
  Shield,
  Mail,
  Building,
  Key,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Save,
  Clock,
  Lock,
  Unlock,
  ShieldCheck,
  Check,
  X,
  Sparkles,
  Info,
  ChevronRight,
  Layers,
  ArrowRight,
  BadgeAlert,
  Database
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  ModuleId,
  EnterpriseDomain,
  ENTERPRISE_DOMAINS
} from '../../types';

export interface SettingsFirebaseProps {
  firebaseConfig?: any;
  user?: any;
  authLoading?: boolean;
  isConnected?: boolean;
  connectionChecking?: boolean;
  lastSyncedAt?: string | null;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string | null;
  onCheckConnection?: () => Promise<boolean>;
  onGoogleSignIn?: () => Promise<any>;
  onSignOut?: () => Promise<void>;
  onPushData?: () => Promise<boolean>;
  onPullData?: () => Promise<any>;
}

interface SettingsModuleProps {
  currentUser: UserProfile;
  onUpdateCurrentUser: (profile: UserProfile) => void;
  usersList: UserProfile[];
  onUpdateUsersList: (users: UserProfile[]) => void;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onNavigateToModule?: (moduleId: ModuleId) => void;
  firebaseProps?: SettingsFirebaseProps;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  currentUser,
  onUpdateCurrentUser,
  usersList,
  onUpdateUsersList,
  userRole,
  onChangeRole,
  onNavigateToModule,
  firebaseProps
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'USER_MANAGEMENT'>('PROFILE');

  // Personal Profile Form State
  const [profileForm, setProfileForm] = useState<UserProfile>({ ...currentUser });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Admin User Management State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // User Edit/Create Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingUser, setEditingUser] = useState<Partial<UserProfile>>({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Email validation rule: must be @phs.vn or @phs
  const isPhsEmail = (email: string): boolean => {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return clean.endsWith('@phs.vn') || clean.endsWith('@phs') || clean.endsWith('@phs.com.vn');
  };

  // Handle saving personal profile
  const handleSavePersonalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!profileForm.fullName.trim()) {
      setProfileError('Họ và tên không được để trống.');
      return;
    }

    if (!profileForm.staffId.trim()) {
      setProfileError('Mã số nhân viên không được để trống.');
      return;
    }

    if (!isPhsEmail(profileForm.companyEmail)) {
      setProfileError('Email công ty bắt buộc phải có đuôi @phs hoặc @phs.vn theo quy định PHS.');
      return;
    }

    onUpdateCurrentUser(profileForm);

    // Also update in usersList if matching
    const updatedUsers = usersList.map((u) =>
      u.id === profileForm.id || u.companyEmail.toLowerCase() === profileForm.companyEmail.toLowerCase()
        ? { ...u, ...profileForm }
        : u
    );
    onUpdateUsersList(updatedUsers);

    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  // Open Create User Modal
  const handleOpenCreateModal = () => {
    setModalMode('CREATE');
    setModalError(null);
    setEditingUser({
      id: `USR_PHS_${Date.now()}`,
      fullName: '',
      staffId: `PHS${Math.floor(1000 + Math.random() * 9000)}`,
      companyEmail: '',
      role: 'Maker',
      department: 'Khối Quản trị Khách hàng & Dữ liệu C360',
      phoneNumber: '',
      status: 'Active',
      assignedDomains: ['Customer', 'Trading', 'Cash'],
      accessibleModules: ['vocabulary', 'data_dictionary', 'event_taxonomy', 'approval_hub'],
      permissions: {
        canCreateRequest: true,
        canApproveRequest: false,
        canEditCatalog: true,
        canExportData: true,
        canManageUsers: false
      }
    });
    setShowUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditModal = (user: UserProfile) => {
    setModalMode('EDIT');
    setModalError(null);
    setEditingUser({ ...user });
    setShowUserModal(true);
  };

  // Handle Save User Modal
  const handleSaveUserModal = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!editingUser.fullName?.trim()) {
      setModalError('Vui lòng nhập Họ và tên nhân viên.');
      return;
    }

    if (!editingUser.staffId?.trim()) {
      setModalError('Vui lòng nhập Mã số nhân viên PHS.');
      return;
    }

    if (!editingUser.companyEmail?.trim()) {
      setModalError('Vui lòng nhập Email công ty.');
      return;
    }

    if (!isPhsEmail(editingUser.companyEmail)) {
      setModalError('Email không hợp lệ! Quy định bắt buộc sử dụng email doanh nghiệp có đuôi @phs (ví dụ: user@phs.vn).');
      return;
    }

    // Check duplicate email
    const duplicate = usersList.find(
      (u) =>
        u.companyEmail.toLowerCase() === editingUser.companyEmail?.toLowerCase().trim() &&
        u.id !== editingUser.id
    );
    if (duplicate) {
      setModalError(`Email ${editingUser.companyEmail} đã được cấp cho nhân viên ${duplicate.fullName} (${duplicate.staffId}).`);
      return;
    }

    if (modalMode === 'CREATE') {
      const newUser: UserProfile = {
        id: editingUser.id || `USR_PHS_${Date.now()}`,
        fullName: editingUser.fullName.trim(),
        staffId: editingUser.staffId.trim().toUpperCase(),
        companyEmail: editingUser.companyEmail.trim().toLowerCase(),
        role: editingUser.role || 'Maker',
        department: editingUser.department || 'Khối Nghiệp vụ',
        phoneNumber: editingUser.phoneNumber || '',
        joinedDate: new Date().toISOString().split('T')[0],
        status: editingUser.status || 'Active',
        assignedDomains: editingUser.assignedDomains || ['Customer'],
        accessibleModules: editingUser.accessibleModules || ['vocabulary', 'data_dictionary'],
        permissions: editingUser.permissions || {
          canCreateRequest: editingUser.role === 'Maker' || editingUser.role === 'Administrator',
          canApproveRequest: editingUser.role === 'Checker' || editingUser.role === 'Administrator',
          canEditCatalog: editingUser.role === 'Maker' || editingUser.role === 'Administrator',
          canExportData: true,
          canManageUsers: editingUser.role === 'Administrator'
        },
        lastLogin: 'Chưa đăng nhập',
        notes: editingUser.notes || ''
      };
      onUpdateUsersList([newUser, ...usersList]);
      setSuccessToast(`Đã thêm mới tài khoản @phs cho nhân viên ${newUser.fullName} thành công.`);
    } else {
      const updatedList = usersList.map((u) =>
        u.id === editingUser.id ? ({ ...u, ...editingUser } as UserProfile) : u
      );
      onUpdateUsersList(updatedList);
      // If updating current user
      if (editingUser.id === currentUser.id) {
        onUpdateCurrentUser({ ...currentUser, ...editingUser } as UserProfile);
      }
      setSuccessToast(`Đã cập nhật phân quyền tài khoản ${editingUser.companyEmail} thành công.`);
    }

    setShowUserModal(false);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Toggle user status
  const handleToggleUserStatus = (userId: string) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        const newStatus: 'Active' | 'Inactive' = u.status === 'Active' ? 'Inactive' : 'Active';
        return { ...u, status: newStatus };
      }
      return u;
    });
    onUpdateUsersList(updated);
  };

  // Delete user
  const handleDeleteUser = (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target) return;
    if (target.role === 'Administrator' && usersList.filter((u) => u.role === 'Administrator').length <= 1) {
      alert('Không thể xóa quản trị viên duy nhất của hệ thống.');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${target.fullName} (${target.companyEmail}) khỏi hệ thống?`)) {
      onUpdateUsersList(usersList.filter((u) => u.id !== userId));
      setSuccessToast(`Đã xóa tài khoản ${target.companyEmail}.`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Filtered users list
  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.companyEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Module Header */}
      <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-matcha-800 bg-matcha-100 px-2 py-0.5 rounded border border-matcha-300">
              CÀI ĐẶT HỆ THỐNG
            </span>
            <h2 className="text-xl font-bold text-stone-900">
              Thiết lập Tài khoản & Quản lý Phân quyền (@phs)
            </h2>
          </div>
        </div>

        {/* Quick Role Switcher for Test Experience */}
        <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-stone-500 font-medium">Vai trò đang thao tác:</div>
            <div className="text-xs font-bold text-matcha-800 flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-matcha-500 animate-pulse" />
              {userRole}
            </div>
          </div>
          <select
            value={userRole}
            onChange={(e) => onChangeRole(e.target.value as UserRole)}
            className="text-xs font-semibold bg-white border border-matcha-300 rounded-lg px-2.5 py-1.5 text-stone-800 shadow-2xs focus:ring-1 focus:ring-matcha-500 cursor-pointer"
            title="Chuyển đổi vai trò để kiểm thử quyền hạn"
          >
            <option value="Maker">Maker (Người lập hồ sơ)</option>
            <option value="Checker">Checker (Người thẩm định & duyệt)</option>
            <option value="Administrator">Administrator (Quản trị viên toàn quyền)</option>
            <option value="View-only">View-only (Chỉ tra cứu)</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-matcha-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 shadow-2xs">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'PROFILE'
              ? 'border-matcha-600 text-matcha-800'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Thông tin tài khoản cá nhân (My Profile)</span>
        </button>

        <button
          onClick={() => setActiveTab('USER_MANAGEMENT')}
          className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all relative ${
            activeTab === 'USER_MANAGEMENT'
              ? 'border-matcha-600 text-matcha-800'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Quản lý Tài khoản & Phân quyền theo Email @phs</span>
          {userRole === 'Administrator' && (
            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-matcha-100 text-matcha-800 border border-matcha-300 rounded-full">
              Admin
            </span>
          )}
        </button>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-3.5 bg-matcha-50 border border-matcha-300 rounded-xl text-xs text-matcha-900 font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-matcha-700 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-stone-400 hover:text-stone-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================== TAB 1: PERSONAL PROFILE ======================== */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Personal Card & Badges */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white border border-matcha-200 rounded-2xl p-6 shadow-xs text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-matcha-600 via-matcha-700 to-bronze-700 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-matcha-900/10 ring-4 ring-matcha-100">
                  {currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase() || 'PHS'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block" title="Đang trực tuyến" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-stone-900">{currentUser.fullName}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="font-mono text-xs font-bold text-matcha-800 bg-matcha-100 px-2 py-0.5 rounded border border-matcha-300">
                    {currentUser.staffId}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Corporate email verification badge */}
              <div className="p-3 bg-matcha-50/70 border border-matcha-200 rounded-xl text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-matcha-900">
                  <CheckCircle2 className="w-3.5 h-3.5 text-matcha-700 shrink-0" />
                  <span>Email Doanh nghiệp PHS</span>
                </div>
                <div className="text-xs font-mono text-stone-700 break-all select-all">
                  {currentUser.companyEmail}
                </div>
                <div className="text-[10px] text-stone-500 pt-0.5">
                  Xác thực danh tính nhân sự Chứng khoán Phú Hưng
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-stone-400" />
                    Phòng ban:
                  </span>
                  <span className="font-medium text-stone-900 text-right truncate max-w-[180px]">
                    {currentUser.department}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Ngày gia nhập:
                  </span>
                  <span className="font-medium text-stone-900">{currentUser.joinedDate || '2022-03-15'}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                    Trạng thái:
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-matcha-100 text-matcha-800">
                    {currentUser.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Permissions Box */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-bronze-600" />
                Đặc quyền hiện tại của bạn
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-600">Lập & Gửi tờ trình phê duyệt:</span>
                  <span className={`font-semibold ${currentUser.permissions.canCreateRequest ? 'text-matcha-700' : 'text-stone-400'}`}>
                    {currentUser.permissions.canCreateRequest ? '✓ Cho phép' : '✕ Không'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-600">Thẩm định & Phê duyệt:</span>
                  <span className={`font-semibold ${currentUser.permissions.canApproveRequest ? 'text-matcha-700' : 'text-stone-400'}`}>
                    {currentUser.permissions.canApproveRequest ? '✓ Cho phép' : '✕ Không'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-600">Chỉnh sửa Catalog:</span>
                  <span className={`font-semibold ${currentUser.permissions.canEditCatalog ? 'text-matcha-700' : 'text-stone-400'}`}>
                    {currentUser.permissions.canEditCatalog ? '✓ Cho phép' : '✕ Không'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-100">
                  <span className="text-stone-600">Xuất dữ liệu Catalog:</span>
                  <span className={`font-semibold ${currentUser.permissions.canExportData ? 'text-matcha-700' : 'text-stone-400'}`}>
                    {currentUser.permissions.canExportData ? '✓ Cho phép' : '✕ Không'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-stone-600">Quản trị phân quyền @phs:</span>
                  <span className={`font-semibold ${currentUser.permissions.canManageUsers ? 'text-matcha-700' : 'text-stone-400'}`}>
                    {currentUser.permissions.canManageUsers ? '✓ Quản trị viên' : '✕ Khóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editable Profile Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-matcha-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Thông tin cá nhân & Tài khoản PHS</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Cập nhật họ tên, mã số nhân viên, số điện thoại và phòng ban công tác.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded">
                  ID: {currentUser.id}
                </span>
              </div>

              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSaveSuccess && (
                <div className="p-3 bg-matcha-50 border border-matcha-300 rounded-xl text-xs text-matcha-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-matcha-700 shrink-0" />
                  <span>Đã lưu cập nhật thông tin cá nhân thành công!</span>
                </div>
              )}

              <form onSubmit={handleSavePersonalProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      Họ và tên nhân viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-matcha-500 focus:bg-white"
                      required
                    />
                  </div>

                  {/* Staff ID */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      Mã số nhân viên (Staff ID) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profileForm.staffId}
                        onChange={(e) => setProfileForm({ ...profileForm, staffId: e.target.value.toUpperCase() })}
                        placeholder="VD: PHS0892"
                        className="w-full text-xs font-mono font-bold bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-matcha-500 focus:bg-white"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-matcha-800 bg-matcha-100 px-1.5 py-0.5 rounded">
                        PHS Staff
                      </span>
                    </div>
                  </div>

                  {/* Company Email (Must end with @phs) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">
                      Email công ty (@phs.vn) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={profileForm.companyEmail}
                        onChange={(e) => setProfileForm({ ...profileForm, companyEmail: e.target.value.toLowerCase() })}
                        placeholder="user@phs.vn"
                        className={`w-full text-xs pl-9 pr-20 py-2.5 bg-stone-50 border rounded-xl focus:outline-none focus:ring-1 focus:bg-white ${
                          isPhsEmail(profileForm.companyEmail)
                            ? 'border-matcha-300 focus:ring-matcha-500'
                            : 'border-rose-300 focus:ring-rose-500'
                        }`}
                        required
                      />
                      <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-stone-500 bg-stone-200/70 px-1.5 py-0.5 rounded">
                        @phs
                      </span>
                    </div>
                    {!isPhsEmail(profileForm.companyEmail) && profileForm.companyEmail && (
                      <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                        ⚠️ Email phải kết thúc bằng @phs hoặc @phs.vn
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700">Số điện thoại liên lạc</label>
                    <input
                      type="text"
                      value={profileForm.phoneNumber || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      placeholder="0908 xxx xxx"
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-matcha-500 focus:bg-white"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-stone-700">Phòng ban / Khối nghiệp vụ</label>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      placeholder="VD: Khối Quản trị Khách hàng & Phân tích Dữ liệu C360"
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-matcha-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Assigned Domains pills */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="block text-xs font-bold text-stone-700">
                    Miền dữ liệu doanh nghiệp được phân công (Enterprise Data Domains)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {profileForm.assignedDomains.map((dom) => (
                      <span
                        key={dom}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 text-stone-800 border border-stone-200"
                      >
                        {dom}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500 italic">
                    * Quyền truy cập miền dữ liệu do Quản trị viên (Administrator) thiết lập theo chính sách bảo mật thông tin PHS.
                  </p>
                </div>

                {/* Submit button */}
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu cập nhật thông tin cá nhân</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================== TAB 2: ADMIN USER & ACCESS MANAGEMENT (@PHS) ======================== */}
      {activeTab === 'USER_MANAGEMENT' && (
        <div className="space-y-6">
          {/* Permission Notice if not Admin */}
          {userRole !== 'Administrator' && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <BadgeAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Chế độ xem trước (View-Only Management Mode)
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Bạn đang đăng nhập với vai trò <strong>{userRole}</strong>. Quyền thêm mới, sửa đổi phân quyền và khóa tài khoản nhân viên theo email @phs yêu cầu vai trò <strong>Administrator</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onChangeRole('Administrator')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs shrink-0 transition-colors"
              >
                Chuyển sang Administrator để thử nghiệm
              </button>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs">
              <div className="text-[11px] font-medium text-stone-500">Tổng tài khoản PHS</div>
              <div className="text-2xl font-bold text-stone-900 mt-1">{usersList.length}</div>
              <div className="text-[10px] text-matcha-700 mt-0.5">100% email @phs.vn</div>
            </div>

            <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs">
              <div className="text-[11px] font-medium text-stone-500">Maker (Đề xuất & Lập)</div>
              <div className="text-2xl font-bold text-stone-900 mt-1">
                {usersList.filter((u) => u.role === 'Maker').length}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Soạn thảo catalog & tờ trình</div>
            </div>

            <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs">
              <div className="text-[11px] font-medium text-bronze-700">Checker (Thẩm tra & Duyệt)</div>
              <div className="text-2xl font-bold text-bronze-900 mt-1">
                {usersList.filter((u) => u.role === 'Checker').length}
              </div>
              <div className="text-[10px] text-bronze-600 mt-0.5">Thẩm định độc lập 4 mắt</div>
            </div>

            <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs">
              <div className="text-[11px] font-medium text-stone-500">Đang hoạt động (Active)</div>
              <div className="text-2xl font-bold text-matcha-700 mt-1">
                {usersList.filter((u) => u.status === 'Active').length}
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">
                {usersList.filter((u) => u.status === 'Inactive').length} tài khoản tạm khóa
              </div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white border border-matcha-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[240px] flex-1 max-w-md">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm theo email @phs, mã nhân viên, họ tên, phòng ban..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-matcha-500 focus:bg-white"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="Maker">Maker</option>
                  <option value="Checker">Checker</option>
                  <option value="Administrator">Administrator</option>
                  <option value="View-only">View-only</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Active">Active (Hoạt động)</option>
                  <option value="Inactive">Inactive (Tạm khóa)</option>
                </select>
              </div>

              {/* Add User button */}
              {(userRole === 'Administrator') && (
                <button
                  onClick={handleOpenCreateModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm tài khoản @phs</span>
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-3 px-4">Nhân viên & Mã NV</th>
                    <th className="py-3 px-4">Email công ty (@phs)</th>
                    <th className="py-3 px-4">Phòng ban</th>
                    <th className="py-3 px-4">Vai trò (Role)</th>
                    <th className="py-3 px-4">Miền phụ trách</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-matcha-700 to-bronze-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {user.fullName.split(' ').slice(-1)[0]?.[0] || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-stone-900">{user.fullName}</div>
                              <div className="font-mono text-[10px] text-matcha-800 font-bold">
                                {user.staffId}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-stone-800 font-medium">
                            <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{user.companyEmail}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-stone-600 max-w-[200px] truncate">
                          {user.department}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              user.role === 'Administrator'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : user.role === 'Checker'
                                ? 'bg-bronze-50 text-bronze-800 border-bronze-200'
                                : user.role === 'Maker'
                                ? 'bg-matcha-50 text-matcha-800 border-matcha-200'
                                : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {user.assignedDomains.slice(0, 2).map((dom) => (
                              <span
                                key={dom}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700"
                              >
                                {dom}
                              </span>
                            ))}
                            {user.assignedDomains.length > 2 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-200 text-stone-600 font-semibold">
                                +{user.assignedDomains.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-stone-100 text-stone-500 border border-stone-200'
                            }`}
                          >
                            {user.status === 'Active' ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-matcha-800 hover:bg-matcha-50 transition-colors"
                              title="Chỉnh sửa & Phân quyền"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {userRole === 'Administrator' && (
                              <>
                                <button
                                  onClick={() => handleToggleUserStatus(user.id)}
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                                  title={user.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}
                                >
                                  {user.status === 'Active' ? (
                                    <Lock className="w-3.5 h-3.5" />
                                  ) : (
                                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-stone-500 text-xs">
                        Không tìm thấy tài khoản nhân viên phù hợp với tiêu chí tìm kiếm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL: ADD / EDIT USER & ASSIGN ROLES ======================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-matcha-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-matcha-100 text-matcha-800 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {modalMode === 'CREATE' ? 'Thêm mới Tài khoản Nhân viên (@phs)' : 'Chỉnh sửa Phân quyền Tài khoản'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Cấp phát vai trò và phân quyền miền dữ liệu theo email doanh nghiệp PHS.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">
                    Họ và tên nhân viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingUser.fullName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                    required
                  />
                </div>

                {/* Staff ID */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">
                    Mã số nhân viên (Staff ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingUser.staffId || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, staffId: e.target.value.toUpperCase() })}
                    placeholder="VD: PHS0892"
                    className="w-full text-xs font-mono font-bold bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                    required
                  />
                </div>

                {/* Company Email (@phs.vn) */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-stone-700">
                    Email công ty (Bắt buộc đuôi @phs.vn hoặc @phs) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={editingUser.companyEmail || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, companyEmail: e.target.value.toLowerCase() })}
                      placeholder="user@phs.vn"
                      className={`w-full text-xs pl-9 pr-24 py-2 bg-stone-50 border rounded-xl focus:outline-none focus:ring-1 ${
                        isPhsEmail(editingUser.companyEmail || '')
                          ? 'border-matcha-400 focus:ring-matcha-500'
                          : 'border-rose-300 focus:ring-rose-500'
                      }`}
                      required
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] font-bold text-matcha-800 bg-matcha-100 px-2 py-0.5 rounded">
                      PHS Verified
                    </span>
                  </div>
                  {!isPhsEmail(editingUser.companyEmail || '') && editingUser.companyEmail && (
                    <p className="text-[10px] text-rose-600 font-medium">
                      ⚠️ Bắt buộc phải là email nhân viên công ty (@phs.vn hoặc @phs).
                    </p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Phòng ban / Bộ phận</label>
                  <input
                    type="text"
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    placeholder="VD: Khối Quản trị Dữ liệu C360"
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Số điện thoại</label>
                  <input
                    type="text"
                    value={editingUser.phoneNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                    placeholder="VD: 0908 xxx xxx"
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">
                    Vai trò hệ thống (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingUser.role || 'Maker'}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setEditingUser({
                        ...editingUser,
                        role: newRole,
                        permissions: {
                          canCreateRequest: newRole === 'Maker' || newRole === 'Administrator',
                          canApproveRequest: newRole === 'Checker' || newRole === 'Administrator',
                          canEditCatalog: newRole === 'Maker' || newRole === 'Administrator',
                          canExportData: true,
                          canManageUsers: newRole === 'Administrator'
                        }
                      });
                    }}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  >
                    <option value="Maker">Maker (Lập tờ trình & Soạn thảo)</option>
                    <option value="Checker">Checker (Thẩm tra & Phê duyệt độc lập)</option>
                    <option value="Administrator">Administrator (Toàn quyền quản trị & phân quyền)</option>
                    <option value="View-only">View-only (Chỉ tra cứu thông tin)</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Trạng thái tài khoản</label>
                  <select
                    value={editingUser.status || 'Active'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  >
                    <option value="Active">Active (Đang hoạt động)</option>
                    <option value="Inactive">Inactive (Tạm khóa truy cập)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <label className="block font-bold text-stone-700">
                  Phân quyền chức năng chi tiết (Capabilities)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.canCreateRequest ?? false}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          permissions: {
                            ...editingUser.permissions!,
                            canCreateRequest: e.target.checked
                          }
                        })
                      }
                      className="rounded text-matcha-600 focus:ring-matcha-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-medium text-stone-800">Quyền lập & soạn tờ trình</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.canApproveRequest ?? false}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          permissions: {
                            ...editingUser.permissions!,
                            canApproveRequest: e.target.checked
                          }
                        })
                      }
                      className="rounded text-matcha-600 focus:ring-matcha-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-medium text-stone-800">Quyền thẩm tra & phê duyệt</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.canEditCatalog ?? false}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          permissions: {
                            ...editingUser.permissions!,
                            canEditCatalog: e.target.checked
                          }
                        })
                      }
                      className="rounded text-matcha-600 focus:ring-matcha-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-medium text-stone-800">Quyền cập nhật catalog dữ liệu</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingUser.permissions?.canManageUsers ?? false}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          permissions: {
                            ...editingUser.permissions!,
                            canManageUsers: e.target.checked
                          }
                        })
                      }
                      className="rounded text-matcha-600 focus:ring-matcha-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-medium text-stone-800">Quyền quản trị phân quyền @phs</span>
                  </label>
                </div>
              </div>

              {/* Assigned Domains Selection */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100">
                <label className="block font-bold text-stone-700">
                  Miền dữ liệu doanh nghiệp được truy cập (Assigned Domains)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-stone-50 border border-stone-200 rounded-xl">
                  {ENTERPRISE_DOMAINS.map((domain) => {
                    const isChecked = (editingUser.assignedDomains || []).includes(domain);
                    return (
                      <button
                        type="button"
                        key={domain}
                        onClick={() => {
                          const currentDomains = editingUser.assignedDomains || [];
                          const updated = isChecked
                            ? currentDomains.filter((d) => d !== domain)
                            : [...currentDomains, domain];
                          setEditingUser({ ...editingUser, assignedDomains: updated });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          isChecked
                            ? 'bg-matcha-600 text-white border-matcha-700 shadow-2xs'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-matcha-300'
                        }`}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {domain}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{modalMode === 'CREATE' ? 'Tạo mới tài khoản @phs' : 'Lưu phân quyền'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
