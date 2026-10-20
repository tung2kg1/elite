import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Save,
  Check,
  AlertTriangle,
  Info,
  Shield,
  Layers,
  Sparkles,
  Trash2,
  AlertCircle
} from 'lucide-react';
import {
  CanonicalEvent,
  DataElement,
  EnterpriseDomain,
  ENTERPRISE_DOMAINS,
  EVENT_TYPES,
  EventType,
  GENERATION_MECHANISMS,
  GenerationMechanism,
  DATA_ROLES,
  DataRole,
  EventDataItem,
  UserRole
} from '../../types';
import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface EventTaxonomyModuleProps {
  events: CanonicalEvent[];
  onUpdateEvents: (events: CanonicalEvent[]) => void;
  dataElements: DataElement[];
  selectedDomainFilter: EnterpriseDomain | 'ALL';
  globalSearch: string;
  userRole: UserRole;
  onLoadSampleData?: () => void;
}

const COMMON_SOURCE_SYSTEMS = [
  'Flex',
  'FTS Core',
  'Mobile App',
  'Web Portal',
  'Order Matching System (OMS)',
  'CRM System',
  'Data Warehouse / Batch ETL',
  'Recommendation AI Engine',
  'AI Model Serving'
];

export const EventTaxonomyModule: React.FC<EventTaxonomyModuleProps> = ({
  events,
  onUpdateEvents,
  dataElements,
  selectedDomainFilter,
  globalSearch,
  userRole,
  onLoadSampleData
}) => {
  const [screen, setScreen] = useState<'LIST' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'TAB_01' | 'TAB_02' | 'TAB_03'>('TAB_01');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<CanonicalEvent>>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Payload addition state
  const [selectedDataCodeToAdd, setSelectedDataCodeToAdd] = useState('');
  const [newRequired, setNewRequired] = useState(true);
  const [newDataRole, setNewDataRole] = useState<DataRole>('Core Content');
  const [newUsageNote, setNewUsageNote] = useState('');

  const filteredEvents = events.filter((evt) => {
    const matchesDomain =
      selectedDomainFilter === 'ALL' || evt.businessDomain === selectedDomainFilter;
    const matchesType = typeFilter === 'ALL' || evt.eventType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;

    const effectiveSearch = (globalSearch || localSearch).trim().toLowerCase();
    const matchesSearch =
      !effectiveSearch ||
      evt.eventCode.toLowerCase().includes(effectiveSearch) ||
      evt.eventName.toLowerCase().includes(effectiveSearch) ||
      evt.businessDefinition.toLowerCase().includes(effectiveSearch);

    return matchesDomain && matchesType && matchesStatus && matchesSearch;
  });

  const handleOpenDetail = (evt: CanonicalEvent) => {
    setSelectedEventId(evt.id);
    setFormData({ ...evt });
    setActiveTab('TAB_01');
    setFormErrors({});
    setScreen('DETAIL');
  };

  const handleCreateNew = () => {
    const newEvt: Partial<CanonicalEvent> = {
      id: `EVT_${Date.now()}`,
      eventCode: '',
      eventName: '',
      businessDefinition: '',
      businessDomain: (selectedDomainFilter !== 'ALL' ? selectedDomainFilter : 'Customer') as EnterpriseDomain,
      eventType: 'Business Event',
      businessOwner: 'Khối Quản trị Khách hàng',
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active',
      sourceSystems: ['Flex', 'Mobile App'],
      generationMechanism: 'Real-time',
      eventDataPayload: []
    };
    setSelectedEventId(null);
    setFormData(newEvt);
    setActiveTab('TAB_01');
    setFormErrors({});
    setScreen('DETAIL');
  };

  const handleValidate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.eventCode?.trim()) {
      errors.eventCode = 'Mã sự kiện không được để trống (Block).';
    } else {
      const duplicate = events.find(
        (e) => e.eventCode.toUpperCase() === formData.eventCode?.toUpperCase() && e.id !== formData.id
      );
      if (duplicate) {
        errors.eventCode = 'Mã sự kiện đã tồn tại trong hệ thống (Block).';
      }
    }

    if (!formData.eventName?.trim()) {
      errors.eventName = 'Tên sự kiện không được để trống.';
    }

    if (!formData.businessDefinition?.trim()) {
      errors.businessDefinition = 'Bắt buộc nhập định nghĩa nghiệp vụ của sự kiện.';
    }

    // Tab 03 Payload Validation: If payload items exist, at least one Core Content must be Required
    const payload = formData.eventDataPayload || [];
    if (payload.length > 0) {
      const hasRequiredCore = payload.some((p) => p.dataRole === 'Core Content' && p.required);
      if (!hasRequiredCore) {
        errors.eventDataPayload = 'Quy tắc: Cần ít nhất 1 trường dữ liệu vai trò Core Content được đánh dấu Bắt buộc (Required).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!handleValidate()) return;

    if (selectedEventId) {
      const updated = events.map((e) =>
        e.id === selectedEventId ? ({ ...e, ...formData } as CanonicalEvent) : e
      );
      onUpdateEvents(updated);
    } else {
      const created = {
        ...formData,
        eventCode: formData.eventCode?.toUpperCase().trim()
      } as CanonicalEvent;
      onUpdateEvents([created, ...events]);
      setSelectedEventId(created.id);
    }
    alert('Đã lưu Canonical Event thành công.');
  };

  const handleAddPayloadItem = () => {
    if (!selectedDataCodeToAdd) {
      alert('Vui lòng chọn một Data Element từ Data Dictionary.');
      return;
    }

    const currentPayload = formData.eventDataPayload || [];
    if (currentPayload.some((p) => p.dataCode === selectedDataCodeToAdd)) {
      alert('Data Element này đã có trong payload sự kiện.');
      return;
    }

    const foundElement = dataElements.find((d) => d.dataCode === selectedDataCodeToAdd);
    const newItem: EventDataItem = {
      dataCode: selectedDataCodeToAdd,
      dataName: foundElement?.dataName || selectedDataCodeToAdd,
      required: newRequired,
      dataRole: newDataRole,
      businessUsage: newUsageNote.trim()
    };

    setFormData({
      ...formData,
      eventDataPayload: [...currentPayload, newItem]
    });

    setSelectedDataCodeToAdd('');
    setNewUsageNote('');
  };

  const handleRemovePayloadItem = (dataCode: string) => {
    setFormData({
      ...formData,
      eventDataPayload: (formData.eventDataPayload || []).filter((p) => p.dataCode !== dataCode)
    });
  };

  const handleToggleSourceSystem = (sys: string) => {
    const current = formData.sourceSystems || [];
    if (current.includes(sys)) {
      if (current.length === 1) {
        alert('Sự kiện cần tối thiểu một hệ thống nguồn.');
        return;
      }
      setFormData({ ...formData, sourceSystems: current.filter((s) => s !== sys) });
    } else {
      setFormData({ ...formData, sourceSystems: [...current, sys] });
    }
  };

  return (
    <div className="space-y-6">
      {screen === 'LIST' ? (
        /* ======================== VIEW: 01: EVENT LIST ======================== */
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Event List / Danh sách sự kiện chuẩn (Canonical Events)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Khai báo sự kiện mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm mã sự kiện (VD: ACCOUNT_OPENED_SUCCESS), tên..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-matcha-500"
              />
            </div>

            {/* Event Type (4 types) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-600">Loại sự kiện:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
              >
                <option value="ALL">Tất cả 4 loại</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-600">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="Active">Hoạt động</option>
                <option value="Pending Approval">Chờ phê duyệt</option>
                <option value="Inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          {/* Table or Empty State */}
          {events.length === 0 ? (
            <EmptyDataState
              icon={Layers}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có sự kiện chuẩn nào (Canonical Events Taxonomy)"
              primaryAction={{
                label: 'Định nghĩa sự kiện chuẩn mới',
                onClick: handleCreateNew,
                icon: Plus
              }}
            />
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50/90 border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-4">Mã sự kiện (Event Code)</th>
                      <th className="py-3 px-4">Tên sự kiện</th>
                      <th className="py-3 px-4">Miền nghiệp vụ</th>
                      <th className="py-3 px-4">Loại sự kiện (4 loại)</th>
                      <th className="py-3 px-4">Cơ chế phát sinh</th>
                      <th className="py-3 px-4">Payload Items</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredEvents.length > 0 ? (
                      filteredEvents.map((evt) => (
                        <tr
                          key={evt.id}
                          onClick={() => handleOpenDetail(evt)}
                          className="hover:bg-matcha-50/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-matcha-900 whitespace-nowrap">
                            <DataValue value={evt.eventCode} placeholder="Chưa có mã" monospace />
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-900">
                            <DataValue value={evt.eventName} placeholder="Chưa đặt tên" />
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[11px] font-medium border border-stone-200">
                              {evt.businessDomain || 'Chưa gán miền'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                evt.eventType === 'AI Event'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : evt.eventType === 'Derived Event'
                                  ? 'bg-bronze-50 text-bronze-800 border-bronze-200'
                                  : 'bg-matcha-100/70 text-matcha-800 border-matcha-200'
                              }`}
                            >
                              {evt.eventType || 'Domain Event'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-stone-600">{evt.generationMechanism || 'CDC'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                              {evt.eventDataPayload?.length || 0} fields
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${getStatusBadgeClass(
                                evt.status || 'Active'
                              )}`}
                            >
                              {getStatusLabel(evt.status || 'Active')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(evt);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-matcha-700 hover:text-matcha-900 hover:bg-matcha-100 transition-colors"
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <EmptyDataState
                            icon={Search}
                            tag="BỘ LỌC KHÔNG CÓ KẾT QUẢ"
                            title="Không tìm thấy sự kiện phù hợp"
                            compact
                            primaryAction={{
                              label: 'Xóa bộ lọc tìm kiếm',
                              onClick: () => {
                                setTypeFilter('ALL');
                                setStatusFilter('ALL');
                                setLocalSearch('');
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
        /* ======================== VIEW: 02: EVENT DETAIL / DESIGNER ======================== */
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen('LIST')}
                className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  {formData.eventCode ? `${formData.eventCode} · ${formData.eventName}` : 'Khai báo sự kiện mới'}
                </h2>
                <div className="text-xs text-stone-500 mt-0.5">
                  Thiết kế cấu trúc Canonical Event, nguồn kích hoạt và danh mục dữ liệu đi kèm.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(
                  formData.status || 'Active'
                )}`}
              >
                Trạng thái: {getStatusLabel(formData.status || 'Active')}
              </div>

              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu sự kiện</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Tabs as defined in technical document */}
          <div className="flex border-b border-matcha-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 shadow-2xs">
            <button
              onClick={() => setActiveTab('TAB_01')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'TAB_01'
                  ? 'border-matcha-600 text-matcha-800'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="font-mono text-[10px] bg-matcha-100 text-matcha-800 px-1.5 py-0.5 rounded">
                TAB 01
              </span>
              <span>Thông tin chung (General Information)</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB_02')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'TAB_02'
                  ? 'border-matcha-600 text-matcha-800'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="font-mono text-[10px] bg-matcha-100 text-matcha-800 px-1.5 py-0.5 rounded">
                TAB 02
              </span>
              <span>Nguồn kích hoạt (Trigger Source)</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB_03')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'TAB_03'
                  ? 'border-matcha-600 text-matcha-800'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="font-mono text-[10px] bg-matcha-100 text-matcha-800 px-1.5 py-0.5 rounded">
                TAB 03
              </span>
              <span>Dữ liệu đi kèm sự kiện (Event Data Payload)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-matcha-100 text-matcha-800">
                {formData.eventDataPayload?.length || 0}
              </span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs">
            {activeTab === 'TAB_01' && (
              /* TAB 01: General Information */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Event Code */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Mã sự kiện (Event Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.eventCode || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, eventCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })
                    }
                    placeholder="VD: ACCOUNT_OPENED_SUCCESS, ORDER_MATCHED"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-matcha-900 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  {formErrors.eventCode && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.eventCode}</p>
                  )}
                  <p className="text-[11px] text-stone-500 mt-1">
                    Mã chuẩn duy nhất dạng UPPER_SNAKE_CASE. Được tham chiếu bởi Timeline, Rule, NBA.
                  </p>
                </div>

                {/* Event Name */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Tên sự kiện (Event Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.eventName || ''}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    placeholder="VD: Mở tài khoản thành công"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  {formErrors.eventName && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.eventName}</p>
                  )}
                </div>

                {/* Business Domain */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Miền nghiệp vụ (Business Domain) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.businessDomain || 'Customer'}
                    onChange={(e) =>
                      setFormData({ ...formData, businessDomain: e.target.value as EnterpriseDomain })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                  >
                    {ENTERPRISE_DOMAINS.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Type (4 types) */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Loại sự kiện (Event Type) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.eventType || 'Business Event'}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value as EventType })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-bold text-matcha-900 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-500 mt-1">
                    4 loại chuẩn: Business Event (thực tế), Derived Event (suy diễn), System Event (kỹ thuật), AI Event (mô hình phát hiện).
                  </p>
                </div>

                {/* Business Owner */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Đơn vị sở hữu (Business Owner) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.businessOwner || ''}
                    onChange={(e) => setFormData({ ...formData, businessOwner: e.target.value })}
                    placeholder="VD: Khối Giao dịch Chứng khoán"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                </div>

                {/* Effective From */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Ngày hiệu lực (Effective From) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effectiveFrom || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                </div>

                {/* Business Definition */}
                <div className="md:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">
                    Định nghĩa nghiệp vụ / Khi nào phát sinh <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.businessDefinition || ''}
                    onChange={(e) => setFormData({ ...formData, businessDefinition: e.target.value })}
                    placeholder="Giải thích Event là gì và thời điểm nào được coi là đã xảy ra..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  {formErrors.businessDefinition && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.businessDefinition}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'TAB_02' && (
              /* TAB 02: Trigger Source */
              <div className="space-y-6 text-xs">
                {/* Generation Mechanism (3 items) */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Cơ chế phát sinh (Generation Mechanism) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.generationMechanism || 'Real-time'}
                    onChange={(e) =>
                      setFormData({ ...formData, generationMechanism: e.target.value as GenerationMechanism })
                    }
                    className="max-w-md w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-bold text-matcha-900 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                  >
                    {GENERATION_MECHANISMS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-stone-500 text-[11px] space-y-0.5">
                    <div>• <strong>Real-time:</strong> Sự kiện ghi nhận/gửi đi ngay khi hành động xảy ra (Đăng nhập, Nạp tiền, Đặt lệnh).</div>
                    <div>• <strong>Scheduled:</strong> Tạo ra định kỳ theo lịch kiểm tra (Quét điều kiện mỗi ngày, snapshot định kỳ).</div>
                    <div>• <strong>Batch:</strong> Dữ liệu gom và xử lý theo lô cuối ngày trước khi phát sinh sự kiện.</div>
                  </div>
                </div>

                {/* Source Systems (Multi-select) */}
                <div className="pt-2 border-t border-stone-200">
                  <label className="block font-bold text-stone-800 mb-2">
                    Hệ thống nguồn thực tế (Source Systems) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-stone-500 text-[11px] mb-3">
                    Một Canonical Event có thể nhận dữ liệu từ nhiều hệ thống nguồn (ví dụ Flex và FTS cùng map về một sự kiện mở tài khoản).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {COMMON_SOURCE_SYSTEMS.map((sys) => {
                      const isSelected = formData.sourceSystems?.includes(sys);
                      return (
                        <div
                          key={sys}
                          onClick={() => handleToggleSourceSystem(sys)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-matcha-100/70 border-matcha-400 text-matcha-900 font-semibold'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          <span>{sys}</span>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                              isSelected ? 'bg-matcha-600 text-white' : 'border border-stone-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'TAB_03' && (
              /* TAB 03: Event Data Payload */
              <div className="space-y-6 text-xs">
                <div className="p-3.5 bg-matcha-50/70 border border-matcha-300 rounded-xl text-stone-700">
                  <strong className="text-matcha-900 font-bold">Nguyên tắc chọn dữ liệu:</strong>{' '}
                  Dữ liệu đi kèm chỉ được chọn từ Data Dictionary đã chuẩn hóa; Event không tự gõ field mới.
                  Tối thiểu cần ghi nhận các trường định danh và nội dung cốt lõi để sự kiện có ý nghĩa phân tích.
                </div>

                {formErrors.eventDataPayload && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.eventDataPayload}</span>
                  </div>
                )}

                {/* Add Data Element into Payload Form */}
                {(userRole === 'Maker' || userRole === 'Administrator') && (
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                    <div className="font-bold text-stone-900 text-xs">
                      Thêm Data Element từ Data Dictionary vào Payload sự kiện:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {/* Pick Data Element */}
                      <div>
                        <label className="block text-[11px] text-stone-500 mb-1">Chọn Data Code:*</label>
                        <select
                          value={selectedDataCodeToAdd}
                          onChange={(e) => setSelectedDataCodeToAdd(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded font-mono text-xs focus:ring-1 focus:ring-matcha-500"
                        >
                          <option value="">-- Chọn Data Element --</option>
                          {dataElements.map((el) => (
                            <option key={el.dataCode} value={el.dataCode}>
                              {el.dataCode} ({el.dataName})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Data Role (3 items) */}
                      <div>
                        <label className="block text-[11px] text-stone-500 mb-1">Vai trò dữ liệu:*</label>
                        <select
                          value={newDataRole}
                          onChange={(e) => setNewDataRole(e.target.value as DataRole)}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs focus:ring-1 focus:ring-matcha-500"
                        >
                          {DATA_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Required Toggle */}
                      <div>
                        <label className="block text-[11px] text-stone-500 mb-1">Bắt buộc:*</label>
                        <select
                          value={newRequired ? 'Yes' : 'No'}
                          onChange={(e) => setNewRequired(e.target.value === 'Yes')}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs focus:ring-1 focus:ring-matcha-500"
                        >
                          <option value="Yes">Yes (Bắt buộc có)</option>
                          <option value="No">No (Không bắt buộc)</option>
                        </select>
                      </div>

                      {/* Button */}
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddPayloadItem}
                          className="w-full px-3 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Gắn vào Payload</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Ý nghĩa sử dụng (ngắn gọn theo use case, ví dụ: Xác định khách hàng thực hiện tìm kiếm)..."
                        value={newUsageNote}
                        onChange={(e) => setNewUsageNote(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs focus:ring-1 focus:ring-matcha-500"
                      />
                    </div>
                  </div>
                )}

                {/* Table of Payload */}
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <tr>
                        <th className="py-2.5 px-3">Mã dữ liệu (Data Code)</th>
                        <th className="py-2.5 px-3">Tên dữ liệu</th>
                        <th className="py-2.5 px-3">Bắt buộc</th>
                        <th className="py-2.5 px-3">Vai trò dữ liệu (Data Role)</th>
                        <th className="py-2.5 px-3">Ý nghĩa sử dụng</th>
                        <th className="py-2.5 px-3 text-right">Gỡ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formData.eventDataPayload && formData.eventDataPayload.length > 0 ? (
                        formData.eventDataPayload.map((item) => (
                          <tr key={item.dataCode} className="hover:bg-stone-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">
                              {item.dataCode}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-stone-900">{item.dataName}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.required ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {item.required ? 'Bắt buộc (Yes)' : 'Tùy chọn (No)'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                  item.dataRole === 'Identity'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : item.dataRole === 'Core Content'
                                    ? 'bg-matcha-100 text-matcha-800 border-matcha-200 font-bold'
                                    : 'bg-stone-100 text-stone-700 border-stone-200'
                                }`}
                              >
                                {item.dataRole}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-stone-600">{item.businessUsage || '—'}</td>
                            <td className="py-2.5 px-3 text-right">
                              {(userRole === 'Maker' || userRole === 'Administrator') && (
                                <button
                                  onClick={() => handleRemovePayloadItem(item.dataCode)}
                                  className="p-1 text-stone-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-stone-400 italic">
                            Chưa có Data Element nào trong payload. Thêm từ Data Dictionary ở trên.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
