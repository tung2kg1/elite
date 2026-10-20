export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  return dateStr;
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
    case 'Approved':
      return 'bg-sky-100 text-sky-800 border border-sky-300';
    case 'Pending Approval':
    case 'Draft':
      return 'bg-amber-100 text-amber-900 border border-amber-300';
    case 'Rejected':
      return 'bg-rose-100 text-rose-800 border border-rose-300';
    case 'Cancelled':
      return 'bg-stone-100 text-stone-600 border border-stone-300';
    case 'Deprecated':
    case 'Inactive':
      return 'bg-amber-50 text-amber-800 border border-amber-300';
    case 'Retired':
      return 'bg-rose-50 text-rose-800 border border-rose-300';
    default:
      return 'bg-stone-100 text-stone-700 border border-stone-200';
  }
}

export interface ApprovalPipelineStep {
  stepNumber: number;
  title: string;
  shortTitle: string;
  actor: string;
  status: 'completed' | 'current' | 'waiting' | 'rejected' | 'cancelled';
  statusLabel: string;
  timestamp?: string;
}

export interface ApprovalProgressInfo {
  currentStageNumber: number;
  totalStages: number;
  stageName: string;
  stageSubtext: string;
  percent: number;
  badgeClass: string;
  progressBarClass: string;
  activeActor: string;
  steps: ApprovalPipelineStep[];
}

export function getApprovalProgressInfo(req: {
  status: string;
  maker?: string;
  submittedAt?: string;
  createdAt?: string;
  checker?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}): ApprovalProgressInfo {
  const isActive = req.status === 'Active';
  const isApproved = req.status === 'Approved';
  const isPending = req.status === 'Pending Approval' || req.status === 'Draft';
  const isRejected = req.status === 'Rejected';
  const isCancelled = req.status === 'Cancelled';

  const submitTime = req.submittedAt || req.createdAt || '—';
  const reviewTime = req.reviewedAt || (isActive || isApproved || isRejected ? 'Đã hoàn thành' : undefined);
  const makerName = req.maker || 'Maker';
  const checkerName = req.checker || 'Checker (Ban Kiểm soát)';

  if (isActive) {
    return {
      currentStageNumber: 4,
      totalStages: 4,
      stageName: 'Bước 4/4: Đang hoạt động',
      stageSubtext: 'Đã kích hoạt vận hành catalog',
      percent: 100,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      progressBarClass: 'bg-emerald-600',
      activeActor: 'Hệ thống Catalog Production',
      steps: [
        {
          stepNumber: 1,
          title: 'Maker nộp tờ trình',
          shortTitle: 'Maker nộp',
          actor: makerName,
          status: 'completed',
          statusLabel: 'Hoàn thành',
          timestamp: submitTime
        },
        {
          stepNumber: 2,
          title: 'Thẩm tra kỹ thuật & Tác động',
          shortTitle: 'Thẩm tra kỹ thuật',
          actor: 'Hệ thống / Data Steward',
          status: 'completed',
          statusLabel: 'Đạt chuẩn',
          timestamp: submitTime
        },
        {
          stepNumber: 3,
          title: 'Checker phê duyệt & Ký số',
          shortTitle: 'Checker phê duyệt',
          actor: checkerName,
          status: 'completed',
          statusLabel: 'Đã phê duyệt',
          timestamp: reviewTime
        },
        {
          stepNumber: 4,
          title: 'Kích hoạt Catalog',
          shortTitle: 'Kích hoạt',
          actor: 'Catalog Production',
          status: 'completed',
          statusLabel: 'Đang hoạt động',
          timestamp: reviewTime
        }
      ]
    };
  }

  if (isApproved) {
    return {
      currentStageNumber: 3,
      totalStages: 4,
      stageName: 'Bước 3/4: Đã phê duyệt',
      stageSubtext: 'Chờ kích hoạt vào Catalog',
      percent: 85,
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
      progressBarClass: 'bg-sky-600',
      activeActor: checkerName,
      steps: [
        {
          stepNumber: 1,
          title: 'Maker nộp tờ trình',
          shortTitle: 'Maker nộp',
          actor: makerName,
          status: 'completed',
          statusLabel: 'Hoàn thành',
          timestamp: submitTime
        },
        {
          stepNumber: 2,
          title: 'Thẩm tra kỹ thuật & Tác động',
          shortTitle: 'Thẩm tra kỹ thuật',
          actor: 'Hệ thống / Data Steward',
          status: 'completed',
          statusLabel: 'Đạt chuẩn',
          timestamp: submitTime
        },
        {
          stepNumber: 3,
          title: 'Checker phê duyệt & Ký số',
          shortTitle: 'Checker phê duyệt',
          actor: checkerName,
          status: 'completed',
          statusLabel: 'Đã phê duyệt',
          timestamp: reviewTime
        },
        {
          stepNumber: 4,
          title: 'Kích hoạt Catalog',
          shortTitle: 'Kích hoạt',
          actor: 'Catalog Production',
          status: 'current',
          statusLabel: 'Sẵn sàng kích hoạt'
        }
      ]
    };
  }

  if (isPending) {
    return {
      currentStageNumber: 3,
      totalStages: 4,
      stageName: 'Bước 3/4: Chờ Checker duyệt',
      stageSubtext: checkerName,
      percent: 75,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      progressBarClass: 'bg-amber-500',
      activeActor: checkerName,
      steps: [
        {
          stepNumber: 1,
          title: 'Maker nộp tờ trình',
          shortTitle: 'Maker nộp',
          actor: makerName,
          status: 'completed',
          statusLabel: 'Hoàn thành',
          timestamp: submitTime
        },
        {
          stepNumber: 2,
          title: 'Thẩm tra kỹ thuật & Tác động',
          shortTitle: 'Thẩm tra kỹ thuật',
          actor: 'Hệ thống / Data Steward',
          status: 'completed',
          statusLabel: 'Đạt chuẩn',
          timestamp: submitTime
        },
        {
          stepNumber: 3,
          title: 'Checker phê duyệt & Ký số',
          shortTitle: 'Checker phê duyệt',
          actor: checkerName,
          status: 'current',
          statusLabel: 'Đang chờ duyệt'
        },
        {
          stepNumber: 4,
          title: 'Kích hoạt Catalog',
          shortTitle: 'Kích hoạt',
          actor: 'Catalog Production',
          status: 'waiting',
          statusLabel: 'Chờ duyệt'
        }
      ]
    };
  }

  if (isRejected) {
    return {
      currentStageNumber: 3,
      totalStages: 4,
      stageName: 'Dừng tại Bước 3: Từ chối',
      stageSubtext: checkerName,
      percent: 50,
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
      progressBarClass: 'bg-rose-500',
      activeActor: makerName,
      steps: [
        {
          stepNumber: 1,
          title: 'Maker nộp tờ trình',
          shortTitle: 'Maker nộp',
          actor: makerName,
          status: 'completed',
          statusLabel: 'Hoàn thành',
          timestamp: submitTime
        },
        {
          stepNumber: 2,
          title: 'Thẩm tra kỹ thuật & Tác động',
          shortTitle: 'Thẩm tra kỹ thuật',
          actor: 'Hệ thống / Data Steward',
          status: 'completed',
          statusLabel: 'Đạt chuẩn',
          timestamp: submitTime
        },
        {
          stepNumber: 3,
          title: 'Checker phê duyệt & Ký số',
          shortTitle: 'Checker từ chối',
          actor: checkerName,
          status: 'rejected',
          statusLabel: 'Từ chối',
          timestamp: reviewTime
        },
        {
          stepNumber: 4,
          title: 'Kích hoạt Catalog',
          shortTitle: 'Kích hoạt',
          actor: 'Catalog Production',
          status: 'cancelled',
          statusLabel: 'Chưa kích hoạt'
        }
      ]
    };
  }

  // Cancelled
  return {
    currentStageNumber: 1,
    totalStages: 4,
    stageName: 'Đã thu hồi',
    stageSubtext: makerName,
    percent: 25,
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
    progressBarClass: 'bg-stone-400',
    activeActor: makerName,
    steps: [
      {
        stepNumber: 1,
        title: 'Maker nộp tờ trình',
        shortTitle: 'Thu hồi',
        actor: makerName,
        status: 'cancelled',
        statusLabel: 'Đã thu hồi',
        timestamp: submitTime
      },
      {
        stepNumber: 2,
        title: 'Thẩm tra kỹ thuật',
        shortTitle: 'Hủy bỏ',
        actor: 'Hệ thống',
        status: 'cancelled',
        statusLabel: 'Hủy bỏ'
      },
      {
        stepNumber: 3,
        title: 'Checker phê duyệt',
        shortTitle: 'Hủy bỏ',
        actor: checkerName,
        status: 'cancelled',
        statusLabel: 'Hủy bỏ'
      },
      {
        stepNumber: 4,
        title: 'Kích hoạt Catalog',
        shortTitle: 'Hủy bỏ',
        actor: 'Catalog Production',
        status: 'cancelled',
        statusLabel: 'Không áp dụng'
      }
    ]
  };
}

export function getStatusLabel(status?: string): string {
  if (!status) return 'Đang hoạt động';
  switch (status) {
    case 'Active':
      return 'Đang hoạt động';
    case 'Pending Approval':
    case 'Draft':
      return 'Chờ duyệt';
    case 'Approved':
      return 'Đã duyệt';
    case 'Rejected':
      return 'Từ chối';
    case 'Cancelled':
      return 'Đã hủy';
    case 'Deprecated':
      return 'Lỗi thời';
    case 'Inactive':
      return 'Ngừng hoạt động';
    case 'Retired':
      return 'Đã ngưng';
    default:
      return status;
  }
}
