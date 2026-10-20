import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Eye,
  Edit3,
  Trash2,
  Send,
  RotateCcw,
  Check,
  X,
  Layers,
  Sparkles,
  ExternalLink,
  MessageSquare,
  History,
  GitCompare,
  Building2,
  UserCheck,
  Shield,
  HelpCircle,
  AlertCircle,
  ClipboardCheck,
  Activity,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  List,
  GitBranch
} from 'lucide-react';
import {
  ApprovalRequest,
  RequestAuditLog,
  RequestPriority,
  RequestStatus,
  RequestType,
  ModuleId,
  EnterpriseDomain,
  ENTERPRISE_DOMAINS,
  UserRole
} from '../../types';
import { getStatusBadgeClass, getStatusLabel, getApprovalProgressInfo } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface RequestApprovalModuleProps {
  requests: ApprovalRequest[];
  onUpdateRequests: (requests: ApprovalRequest[]) => void;
  onApproveRequest: (request: ApprovalRequest, checkerNote: string) => void;
  onRejectRequest: (request: ApprovalRequest, rejectionReason: string) => void;
  onActivateRequest?: (request: ApprovalRequest) => void;
  userRole: UserRole;
  selectedDomainFilter: EnterpriseDomain | 'ALL';
  globalSearch: string;
  onNavigateToModule?: (moduleId: ModuleId, entityId?: string) => void;
  preselectedRequestId?: string | null;
  onLoadSampleData?: () => void;
}

const MODULE_OPTIONS: { id: ModuleId; nameVi: string; nameEn: string }[] = [
  { id: 'vocabulary', nameVi: 'Từ điển thuật ngữ chuẩn', nameEn: 'Business Vocabulary' },
  { id: 'data_dictionary', nameVi: 'Từ điển phần tử dữ liệu', nameEn: 'Data Dictionary' },
  { id: 'event_taxonomy', nameVi: 'Phân loại sự kiện chuẩn', nameEn: 'Event Taxonomy' },
  { id: 'profile_config', nameVi: 'Cấu hình hồ sơ 360', nameEn: 'Profile Config' },
  { id: 'customer_timeline', nameVi: 'Dòng thời gian sự kiện', nameEn: 'Customer Timeline' },
  { id: 'state_lifecycle', nameVi: 'Trạng thái & Vòng đời KH', nameEn: 'State & Lifecycle' },
  { id: 'suitability_gate', nameVi: 'Cổng kiểm soát tuân thủ', nameEn: 'Suitability Gate' },
  { id: 'next_best_action', nameVi: 'Động cơ ra quyết định (NBA)', nameEn: 'Next Best Action' }
];

export const RequestApprovalModule: React.FC<RequestApprovalModuleProps> = ({
  requests,
  onUpdateRequests,
  onApproveRequest,
  onRejectRequest,
  onActivateRequest,
  userRole,
  selectedDomainFilter,
  globalSearch,
  onNavigateToModule,
  preselectedRequestId,
  onLoadSampleData
}) => {
  // Screen Mode: 'LIST' or 'DETAIL'
  const [screen, setScreen] = useState<'LIST' | 'DETAIL'>(preselectedRequestId ? 'DETAIL' : 'LIST');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    preselectedRequestId || (requests.length > 0 ? requests[0].id : null)
  );

  // Tabs inside DETAIL
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'DIFF' | 'AUDIT' | 'DISCUSSION'>('OVERVIEW');

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<'TABLE' | 'PIPELINE'>('TABLE');
  const [mainStatusTab, setMainStatusTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'ACTIVE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [moduleFilter, setModuleFilter] = useState<ModuleId | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<RequestPriority | 'ALL'>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [selectedScopeTab, setSelectedScopeTab] = useState<'ALL' | 'PENDING_MY_ACTION' | 'MY_REQUESTS'>('ALL');

  // Batch selection for Checker
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showBatchApproveModal, setShowBatchApproveModal] = useState<boolean>(false);
  const [workflowPreviewRequest, setWorkflowPreviewRequest] = useState<ApprovalRequest | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<ApprovalRequest>>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [checkerActionNote, setCheckerActionNote] = useState<string>('');
  const [discussionComment, setDiscussionComment] = useState<string>('');

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  const isMaker = userRole === 'Maker' || userRole === 'Administrator';
  const isChecker = userRole === 'Checker' || userRole === 'Administrator';

  // Filter logic
  const filteredRequests = requests.filter((req) => {
    // Domain filter
    if (selectedDomainFilter !== 'ALL' && req.businessDomain !== selectedDomainFilter) {
      return false;
    }
    // Main 3-status filter requested by user: Chờ duyệt, Đã duyệt, Đang hoạt động
    if (mainStatusTab === 'PENDING') {
      if (req.status !== 'Pending Approval' && req.status !== 'Draft') return false;
    } else if (mainStatusTab === 'APPROVED') {
      if (req.status !== 'Approved') return false;
    } else if (mainStatusTab === 'ACTIVE') {
      if (req.status !== 'Active') return false;
    }

    // Status filter dropdown
    if (statusFilter !== 'ALL' && req.status !== statusFilter) {
      return false;
    }
    // Module filter
    if (moduleFilter !== 'ALL' && req.targetModule !== moduleFilter) {
      return false;
    }
    // Priority filter
    if (priorityFilter !== 'ALL' && req.priority !== priorityFilter) {
      return false;
    }
    // Scope tab
    if (selectedScopeTab === 'PENDING_MY_ACTION') {
      if (req.status !== 'Pending Approval') return false;
    } else if (selectedScopeTab === 'MY_REQUESTS') {
      if (!req.maker.includes('Maker') && !req.maker.includes('Huy') && isMaker) return false;
    }

    // Search term
    const term = (globalSearch || localSearch).trim().toLowerCase();
    if (term) {
      const matchCode = req.requestCode.toLowerCase().includes(term);
      const matchTitle = req.title.toLowerCase().includes(term);
      const matchEntity = req.targetEntityCode.toLowerCase().includes(term) || req.targetEntityName.toLowerCase().includes(term);
      const matchMaker = req.maker.toLowerCase().includes(term);
      const matchJustification = req.businessJustification.toLowerCase().includes(term);
      if (!matchCode && !matchTitle && !matchEntity && !matchMaker && !matchJustification) {
        return false;
      }
    }

    return true;
  });

  // 3 Primary Status Counts: Chờ duyệt, Đã duyệt, Đang hoạt động
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'Pending Approval' || r.status === 'Draft').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;
  const activeCount = requests.filter((r) => r.status === 'Active').length;
  const rejectedCount = requests.filter((r) => r.status === 'Rejected').length;

  // Handlers for Detail View
  const handleOpenDetail = (req: ApprovalRequest) => {
    setSelectedRequestId(req.id);
    setDetailTab('OVERVIEW');
    setCheckerActionNote('');
    setScreen('DETAIL');
  };

  // Activation Handler (From Approved to Active)
  const handleActivate = (req: ApprovalRequest) => {
    if (onActivateRequest) {
      onActivateRequest(req);
    } else {
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const activateLog: RequestAuditLog = {
        id: `LOG_${Date.now()}`,
        timestamp: nowStr,
        actor: userRole === 'Checker' ? 'Trần Thị Mai (Checker)' : `${userRole}`,
        role: userRole,
        action: 'APPROVE',
        comment: 'Kích hoạt cấu hình đưa vào trạng thái Đang hoạt động trên hệ thống Catalog Production.'
      };
      const updatedReq: ApprovalRequest = {
        ...req,
        status: 'Active',
        auditLogs: [...req.auditLogs, activateLog]
      };
      onUpdateRequests(requests.map((r) => (r.id === req.id ? updatedReq : r)));
    }
  };

  // Create Request Handler (CRUD - C)
  const handleOpenCreateModal = () => {
    const newReq: Partial<ApprovalRequest> = {
      id: `REQ_${Date.now()}`,
      requestCode: `REQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`,
      title: '',
      targetModule: 'vocabulary',
      targetModuleName: 'Business Vocabulary (Từ điển thuật ngữ chuẩn)',
      targetEntityId: '',
      targetEntityCode: '',
      targetEntityName: '',
      businessDomain: selectedDomainFilter !== 'ALL' ? selectedDomainFilter : 'Customer',
      requestType: 'CREATE',
      priority: 'Medium',
      status: 'Pending Approval',
      maker: userRole === 'Maker' ? 'Chung Minh Huy (Maker - Hội sở)' : 'Quản trị viên (Maker)',
      makerRole: userRole === 'Maker' ? 'Maker' : 'Administrator',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      businessJustification: '',
      legalOrPolicyReference: '',
      impactSummary: '',
      afterData: {
        status: 'Active',
        description: 'Nội dung cấu hình mới đang trình phê duyệt.'
      },
      auditLogs: []
    };
    setFormData(newReq);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleValidateRequestForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.title?.trim()) errors.title = 'Bắt buộc nhập tiêu đề tờ trình yêu cầu.';
    if (!formData.targetEntityCode?.trim()) errors.targetEntityCode = 'Bắt buộc nhập mã đối tượng cấu hình.';
    if (!formData.targetEntityName?.trim()) errors.targetEntityName = 'Bắt buộc nhập tên đối tượng.';
    if (!formData.businessJustification?.trim()) {
      errors.businessJustification = 'Bắt buộc nhập căn cứ và lý do thay đổi nghiệp vụ.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRequest = (submitDirectly: boolean = false) => {
    if (!handleValidateRequestForm()) return;

    const moduleObj = MODULE_OPTIONS.find((m) => m.id === formData.targetModule);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const initialAuditLog: RequestAuditLog = {
      id: `LOG_${Date.now()}_1`,
      timestamp: nowStr,
      actor: formData.maker || 'Maker',
      role: 'Maker',
      action: 'SUBMIT',
      comment: 'Tạo yêu cầu và gửi trực tiếp sang Checker thẩm tra.'
    };

    const newRequest: ApprovalRequest = {
      ...(formData as ApprovalRequest),
      targetModuleName: moduleObj ? `${moduleObj.nameEn} (${moduleObj.nameVi})` : 'Catalog Config',
      status: 'Pending Approval',
      submittedAt: nowStr,
      checker: 'Ban Kiểm soát & Phê duyệt (Checker Pool)',
      checkerRole: 'Checker',
      auditLogs: [initialAuditLog]
    };

    const updated = [newRequest, ...requests];
    onUpdateRequests(updated);
    setShowCreateModal(false);
    setSelectedRequestId(newRequest.id);
    setScreen('DETAIL');
  };

  // Update Request Handler (CRUD - U)
  const handleOpenEditModal = (req: ApprovalRequest) => {
    setFormData({ ...req });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleSaveEditRequest = (resubmit: boolean = false) => {
    if (!handleValidateRequestForm()) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updateLog: RequestAuditLog = {
      id: `LOG_${Date.now()}`,
      timestamp: nowStr,
      actor: userRole === 'Maker' ? 'Maker' : 'Administrator',
      role: userRole,
      action: resubmit ? 'SUBMIT' : 'UPDATE',
      comment: resubmit
        ? 'Cập nhật lại thông tin hồ sơ và tái nộp tờ trình sang Checker.'
        : 'Chỉnh sửa nội dung yêu cầu.'
    };

    const updatedReq: ApprovalRequest = {
      ...(formData as ApprovalRequest),
      status: resubmit ? 'Pending Approval' : formData.status || 'Pending Approval',
      submittedAt: resubmit ? nowStr : formData.submittedAt,
      auditLogs: [...(formData.auditLogs || []), updateLog]
    };

    const updatedList = requests.map((r) => (r.id === updatedReq.id ? updatedReq : r));
    onUpdateRequests(updatedList);
    setShowEditModal(false);
    setSelectedRequestId(updatedReq.id);
  };

  // Withdraw / Cancel Request (CRUD - U)
  const handleCancelRequest = (req: ApprovalRequest) => {
    const reason = prompt('Nhập lý do thu hồi / hủy yêu cầu này:', 'Maker chủ động thu hồi để điều chỉnh lại.');
    if (reason === null) return;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const cancelLog: RequestAuditLog = {
      id: `LOG_${Date.now()}`,
      timestamp: nowStr,
      actor: 'Maker',
      role: 'Maker',
      action: 'CANCEL',
      comment: `Thu hồi yêu cầu. Lý do: ${reason}`
    };

    const updatedReq: ApprovalRequest = {
      ...req,
      status: 'Cancelled',
      auditLogs: [...req.auditLogs, cancelLog]
    };

    onUpdateRequests(requests.map((r) => (r.id === req.id ? updatedReq : r)));
  };

  // Delete Request (CRUD - D)
  const handleDeleteRequest = (req: ApprovalRequest) => {
    if (confirm(`Bạn có chắc chắn muốn xóa yêu cầu ${req.requestCode} không?`)) {
      const remaining = requests.filter((r) => r.id !== req.id);
      onUpdateRequests(remaining);
      if (selectedRequestId === req.id) {
        setScreen('LIST');
        setSelectedRequestId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  // Checker Approve Handler
  const handleConfirmApprove = () => {
    if (!selectedRequest) return;
    const note = checkerActionNote.trim() || 'Đã thẩm tra đầy đủ căn cứ pháp lý và tính nhất quán dữ liệu. Phê duyệt ban hành.';
    onApproveRequest(selectedRequest, note);
    setShowApproveModal(false);
    setCheckerActionNote('');
  };

  // Checker Reject Handler
  const handleConfirmReject = () => {
    if (!selectedRequest) return;
    if (!checkerActionNote.trim()) {
      alert('Bắt buộc nhập lý do từ chối để Maker có cơ sở chỉnh sửa bổ sung.');
      return;
    }
    onRejectRequest(selectedRequest, checkerActionNote.trim());
    setShowRejectModal(false);
    setCheckerActionNote('');
  };

  // Batch Approve Handler for Checker
  const handleBatchApprove = () => {
    const note = 'Phê duyệt hàng loạt theo thẩm quyền Checker.';
    selectedBatchIds.forEach((id) => {
      const req = requests.find((r) => r.id === id);
      if (req && req.status === 'Pending Approval') {
        onApproveRequest(req, note);
      }
    });
    setSelectedBatchIds([]);
    setShowBatchApproveModal(false);
  };

  // Add Comment/Discussion
  const handleAddComment = () => {
    if (!selectedRequest || !discussionComment.trim()) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const commentLog: RequestAuditLog = {
      id: `LOG_${Date.now()}`,
      timestamp: nowStr,
      actor: userRole === 'Checker' ? 'Trần Thị Mai (Checker)' : userRole === 'Maker' ? 'Nguyễn Văn Hùng (Maker)' : `${userRole}`,
      role: userRole,
      action: 'COMMENT',
      comment: discussionComment.trim()
    };

    const updatedReq: ApprovalRequest = {
      ...selectedRequest,
      auditLogs: [...selectedRequest.auditLogs, commentLog]
    };

    onUpdateRequests(requests.map((r) => (r.id === selectedRequest.id ? updatedReq : r)));
    setDiscussionComment('');
  };

  const getPriorityBadgeClass = (p: RequestPriority) => {
    switch (p) {
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High':
        return 'bg-bronze-100 text-bronze-800 border-bronze-300';
      case 'Medium':
        return 'bg-matcha-100 text-matcha-800 border-matcha-300';
      case 'Low':
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getRequestTypeBadge = (t: RequestType) => {
    switch (t) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-matcha-100 text-matcha-900 border border-matcha-300">Tạo mới (Create)</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Cập nhật (Update)</span>;
      case 'DEPRECATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-800 border border-stone-300">Ngưng áp dụng</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">Xóa bỏ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================== SCREEN 01: DANH SÁCH YÊU CẦU & BỘ LỌC ======================== */}
      {screen === 'LIST' ? (
        <div className="space-y-5">
          {/* Header & Quick Action Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Yêu cầu & Phê duyệt
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* View Switcher: Bảng vs Sơ đồ luồng */}
              <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setViewMode('TABLE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'TABLE'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Dạng bảng</span>
                </button>
                <button
                  onClick={() => setViewMode('PIPELINE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'PIPELINE'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Sơ đồ luồng</span>
                </button>
              </div>

              {isMaker && (
                <button
                  onClick={handleOpenCreateModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-matcha-700 hover:bg-matcha-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  id="btn-create-request"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo yêu cầu mới</span>
                </button>
              )}

              {isChecker && selectedBatchIds.length > 0 && (
                <button
                  onClick={() => setShowBatchApproveModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-bronze-600 hover:bg-bronze-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Duyệt hàng loạt ({selectedBatchIds.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Status Cards: 3 Trạng thái cài đặt (Chờ duyệt, Đã duyệt, Đang hoạt động) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Chờ duyệt */}
            <button
              onClick={() => {
                setMainStatusTab(mainStatusTab === 'PENDING' ? 'ALL' : 'PENDING');
                setStatusFilter('ALL');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                mainStatusTab === 'PENDING'
                  ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-200 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/30 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-stone-900">Chờ duyệt</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-950 font-mono">
                  {pendingCount}
                </span>
              </div>
              <div className="text-xs text-stone-500">
                Yêu cầu cài đặt đang chờ Checker thẩm định & phê duyệt
              </div>
            </button>

            {/* 2. Đã duyệt */}
            <button
              onClick={() => {
                setMainStatusTab(mainStatusTab === 'APPROVED' ? 'ALL' : 'APPROVED');
                setStatusFilter('ALL');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                mainStatusTab === 'APPROVED'
                  ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-sky-300 hover:bg-sky-50/30 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-stone-900">Đã duyệt</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-200 text-sky-950 font-mono">
                  {approvedCount}
                </span>
              </div>
              <div className="text-xs text-stone-500">
                Checker đã phê chuẩn ban hành, sẵn sàng kích hoạt
              </div>
            </button>

            {/* 3. Đang hoạt động */}
            <button
              onClick={() => {
                setMainStatusTab(mainStatusTab === 'ACTIVE' ? 'ALL' : 'ACTIVE');
                setStatusFilter('ALL');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                mainStatusTab === 'ACTIVE'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-200 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-stone-900">Đang hoạt động</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-950 font-mono">
                  {activeCount}
                </span>
              </div>
              <div className="text-xs text-stone-500">
                Cấu hình đã kích hoạt và đang vận hành trong Catalog
              </div>
            </button>
          </div>

          {/* Filter Status Active Banner */}
          {mainStatusTab !== 'ALL' && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-stone-700 font-medium">
                Đang lọc danh sách: <strong>{mainStatusTab === 'PENDING' ? 'Chờ duyệt' : mainStatusTab === 'APPROVED' ? 'Đã duyệt' : 'Đang hoạt động'}</strong> ({filteredRequests.length} yêu cầu)
              </span>
              <button
                onClick={() => setMainStatusTab('ALL')}
                className="text-matcha-700 hover:text-matcha-900 font-semibold cursor-pointer"
              >
                Hiển thị tất cả
              </button>
            </div>
          )}

          {/* Multi-criteria Filter Bar */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Quick Tab Selector */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => { setSelectedScopeTab('ALL'); setMainStatusTab('ALL'); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedScopeTab === 'ALL' && mainStatusTab === 'ALL'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Tất cả yêu cầu
                </button>
                <button
                  onClick={() => { setSelectedScopeTab('ALL'); setMainStatusTab('PENDING'); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    mainStatusTab === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>Chờ duyệt</span>
                  {pendingCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-amber-800 text-[10px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setSelectedScopeTab('ALL'); setMainStatusTab('APPROVED'); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    mainStatusTab === 'APPROVED'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>Đã duyệt</span>
                  {approvedCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-sky-800 text-[10px] font-bold flex items-center justify-center">
                      {approvedCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setSelectedScopeTab('ALL'); setMainStatusTab('ACTIVE'); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    mainStatusTab === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>Đang hoạt động</span>
                  {activeCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </button>
                {isMaker && (
                  <button
                    onClick={() => { setSelectedScopeTab('MY_REQUESTS'); setMainStatusTab('ALL'); }}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      selectedScopeTab === 'MY_REQUESTS'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Yêu cầu của Maker
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mã REQ, đối tượng, lý do..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-matcha-500 focus:bg-white text-stone-800 placeholder-stone-400"
                />
              </div>
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 border-t border-stone-100 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">
                  Trạng thái cài đặt:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Pending Approval">Chờ duyệt (Pending Approval)</option>
                  <option value="Approved">Đã duyệt (Approved)</option>
                  <option value="Active">Đang hoạt động (Active)</option>
                  <option value="Rejected">Từ chối (Rejected)</option>
                  <option value="Cancelled">Đã thu hồi (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">
                  Module tác động:
                </label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                >
                  <option value="ALL">Tất cả module (8)</option>
                  {MODULE_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nameVi} ({m.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-500 mb-1">
                  Mức độ ưu tiên:
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                >
                  <option value="ALL">Tất cả mức ưu tiên</option>
                  <option value="Urgent">Khẩn cấp (Urgent)</option>
                  <option value="High">Cao (High)</option>
                  <option value="Medium">Trung bình (Medium)</option>
                  <option value="Low">Thấp (Low)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setModuleFilter('ALL');
                    setPriorityFilter('ALL');
                    setLocalSearch('');
                    setSelectedScopeTab('ALL');
                  }}
                  className="w-full py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Request Data Table or Pipeline Board View */}
          {requests.length === 0 ? (
            <EmptyDataState
              icon={ClipboardCheck}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có tờ trình phê duyệt nào (Maker-Checker Workflow)"
              primaryAction={{
                label: 'Tạo tờ trình phê duyệt mới',
                onClick: handleOpenCreateModal,
                icon: Plus
              }}
            />
          ) : viewMode === 'PIPELINE' ? (
            /* ==================== 3-STATUS BOARD VIEW ==================== */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: Chờ duyệt */}
                <div className="bg-amber-50/40 border border-amber-200 rounded-2xl p-3.5 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                        1
                      </span>
                      <h4 className="font-bold text-xs text-amber-950">Chờ duyệt</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-mono text-[10px] font-bold">
                      {filteredRequests.filter((r) => r.status === 'Pending Approval' || r.status === 'Draft').length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {filteredRequests.filter((r) => r.status === 'Pending Approval' || r.status === 'Draft').length === 0 ? (
                      <div className="text-center py-8 text-stone-400 text-xs">
                        Không có yêu cầu chờ duyệt
                      </div>
                    ) : (
                      filteredRequests
                        .filter((r) => r.status === 'Pending Approval' || r.status === 'Draft')
                        .map((req) => (
                          <div
                            key={req.id}
                            onClick={() => handleOpenDetail(req)}
                            className="p-3.5 bg-white rounded-xl border border-amber-200/80 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-matcha-900 text-xs">
                                {req.requestCode}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(req.priority || 'Medium')}`}>
                                {req.priority || 'Medium'}
                              </span>
                            </div>
                            <div className="font-semibold text-xs text-stone-900 line-clamp-2">
                              {req.title}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono flex items-center justify-between">
                              <span className="truncate max-w-[180px]">{req.targetEntityCode}</span>
                              <span className="text-stone-400">{req.targetModuleName || 'Chung'}</span>
                            </div>
                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                              <span className="text-stone-500 truncate max-w-[120px]">Maker: {req.maker.split(' ')[0]}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(req);
                                  }}
                                  className="text-matcha-700 hover:text-matcha-900 font-semibold cursor-pointer"
                                >
                                  Chi tiết
                                </button>
                                {(userRole === 'Checker' || userRole === 'Administrator') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRequestId(req.id);
                                      setShowApproveModal(true);
                                    }}
                                    className="px-2 py-1 bg-matcha-700 hover:bg-matcha-800 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                  >
                                    Duyệt
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Column 2: Đã duyệt */}
                <div className="bg-sky-50/40 border border-sky-200 rounded-2xl p-3.5 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
                        2
                      </span>
                      <h4 className="font-bold text-xs text-sky-950">Đã duyệt</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-950 font-mono text-[10px] font-bold">
                      {filteredRequests.filter((r) => r.status === 'Approved').length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {filteredRequests.filter((r) => r.status === 'Approved').length === 0 ? (
                      <div className="text-center py-8 text-stone-400 text-xs">
                        Không có yêu cầu nào đã duyệt
                      </div>
                    ) : (
                      filteredRequests
                        .filter((r) => r.status === 'Approved')
                        .map((req) => (
                          <div
                            key={req.id}
                            onClick={() => handleOpenDetail(req)}
                            className="p-3.5 bg-white rounded-xl border border-sky-200/80 hover:border-sky-400 hover:shadow-xs transition-all cursor-pointer space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-matcha-900 text-xs">
                                {req.requestCode}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                Đã duyệt
                              </span>
                            </div>
                            <div className="font-semibold text-xs text-stone-900 line-clamp-2">
                              {req.title}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono flex items-center justify-between">
                              <span className="truncate max-w-[180px]">{req.targetEntityCode}</span>
                              <span className="text-stone-400">{req.targetModuleName || 'Chung'}</span>
                            </div>
                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                              <span className="text-stone-500 truncate max-w-[120px]">Checker: {req.checker?.split(' ')[0] || '—'}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(req);
                                  }}
                                  className="text-matcha-700 hover:text-matcha-900 font-semibold cursor-pointer"
                                >
                                  Chi tiết
                                </button>
                                {(userRole === 'Checker' || userRole === 'Administrator') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleActivate(req);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                  >
                                    Kích hoạt
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Column 3: Đang hoạt động */}
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-3.5 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        3
                      </span>
                      <h4 className="font-bold text-xs text-emerald-950">Đang hoạt động</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-mono text-[10px] font-bold">
                      {filteredRequests.filter((r) => r.status === 'Active').length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {filteredRequests.filter((r) => r.status === 'Active').length === 0 ? (
                      <div className="text-center py-8 text-stone-400 text-xs">
                        Chưa có yêu cầu nào đang hoạt động
                      </div>
                    ) : (
                      filteredRequests
                        .filter((r) => r.status === 'Active')
                        .map((req) => (
                          <div
                            key={req.id}
                            onClick={() => handleOpenDetail(req)}
                            className="p-3.5 bg-white rounded-xl border border-emerald-200/80 hover:border-emerald-400 hover:shadow-xs transition-all cursor-pointer space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-matcha-900 text-xs">
                                {req.requestCode}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Đang hoạt động
                              </span>
                            </div>
                            <div className="font-semibold text-xs text-stone-900 line-clamp-2">
                              {req.title}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono flex items-center justify-between">
                              <span className="truncate max-w-[180px]">{req.targetEntityCode}</span>
                              <span className="text-stone-400">{req.targetModuleName || 'Chung'}</span>
                            </div>
                            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                              <span className="text-emerald-700 font-medium">Đã kích hoạt Catalog</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetail(req);
                                }}
                                className="text-matcha-700 hover:text-matcha-900 font-semibold cursor-pointer"
                              >
                                Chi tiết
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Rejected Requests lane if any */}
              {filteredRequests.filter((r) => r.status === 'Rejected').length > 0 && (
                <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✕
                      </span>
                      <h4 className="font-bold text-xs text-rose-950">Yêu cầu bị từ chối / Cần bổ sung</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono text-[10px] font-bold">
                      {filteredRequests.filter((r) => r.status === 'Rejected').length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRequests
                      .filter((r) => r.status === 'Rejected')
                      .map((req) => (
                        <div
                          key={req.id}
                          onClick={() => handleOpenDetail(req)}
                          className="p-3 bg-white rounded-xl border border-rose-200 hover:border-rose-400 hover:shadow-xs transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold text-matcha-900 text-xs">
                              {req.requestCode}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Từ chối
                            </span>
                          </div>
                          <div className="font-semibold text-xs text-stone-900 line-clamp-1">
                            {req.title}
                          </div>
                          {req.rejectionReason && (
                            <div className="text-[11px] text-rose-700 line-clamp-1 bg-rose-50 p-1.5 rounded">
                              {req.rejectionReason}
                            </div>
                          )}
                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                            <span className="text-stone-500">Checker: {req.checker}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(req);
                              }}
                              className="text-matcha-700 hover:text-matcha-900 font-semibold cursor-pointer"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ==================== DATA TABLE VIEW ==================== */
            <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                  <span>Danh sách yêu cầu cài đặt</span>
                  <span className="px-2 py-0.5 rounded-full bg-matcha-100 text-matcha-800 font-mono text-[11px]">
                    {filteredRequests.length} yêu cầu
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50/80 text-[11px] uppercase tracking-wider text-stone-600 font-bold border-b border-stone-200">
                    <tr>
                      {userRole === 'Checker' && (
                        <th className="py-3 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredRequests.filter((r) => r.status === 'Pending Approval').length > 0 &&
                              selectedBatchIds.length === filteredRequests.filter((r) => r.status === 'Pending Approval').length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                const pendingIds = filteredRequests
                                  .filter((r) => r.status === 'Pending Approval')
                                  .map((r) => r.id);
                                setSelectedBatchIds(pendingIds);
                              } else {
                                setSelectedBatchIds([]);
                              }
                            }}
                            className="rounded border-stone-300 text-matcha-600 focus:ring-matcha-500"
                          />
                        </th>
                      )}
                      <th className="py-3 px-4">Mã yêu cầu</th>
                      <th className="py-3 px-4">Yêu cầu cài đặt & Căn cứ</th>
                      <th className="py-3 px-4">Module / Đối tượng</th>
                      <th className="py-3 px-4">Loại & Ưu tiên</th>
                      <th className="py-3 px-4">Người tạo (Maker)</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((req) => (
                        <tr
                          key={req.id}
                          onClick={() => handleOpenDetail(req)}
                          className="hover:bg-matcha-50/40 cursor-pointer transition-colors"
                        >
                          {userRole === 'Checker' && (
                            <td
                              className="py-3 px-3 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {req.status === 'Pending Approval' ? (
                                <input
                                  type="checkbox"
                                  checked={selectedBatchIds.includes(req.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedBatchIds([...selectedBatchIds, req.id]);
                                    } else {
                                      setSelectedBatchIds(selectedBatchIds.filter((id) => id !== req.id));
                                    }
                                  }}
                                  className="rounded border-stone-300 text-matcha-600 focus:ring-matcha-500"
                                />
                              ) : (
                                <span className="text-stone-300">-</span>
                              )}
                            </td>
                          )}

                          <td className="py-3 px-4 font-mono font-bold text-matcha-900 whitespace-nowrap">
                            <DataValue value={req.requestCode} placeholder="Chưa có mã" monospace />
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-semibold text-stone-900 line-clamp-1">
                              <DataValue value={req.title} placeholder="Chưa đặt tiêu đề" />
                            </div>
                            <div className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                              <DataValue value={req.businessJustification} placeholder="Chưa nêu lý do" />
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-stone-900">
                              <DataValue value={req.targetEntityCode} placeholder="Chưa gán đối tượng" monospace />
                            </div>
                            <div className="text-[10px] text-stone-500 truncate max-w-[180px]">
                              {req.targetModuleName || 'Chung'}
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {getRequestTypeBadge(req.requestType)}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPriorityBadgeClass(
                                  req.priority || 'Medium'
                                )}`}
                              >
                                {req.priority || 'Medium'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-stone-800">
                              <DataValue value={req.maker} placeholder="Hệ thống" />
                            </div>
                            <div className="text-[10px] text-stone-500">
                              <DataValue value={req.submittedAt || req.createdAt} placeholder="—" />
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {req.status === 'Pending Approval' || req.status === 'Draft' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                Chờ duyệt
                              </span>
                            ) : req.status === 'Approved' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-900 border border-sky-300">
                                Đã duyệt
                              </span>
                            ) : req.status === 'Active' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Đang hoạt động
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(
                                  req.status
                                )}`}
                              >
                                {getStatusLabel(req.status)}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleOpenDetail(req)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-matcha-700 hover:text-matcha-900 hover:bg-matcha-100 transition-colors cursor-pointer"
                                title="Xem chi tiết hồ sơ yêu cầu"
                              >
                                Xem chi tiết
                              </button>

                              {/* Maker action: Edit rejected request */}
                              {isMaker && req.status === 'Rejected' && (
                                <button
                                  onClick={() => handleOpenEditModal(req)}
                                  className="p-1 rounded-lg text-stone-600 hover:text-matcha-800 hover:bg-stone-100 cursor-pointer"
                                  title="Chỉnh sửa bổ sung tờ trình"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Maker action: Delete cancelled/rejected request */}
                              {isMaker && (req.status === 'Cancelled' || req.status === 'Rejected') && (
                                <button
                                  onClick={() => handleDeleteRequest(req)}
                                  className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Xóa yêu cầu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Checker quick action: Approve */}
                              {isChecker && req.status === 'Pending Approval' && (
                                <button
                                  onClick={() => {
                                    setSelectedRequestId(req.id);
                                    setShowApproveModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-matcha-700 hover:bg-matcha-800 shadow-2xs cursor-pointer"
                                  title="Phê duyệt ngay"
                                >
                                  Duyệt
                                </button>
                              )}

                              {/* Checker quick action: Activate */}
                              {isChecker && req.status === 'Approved' && (
                                <button
                                  onClick={() => handleActivate(req)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs cursor-pointer"
                                  title="Kích hoạt vào hệ thống"
                                >
                                  Kích hoạt
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={userRole === 'Checker' ? 8 : 7} className="py-12 text-center">
                          <EmptyDataState
                            icon={Search}
                            tag="BỘ LỌC KHÔNG CÓ KẾT QUẢ"
                            title="Không tìm thấy yêu cầu nào"
                            compact
                            primaryAction={{
                              label: 'Đặt lại bộ lọc',
                              onClick: () => {
                                setStatusFilter('ALL');
                                setModuleFilter('ALL');
                                setPriorityFilter('ALL');
                                setLocalSearch('');
                                setSelectedScopeTab('ALL');
                              }
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================== SCREEN 02: CHI TIẾT TỜ TRÌNH & THẨM TRA ======================== */
        selectedRequest && (
          <div className="space-y-5">
            {/* Header with Navigation and Checker Decision Panel */}
            <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen('LIST')}
                  className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  title="Quay lại danh sách yêu cầu"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-matcha-800 bg-matcha-100 px-2 py-0.5 rounded border border-matcha-300">
                      {selectedRequest.requestCode}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                      {selectedRequest.title}
                    </h2>
                  </div>
                  <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-2">
                    <span>Đối tượng: <strong className="text-stone-800">{selectedRequest.targetEntityCode}</strong></span>
                    <span>·</span>
                    <span>Module: <strong className="text-stone-800">{selectedRequest.targetModuleName}</strong></span>
                    <span>·</span>
                    <span>Miền: <strong className="text-stone-800">{selectedRequest.businessDomain}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(selectedRequest.status)}`}>
                  Trạng thái: {getStatusLabel(selectedRequest.status)}
                </div>

                {/* Checker Decision Flow */}
                {(userRole === 'Checker' || userRole === 'Administrator') && selectedRequest.status === 'Pending Approval' && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Từ chối (Reject)</span>
                    </button>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-matcha-700 hover:bg-matcha-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phê duyệt (Approve)</span>
                    </button>
                  </>
                )}

                {/* Maker can resubmit rejected request */}
                {isMaker && selectedRequest.status === 'Rejected' && (
                  <button
                    onClick={() => handleOpenEditModal(selectedRequest)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-bronze-600 hover:bg-bronze-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Sửa & Tái trình duyệt (Resubmit)</span>
                  </button>
                )}

                {/* Maker can withdraw pending request */}
                {isMaker && selectedRequest.status === 'Pending Approval' && (
                  <button
                    onClick={() => handleCancelRequest(selectedRequest)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <span>Thu hồi yêu cầu</span>
                  </button>
                )}

                {/* Direct Jump to Module */}
                {onNavigateToModule && (
                  <button
                    onClick={() => onNavigateToModule(selectedRequest.targetModule, selectedRequest.targetEntityId)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-matcha-800 bg-matcha-50 hover:bg-matcha-100 border border-matcha-200 rounded-xl transition-colors"
                    title="Mở đối tượng này trong module cấu hình gốc"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-matcha-700" />
                    <span>Mở trong Module</span>
                  </button>
                )}
              </div>
            </div>

            {/* Rejection Alert if Rejected */}
            {selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Ý kiến từ chối thẩm tra của Checker:</span>
                </div>
                <p className="text-stone-700 pl-5">{selectedRequest.rejectionReason}</p>
                <div className="pl-5 text-[11px] text-stone-500">
                  Người duyệt: {selectedRequest.checker} · Thời gian: {selectedRequest.reviewedAt}
                </div>
              </div>
            )}

            {/* Approval Info if Approved */}
            {selectedRequest.status === 'Approved' && (
              <div className="p-4 bg-matcha-50/80 border border-matcha-200 rounded-xl text-xs text-matcha-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-matcha-700" />
                  <span>Hồ sơ đã được phê duyệt và chính thức kích hoạt vào Catalog Production</span>
                </div>
                {selectedRequest.checkerNotes && (
                  <p className="text-stone-700 pl-5 italic">"{selectedRequest.checkerNotes}"</p>
                )}
                <div className="pl-5 text-[11px] text-stone-500">
                  Checker phê duyệt: {selectedRequest.checker} · Thời gian: {selectedRequest.reviewedAt}
                </div>
              </div>
            )}

            {/* Interactive 4-Stage Approval Pipeline Tracker */}
            {(() => {
              const reqProgress = getApprovalProgressInfo(selectedRequest);
              return (
                <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-matcha-100 text-matcha-800 flex items-center justify-center font-bold shadow-2xs">
                        <Activity className="w-5 h-5 text-matcha-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-stone-900 text-sm">
                            Tiến trình phê duyệt (4 Bước)
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${reqProgress.badgeClass}`}>
                            {reqProgress.stageName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 px-3.5 py-1.5 rounded-xl">
                      <div className="text-right">
                        <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider">Tiến độ</div>
                        <div className="text-xs font-bold text-stone-900">{reqProgress.percent}% ({reqProgress.currentStageNumber}/4 bước)</div>
                      </div>
                      <div className="w-20 h-2.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${reqProgress.progressBarClass}`}
                          style={{ width: `${reqProgress.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4 Connected Stages Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                    {reqProgress.steps.map((st) => {
                      const isDone = st.status === 'completed';
                      const isCurr = st.status === 'current';
                      const isRej = st.status === 'rejected';

                      return (
                        <div
                          key={st.stepNumber}
                          className={`p-3.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                            isCurr
                              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200/80 shadow-xs'
                              : isDone
                              ? 'bg-matcha-50/40 border-matcha-300'
                              : isRej
                              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200/80'
                              : 'bg-stone-50/80 border-stone-200 opacity-80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isDone
                                      ? 'bg-matcha-600 text-white'
                                      : isCurr
                                      ? 'bg-amber-500 text-white animate-pulse'
                                      : isRej
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-stone-200 text-stone-600'
                                  }`}
                                >
                                  {isDone ? '✓' : isRej ? '✕' : st.stepNumber}
                                </span>
                                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                                  Bước {st.stepNumber}
                                </span>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isCurr
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : isRej
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {st.statusLabel}
                              </span>
                            </div>

                            <div className="font-bold text-xs text-stone-900 mb-2">
                              {st.title}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-stone-200/70 text-[10px] space-y-0.5">
                            <div className="flex items-center justify-between text-stone-500">
                              <span>Thực hiện:</span>
                              <span className="font-semibold text-stone-800 truncate max-w-[130px]" title={st.actor}>
                                {st.actor}
                              </span>
                            </div>
                            {st.timestamp && (
                              <div className="flex items-center justify-between text-stone-500">
                                <span>Thời gian:</span>
                                <span className="font-mono text-stone-700">{st.timestamp}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Clean Request Location Indicator */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    selectedRequest.status === 'Approved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : selectedRequest.status === 'Pending Approval'
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : selectedRequest.status === 'Rejected'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0 animate-ping bg-current" />
                      <span>
                        <strong>Vị trí hiện tại:</strong> {reqProgress.stageName} · Đang thụ lý bởi <strong className="underline">{reqProgress.activeActor}</strong>
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[11px]">{reqProgress.percent}%</span>
                  </div>
                </div>
              );
            })()}

            {/* Tabs Navigation in Detail */}
            <div className="flex border-b border-matcha-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 shadow-2xs">
              <button
                onClick={() => setDetailTab('OVERVIEW')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  detailTab === 'OVERVIEW'
                    ? 'border-matcha-600 text-matcha-900 bg-matcha-50/60 rounded-t-lg'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tờ trình & Căn cứ nghiệp vụ</span>
              </button>

              <button
                onClick={() => setDetailTab('DIFF')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  detailTab === 'DIFF'
                    ? 'border-matcha-600 text-matcha-900 bg-matcha-50/60 rounded-t-lg'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>So sánh Dữ liệu thay đổi (Diff)</span>
              </button>

              <button
                onClick={() => setDetailTab('AUDIT')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  detailTab === 'AUDIT'
                    ? 'border-matcha-600 text-matcha-900 bg-matcha-50/60 rounded-t-lg'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Nhật ký luân chuyển ({selectedRequest.auditLogs.length})</span>
              </button>

              <button
                onClick={() => setDetailTab('DISCUSSION')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  detailTab === 'DISCUSSION'
                    ? 'border-matcha-600 text-matcha-900 bg-matcha-50/60 rounded-t-lg'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Trao đổi Maker - Checker</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="bg-white border border-t-0 border-matcha-200 rounded-b-2xl p-6 shadow-xs min-h-[360px]">
              {/* TAB 1: OVERVIEW */}
              {detailTab === 'OVERVIEW' && (
                <div className="space-y-6 text-xs">
                  {/* Grid 2 Cols: Tờ trình & Căn cứ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-matcha-700" />
                          Thông tin tờ trình yêu cầu
                        </div>
                        <div className="space-y-1.5 text-stone-700 pt-1">
                          <div className="flex justify-between">
                            <span className="text-stone-500">Mã yêu cầu:</span>
                            <span className="font-mono font-bold text-matcha-900">{selectedRequest.requestCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Loại thao tác:</span>
                            <span>{getRequestTypeBadge(selectedRequest.requestType)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Mức độ ưu tiên:</span>
                            <span className={`px-2 py-0.5 rounded font-bold border ${getPriorityBadgeClass(selectedRequest.priority)}`}>
                              {selectedRequest.priority}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Ngày tạo bản thảo:</span>
                            <span>{selectedRequest.createdAt}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Ngày nộp thẩm tra:</span>
                            <span className="font-medium">{selectedRequest.submittedAt || 'Chưa nộp'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Người lập (Maker):</span>
                            <span className="font-semibold text-stone-900">{selectedRequest.maker}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Người thẩm tra (Checker):</span>
                            <span className="font-semibold text-stone-900">{selectedRequest.checker || 'Ban QTRR'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-matcha-50/50 border border-matcha-200 rounded-xl space-y-2">
                        <div className="font-bold text-matcha-950 text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-matcha-700" />
                          Đối tượng cấu hình đích (Target Entity)
                        </div>
                        <div className="space-y-1.5 text-stone-700 pt-1">
                          <div className="flex justify-between">
                            <span className="text-stone-500">Module hệ thống:</span>
                            <span className="font-semibold text-stone-900">{selectedRequest.targetModuleName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Mã đối tượng:</span>
                            <span className="font-mono font-bold text-matcha-900">{selectedRequest.targetEntityCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Tên đối tượng:</span>
                            <span className="font-semibold text-stone-900">{selectedRequest.targetEntityName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-500">Miền nghiệp vụ:</span>
                            <span className="px-2 py-0.5 rounded bg-white border border-stone-200 font-medium">
                              {selectedRequest.businessDomain}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Lý do thay đổi */}
                      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                        <div className="font-bold text-stone-900 text-sm">
                          1. Lý do & Căn cứ nghiệp vụ (Business Justification)
                        </div>
                        <p className="text-stone-700 leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                          {selectedRequest.businessJustification}
                        </p>
                      </div>

                      {/* Văn bản pháp lý */}
                      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                        <div className="font-bold text-stone-900 text-sm">
                          2. Căn cứ văn bản pháp lý / Quyết định ban hành
                        </div>
                        <p className="text-stone-700 leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                          {selectedRequest.legalOrPolicyReference || 'Quy chuẩn quản trị dữ liệu nội bộ ban hành theo Quyết định TGĐ.'}
                        </p>
                      </div>

                      {/* Đánh giá tác động */}
                      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                        <div className="font-bold text-stone-900 text-sm">
                          3. Đánh giá tác động hệ thống hạ nguồn (Impact Analysis)
                        </div>
                        <p className="text-stone-700 leading-relaxed bg-white p-3 rounded-lg border border-stone-200">
                          {selectedRequest.impactSummary || 'Không phát hiện xung đột phụ thuộc với các thành phần hạ nguồn.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DIFF COMPARISON */}
              {detailTab === 'DIFF' && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">So sánh Dữ liệu cấu hình (Before vs After)</h3>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-rose-200 border border-rose-300" />
                        Giá trị cũ (Before)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-matcha-200 border border-matcha-300" />
                        Giá trị đề xuất mới (After)
                      </span>
                    </div>
                  </div>

                  {selectedRequest.beforeData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Before Box */}
                      <div className="border border-stone-200 rounded-xl overflow-hidden">
                        <div className="bg-stone-100 p-3 font-bold text-stone-800 border-b border-stone-200 flex items-center justify-between">
                          <span>DỮ LIỆU HIỆN TẠI (BEFORE)</span>
                          <span className="text-[10px] text-stone-500">Đang có hiệu lực</span>
                        </div>
                        <div className="p-4 space-y-3 bg-stone-50/50">
                          {Object.entries(selectedRequest.beforeData).map(([key, val]) => (
                            <div key={key} className="space-y-1">
                              <div className="font-mono text-[11px] font-bold text-stone-600">{key}:</div>
                              <div className="p-2 bg-white rounded border border-rose-200 text-rose-900 font-mono text-[11px]">
                                {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* After Box */}
                      <div className="border border-matcha-300 rounded-xl overflow-hidden">
                        <div className="bg-matcha-100/70 p-3 font-bold text-matcha-950 border-b border-matcha-200 flex items-center justify-between">
                          <span>DỮ LIỆU ĐỀ XUẤT (AFTER)</span>
                          <span className="text-[10px] text-matcha-700 font-bold">Trình Checker duyệt</span>
                        </div>
                        <div className="p-4 space-y-3 bg-matcha-50/30">
                          {Object.entries(selectedRequest.afterData).map(([key, val]) => (
                            <div key={key} className="space-y-1">
                              <div className="font-mono text-[11px] font-bold text-matcha-900">{key}:</div>
                              <div className="p-2 bg-white rounded border border-matcha-300 text-matcha-950 font-mono text-[11px]">
                                {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Newly Created Entity */
                    <div className="space-y-3">
                      <div className="border border-matcha-200 rounded-xl overflow-hidden">
                        <div className="bg-matcha-100/70 p-3 font-bold text-matcha-900 border-b border-matcha-200">
                          Cấu trúc Payload đề xuất phê duyệt
                        </div>
                        <div className="p-4 space-y-2 bg-stone-50 font-mono text-[11px]">
                          <pre className="p-3 bg-white border border-stone-200 rounded-lg overflow-x-auto text-stone-800">
                            {JSON.stringify(selectedRequest.afterData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: AUDIT TRAIL */}
              {detailTab === 'AUDIT' && (
                <div className="space-y-4 text-xs">
                  <div className="pb-2 border-b border-stone-200">
                    <h3 className="font-bold text-stone-900 text-sm">Nhật ký Thẩm tra & Luân chuyển Hồ sơ (Audit Trail)</h3>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-matcha-200">
                    {selectedRequest.auditLogs.map((log) => (
                      <div key={log.id} className="relative space-y-1">
                        <span
                          className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white ${
                            log.action === 'APPROVE'
                              ? 'bg-matcha-600 ring-2 ring-matcha-200'
                              : log.action === 'REJECT'
                              ? 'bg-rose-600 ring-2 ring-rose-200'
                              : log.action === 'SUBMIT'
                              ? 'bg-bronze-600 ring-2 ring-bronze-200'
                              : 'bg-stone-500 ring-2 ring-stone-200'
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{log.actor}</span>
                          <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-mono text-[10px]">
                            {log.role}
                          </span>
                          <span className="text-stone-400 font-mono text-[10px]">{log.timestamp}</span>
                        </div>
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-700 leading-relaxed">
                          <strong className="text-stone-900 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                            [{log.action}]
                          </strong>
                          {log.comment}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: DISCUSSION & COLLABORATION */}
              {detailTab === 'DISCUSSION' && (
                <div className="space-y-4 text-xs">
                  <div className="pb-2 border-b border-stone-200">
                    <h3 className="font-bold text-stone-900 text-sm">Thảo luận nội bộ</h3>
                  </div>

                  <div className="space-y-3">
                    {selectedRequest.auditLogs.filter((l) => l.action === 'COMMENT' || l.action === 'REJECT' || l.action === 'APPROVE').map((item) => (
                      <div key={item.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-stone-900">{item.actor}</span>
                          <span className="text-stone-400 font-mono">{item.timestamp}</span>
                        </div>
                        <p className="text-stone-700">{item.comment}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add comment input */}
                  <div className="pt-3 border-t border-stone-200 space-y-2">
                    <label className="block text-[11px] font-bold text-stone-700">
                      Gửi ý kiến phản hồi (Vai trò: {userRole}):
                    </label>
                    <textarea
                      rows={3}
                      value={discussionComment}
                      onChange={(e) => setDiscussionComment(e.target.value)}
                      placeholder="Nhập ý kiến trao đổi, giải trình hoặc yêu cầu bổ sung thông tin..."
                      className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-matcha-500 focus:bg-white text-stone-800"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddComment}
                        disabled={!discussionComment.trim()}
                        className="px-4 py-2 bg-matcha-600 hover:bg-matcha-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Gửi phản hồi
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* ======================== MODAL: TẠO MỚI YÊU CẦU (MAKER) ======================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-matcha-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-matcha-100 text-matcha-800 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Lập Tờ trình Yêu cầu Mới (Change Request Proposal)
                  </h3>
                  <p className="text-xs text-stone-500">Soạn thảo cấu hình và chuyển giao cho Checker thẩm tra.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Mã yêu cầu (Tự động sinh):
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.requestCode || ''}
                    className="w-full bg-stone-100 border border-stone-200 rounded-lg p-2 font-mono font-bold text-stone-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Loại thao tác:
                  </label>
                  <select
                    value={formData.requestType}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value as RequestType })}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium text-stone-800"
                  >
                    <option value="CREATE">Tạo mới (Create New Catalog)</option>
                    <option value="UPDATE">Cập nhật cấu hình hiện có (Update)</option>
                    <option value="DEPRECATE">Ngưng áp dụng (Deprecate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Tiêu đề tờ trình yêu cầu <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đăng ký mới thuật ngữ chuẩn: MARGIN_CALL_RATIO"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                />
                {formErrors.title && <p className="text-rose-500 text-[10px] mt-1">{formErrors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Module cấu hình đích:
                  </label>
                  <select
                    value={formData.targetModule}
                    onChange={(e) => setFormData({ ...formData, targetModule: e.target.value as ModuleId })}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium text-stone-800"
                  >
                    {MODULE_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameVi} ({m.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Miền nghiệp vụ (Enterprise Domain):
                  </label>
                  <select
                    value={formData.businessDomain}
                    onChange={(e) => setFormData({ ...formData, businessDomain: e.target.value as EnterpriseDomain })}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium text-stone-800"
                  >
                    {ENTERPRISE_DOMAINS.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Mã đối tượng cấu hình <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: MARGIN_CALL_RATIO hoặc CUSTOMER_TIER"
                    value={formData.targetEntityCode || ''}
                    onChange={(e) => setFormData({ ...formData, targetEntityCode: e.target.value.toUpperCase().trim() })}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 font-mono text-stone-800"
                  />
                  {formErrors.targetEntityCode && <p className="text-rose-500 text-[10px] mt-1">{formErrors.targetEntityCode}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Tên đối tượng cấu hình <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tỷ lệ cảnh báo ký quỹ"
                    value={formData.targetEntityName || ''}
                    onChange={(e) => setFormData({ ...formData, targetEntityName: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 text-stone-800"
                  />
                  {formErrors.targetEntityName && <p className="text-rose-500 text-[10px] mt-1">{formErrors.targetEntityName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Mức độ ưu tiên thẩm tra:
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as RequestPriority })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium text-stone-800"
                >
                  <option value="Low">Thấp (Low)</option>
                  <option value="Medium">Trung bình (Medium)</option>
                  <option value="High">Cao (High)</option>
                  <option value="Urgent">Khẩn cấp (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Lý do thay đổi & Căn cứ nghiệp vụ <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  placeholder="Trình bày rõ mục đích, bối cảnh thực hiện và yêu cầu của nghiệp vụ..."
                  value={formData.businessJustification || ''}
                  onChange={(e) => setFormData({ ...formData, businessJustification: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 text-stone-800"
                />
                {formErrors.businessJustification && <p className="text-rose-500 text-[10px] mt-1">{formErrors.businessJustification}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Văn bản quy định / Quyết định đính kèm:
                </label>
                <input
                  type="text"
                  placeholder="VD: Quyết định 88/QĐ-TGĐ về giao dịch ký quỹ"
                  value={formData.legalOrPolicyReference || ''}
                  onChange={(e) => setFormData({ ...formData, legalOrPolicyReference: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 text-stone-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleSaveRequest(true)}
                className="px-4 py-2 text-xs font-bold bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Gửi yêu cầu phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL: CHỈNH SỬA YÊU CẦU (MAKER / ADMIN) ======================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-matcha-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-bronze-100 text-bronze-800 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Cập nhật Thông tin Tờ trình: {formData.requestCode}
                  </h3>
                  <p className="text-xs text-stone-500">Chỉnh sửa nội dung theo yêu cầu của Checker trước khi tái nộp.</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Tiêu đề tờ trình:
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Độ ưu tiên:
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as RequestPriority })}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium text-stone-800"
                  >
                    <option value="Low">Thấp (Low)</option>
                    <option value="Medium">Trung bình (Medium)</option>
                    <option value="High">Cao (High)</option>
                    <option value="Urgent">Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Trạng thái:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.status || ''}
                    className="w-full bg-stone-100 border border-stone-200 rounded-lg p-2 font-bold text-stone-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Căn cứ & Lý do nghiệp vụ cập nhật:
                </label>
                <textarea
                  rows={3}
                  value={formData.businessJustification || ''}
                  onChange={(e) => setFormData({ ...formData, businessJustification: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Văn bản pháp lý / Căn cứ ban hành:
                </label>
                <input
                  type="text"
                  value={formData.legalOrPolicyReference || ''}
                  onChange={(e) => setFormData({ ...formData, legalOrPolicyReference: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 text-stone-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleSaveEditRequest(false)}
                className="px-4 py-2 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl transition-colors"
              >
                Lưu thay đổi
              </button>
              <button
                onClick={() => handleSaveEditRequest(true)}
                className="px-4 py-2 text-xs font-bold bg-bronze-600 hover:bg-bronze-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Lưu & Tái nộp phê duyệt (Resubmit)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL: CHECKER PHÊ DUYỆT (APPROVE) ======================== */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-matcha-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-matcha-100 text-matcha-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-matcha-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Xác nhận Phê duyệt & Kích hoạt Ban hành
                </h3>
                <p className="text-xs text-stone-500">{selectedRequest.requestCode}</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Bạn đang phê duyệt với vai trò <strong>Checker</strong> ({userRole}).
              Khi phê duyệt, đối tượng <strong className="text-matcha-900 font-mono">{selectedRequest.targetEntityCode}</strong> sẽ lập tức chuyển sang trạng thái <strong>Active</strong> và áp dụng toàn hệ thống.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Ý kiến thẩm tra của Checker:
              </label>
              <textarea
                rows={3}
                placeholder="Đã thẩm tra đầy đủ căn cứ pháp lý và tính nhất quán dữ liệu. Phê duyệt ban hành."
                value={checkerActionNote}
                onChange={(e) => setCheckerActionNote(e.target.value)}
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-matcha-500 focus:bg-white text-stone-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-4 py-2 text-xs font-bold bg-matcha-700 hover:bg-matcha-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Chính thức Phê duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL: CHECKER TỪ CHỐI (REJECT) ======================== */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Từ chối Yêu cầu (Reject Proposal)
                </h3>
                <p className="text-xs text-stone-500">{selectedRequest.requestCode}</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Yêu cầu sẽ chuyển sang trạng thái <strong>Rejected</strong>. Maker sẽ nhận được phản hồi để chỉnh sửa lại tờ trình.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-rose-900 mb-1">
                Lý do từ chối thẩm tra (Bắt buộc) <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={3}
                placeholder="Nêu rõ lý do chưa đạt chuẩn (thiếu trường bắt buộc, sai định nghĩa, không phù hợp chính sách)..."
                value={checkerActionNote}
                onChange={(e) => setCheckerActionNote(e.target.value)}
                className="w-full text-xs p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 focus:bg-white text-stone-800 placeholder-stone-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xác nhận Từ chối</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL: CHECKER DUYỆT HÀNG LOẠT ======================== */}
      {showBatchApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-bronze-200 space-y-4">
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-bronze-100 text-bronze-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-bronze-700" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Phê duyệt Hàng loạt ({selectedBatchIds.length} yêu cầu)
                </h3>
                <p className="text-xs text-stone-500">Thẩm quyền Checker</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              Bạn đang chuẩn bị phê duyệt <strong>{selectedBatchIds.length}</strong> yêu cầu cùng lúc. Toàn bộ các đối tượng tương ứng sẽ được tự động kích hoạt vào catalog trạng thái <strong>Active</strong>.
            </p>

            <div className="max-h-40 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-[11px] font-mono">
              {selectedBatchIds.map((id) => {
                const r = requests.find((req) => req.id === id);
                return (
                  <div key={id} className="p-1.5 bg-white rounded border border-stone-100 flex justify-between">
                    <span className="font-bold text-matcha-900">{r?.requestCode}</span>
                    <span className="text-stone-600 truncate max-w-[200px]">{r?.targetEntityCode}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBatchApproveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 text-xs font-bold bg-matcha-700 hover:bg-matcha-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Duyệt tất cả ({selectedBatchIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================== MODAL: SƠ ĐỒ LUỒNG PHÊ DUYỆT (WORKFLOW PREVIEW) ======================== */}
      {workflowPreviewRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-matcha-100 text-matcha-800 flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-matcha-700" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Sơ đồ luồng phê duyệt: {workflowPreviewRequest.requestCode}
                  </h3>
                  <p className="text-xs text-stone-500 font-mono">
                    {workflowPreviewRequest.targetEntityCode} · {workflowPreviewRequest.targetModuleName || 'Chung'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWorkflowPreviewRequest(null)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="font-semibold text-xs text-stone-900 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                {workflowPreviewRequest.title}
              </div>

              {/* 4 Connected Stages Visual Pipeline */}
              {(() => {
                const progress = getApprovalProgressInfo(workflowPreviewRequest);
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      {progress.steps.map((st) => {
                        const isDone = st.status === 'completed';
                        const isCurr = st.status === 'current';
                        const isRej = st.status === 'rejected';

                        return (
                          <div
                            key={st.stepNumber}
                            className={`p-3 rounded-xl border text-xs relative ${
                              isCurr
                                ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-200 shadow-xs'
                                : isDone
                                ? 'border-emerald-300 bg-emerald-50/40'
                                : isRej
                                ? 'border-rose-300 bg-rose-50/80 ring-2 ring-rose-200'
                                : 'border-stone-200 bg-stone-50/70 text-stone-400'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isDone
                                    ? 'bg-emerald-600 text-white'
                                    : isCurr
                                    ? 'bg-amber-500 text-white animate-pulse'
                                    : isRej
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {isDone ? '✓' : isRej ? '✕' : st.stepNumber}
                              </span>
                              <span className={`text-[10px] font-bold ${
                                isDone ? 'text-emerald-700' : isCurr ? 'text-amber-800' : isRej ? 'text-rose-700' : 'text-stone-400'
                              }`}>
                                {st.statusLabel}
                              </span>
                            </div>

                            <div className="font-bold text-stone-900 mb-1">{st.title}</div>
                            <div className="text-[10px] text-stone-600">
                              Người xử lý: <strong className="text-stone-800">{st.actor}</strong>
                            </div>
                            {st.timestamp && (
                              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                                {st.timestamp}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Clean Location Indicator */}
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-600">Vị trí hiện tại:</span>
                        <span className="font-bold text-stone-900">{progress.stageName}</span>
                        <span className="text-stone-400">·</span>
                        <span className="text-stone-700">Đang thụ lý: <strong>{progress.activeActor}</strong></span>
                      </div>
                      <div className="font-mono font-bold text-matcha-800 bg-matcha-100 px-2 py-0.5 rounded">
                        {progress.percent}%
                      </div>
                    </div>
                  </div>
                );
              })()}

              {workflowPreviewRequest.status === 'Rejected' && workflowPreviewRequest.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  <strong>Lý do từ chối:</strong> {workflowPreviewRequest.rejectionReason}
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 rounded-b-xl flex items-center justify-end gap-2">
              <button
                onClick={() => setWorkflowPreviewRequest(null)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const req = workflowPreviewRequest;
                  setWorkflowPreviewRequest(null);
                  handleOpenDetail(req);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-matcha-700 hover:bg-matcha-800 text-white text-xs font-bold shadow-2xs cursor-pointer"
              >
                Mở chi tiết hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
