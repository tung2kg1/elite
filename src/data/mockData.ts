import {
  VocabularyTerm,
  DataElement,
  CanonicalEvent,
  ProfileConfig,
  CustomerTimelineConfig,
  LifecycleModelConfig,
  GatePolicyConfig,
  NBAStrategyConfig,
  ApprovalRequest,
  UserProfile
} from '../types';

// Toàn bộ dữ liệu catalog và tờ trình khởi tạo rỗng (chưa có data, không mô phỏng)
export const INITIAL_VOCABULARY: VocabularyTerm[] = [];
export const INITIAL_DATA_ELEMENTS: DataElement[] = [];
export const INITIAL_CANONICAL_EVENTS: CanonicalEvent[] = [];
export const INITIAL_PROFILES: ProfileConfig[] = [];
export const INITIAL_TIMELINES: CustomerTimelineConfig[] = [];
export const INITIAL_LIFECYCLE_MODELS: LifecycleModelConfig[] = [];
export const INITIAL_GATE_POLICIES: GatePolicyConfig[] = [];
export const INITIAL_NBA_STRATEGIES: NBAStrategyConfig[] = [];

export const INITIAL_BUSINESS_VOCABULARIES = INITIAL_VOCABULARY;
export const INITIAL_CUSTOMER_TIMELINES = INITIAL_TIMELINES;
export const INITIAL_APPROVAL_REQUESTS: ApprovalRequest[] = [];

// Danh sách tài khoản vai trò hệ thống phục vụ luồng Maker-Checker
export const INITIAL_COMPANY_USERS: UserProfile[] = [
  {
    id: 'USR_PHS_00',
    fullName: 'Chung Minh Huy',
    staffId: '2593',
    companyEmail: 'huychungphs@gmail.com',
    role: 'Maker',
    department: 'Hội sở',
    phoneNumber: '0908123456',
    joinedDate: '2025-01-01',
    status: 'Active',
    assignedDomains: ['Customer', 'Trading', 'Cash', 'Portfolio', 'Margin & Credit', 'Product', 'Compliance', 'Channel', 'Broker/RM'],
    accessibleModules: ['approval_hub', 'vocabulary', 'data_dictionary', 'event_taxonomy', 'profile_config', 'customer_timeline', 'state_lifecycle', 'suitability_gate', 'next_best_action', 'settings'],
    permissions: {
      canCreateRequest: true,
      canApproveRequest: true,
      canEditCatalog: true,
      canExportData: true,
      canManageUsers: true
    }
  },
  {
    id: 'USR_PHS_01',
    fullName: 'Nguyễn Văn An',
    staffId: 'PHS0892',
    companyEmail: 'an.nv@phs.vn',
    role: 'Maker',
    department: 'Khối Quản trị Khách hàng & Dữ liệu C360',
    phoneNumber: '',
    joinedDate: '2025-01-01',
    status: 'Active',
    assignedDomains: ['Customer', 'Trading', 'Cash', 'Product', 'Channel'],
    accessibleModules: ['vocabulary', 'data_dictionary', 'event_taxonomy', 'profile_config', 'customer_timeline', 'state_lifecycle', 'suitability_gate', 'next_best_action', 'approval_hub', 'settings'],
    permissions: {
      canCreateRequest: true,
      canApproveRequest: false,
      canEditCatalog: true,
      canExportData: true,
      canManageUsers: false
    }
  },
  {
    id: 'USR_PHS_02',
    fullName: 'Trần Thị Mai',
    staffId: 'PHS0541',
    companyEmail: 'mai.tt@phs.vn',
    role: 'Checker',
    department: 'Phòng Thẩm tra & Quản trị Rủi ro Dữ liệu',
    phoneNumber: '',
    joinedDate: '2025-01-01',
    status: 'Active',
    assignedDomains: ['Customer', 'Trading', 'Cash', 'Portfolio', 'Margin & Credit', 'Product', 'Compliance', 'Channel'],
    accessibleModules: ['vocabulary', 'data_dictionary', 'event_taxonomy', 'profile_config', 'customer_timeline', 'state_lifecycle', 'suitability_gate', 'next_best_action', 'approval_hub', 'settings'],
    permissions: {
      canCreateRequest: false,
      canApproveRequest: true,
      canEditCatalog: false,
      canExportData: true,
      canManageUsers: false
    }
  },
  {
    id: 'USR_PHS_03',
    fullName: 'Lê Hoàng Long',
    staffId: 'PHS0012',
    companyEmail: 'admin.longlh@phs.vn',
    role: 'Administrator',
    department: 'Ban Công nghệ Thông tin & Kiến trúc Nền tảng',
    phoneNumber: '',
    joinedDate: '2025-01-01',
    status: 'Active',
    assignedDomains: ['Customer', 'Trading', 'Cash', 'Portfolio', 'Margin & Credit', 'Product', 'Compliance', 'Channel'],
    accessibleModules: ['vocabulary', 'data_dictionary', 'event_taxonomy', 'profile_config', 'customer_timeline', 'state_lifecycle', 'suitability_gate', 'next_best_action', 'approval_hub', 'settings'],
    permissions: {
      canCreateRequest: true,
      canApproveRequest: true,
      canEditCatalog: true,
      canExportData: true,
      canManageUsers: true
    }
  },
  {
    id: 'USR_PHS_04',
    fullName: 'Phạm Quốc Cường',
    staffId: 'PHS1208',
    companyEmail: 'cuong.pq@phs.vn',
    role: 'View-only',
    department: 'Khối Kinh doanh Môi giới & Chăm sóc Khách hàng',
    phoneNumber: '',
    joinedDate: '2025-01-01',
    status: 'Active',
    assignedDomains: ['Customer', 'Product', 'Channel'],
    accessibleModules: ['vocabulary', 'data_dictionary', 'event_taxonomy', 'profile_config', 'customer_timeline', 'settings'],
    permissions: {
      canCreateRequest: false,
      canApproveRequest: false,
      canEditCatalog: false,
      canExportData: false,
      canManageUsers: false
    }
  }
];
