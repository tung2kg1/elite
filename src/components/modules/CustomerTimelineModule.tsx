import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Save,
  Check,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Sparkles,
  Eye,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import {
  CustomerTimelineConfig,
  CanonicalEvent,
  TimelineSelectedEvent,
  UserRole
} from '../../types';
import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface CustomerTimelineModuleProps {
  timelines: CustomerTimelineConfig[];
  onUpdateTimelines: (timelines: CustomerTimelineConfig[]) => void;
  canonicalEvents: CanonicalEvent[];
  userRole: UserRole;
  onLoadSampleData?: () => void;
}

export const CustomerTimelineModule: React.FC<CustomerTimelineModuleProps> = ({
  timelines,
  onUpdateTimelines,
  canonicalEvents,
  userRole,
  onLoadSampleData
}) => {
  // Screens: 'LIST' , 'DESIGNER' , 'FULL_PREVIEW' 
  const [screen, setScreen] = useState<'LIST' | 'DESIGNER' | 'FULL_PREVIEW'>('LIST');
  const [activeTab, setActiveTab] = useState<'TAB_01' | 'TAB_02' | 'TAB_03'>('TAB_01');
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CustomerTimelineConfig>>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Timeline preview filter
  const [previewGroupFilter, setPreviewGroupFilter] = useState<string>('ALL');
  const [previewImportanceFilter, setPreviewImportanceFilter] = useState<string>('ALL');

  // Event to add modal
  const [eventToAddCode, setEventToAddCode] = useState('');

  const handleOpenDesigner = (tl: CustomerTimelineConfig) => {
    setSelectedTimelineId(tl.id);
    setFormData(JSON.parse(JSON.stringify(tl)));
    setActiveTab('TAB_01');
    setFormErrors({});
    setScreen('DESIGNER');
  };

  const handleOpenFullPreview = (tl: CustomerTimelineConfig) => {
    setSelectedTimelineId(tl.id);
    setFormData(JSON.parse(JSON.stringify(tl)));
    setScreen('FULL_PREVIEW');
  };

  const handleCreateNew = () => {
    const newTl: Partial<CustomerTimelineConfig> = {
      id: `TL_${Date.now()}`,
      timelineCode: '',
      timelineName: '',
      customerType: 'Individual',
      businessDescription: '',
      status: 'Active',
      effectiveFrom: new Date().toISOString().split('T')[0],
      selectedEvents: []
    };
    setSelectedTimelineId(null);
    setFormData(newTl);
    setActiveTab('TAB_01');
    setFormErrors({});
    setScreen('DESIGNER');
  };

  const handleValidate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.timelineCode?.trim()) {
      errors.timelineCode = 'Mã cấu hình Timeline không được để trống.';
    }
    if (!formData.timelineName?.trim()) {
      errors.timelineName = 'Tên cấu hình Timeline không được để trống.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!handleValidate()) return;

    if (selectedTimelineId) {
      const updated = timelines.map((t) =>
        t.id === selectedTimelineId ? ({ ...t, ...formData } as CustomerTimelineConfig) : t
      );
      onUpdateTimelines(updated);
    } else {
      const created = {
        ...formData,
        timelineCode: formData.timelineCode?.toUpperCase().trim()
      } as CustomerTimelineConfig;
      onUpdateTimelines([created, ...timelines]);
      setSelectedTimelineId(created.id);
    }
    alert('Đã lưu cấu hình Customer Timeline thành công.');
  };

  const handleAddEvent = () => {
    if (!eventToAddCode) return;
    const foundEvt = canonicalEvents.find((e) => e.eventCode === eventToAddCode);
    const current = formData.selectedEvents || [];
    if (current.some((e) => e.eventCode === eventToAddCode)) {
      alert('Sự kiện này đã được chọn trong cấu hình Timeline.');
      return;
    }

    const newSelEvent: TimelineSelectedEvent = {
      eventCode: eventToAddCode,
      eventDisplayName: foundEvt?.eventName || eventToAddCode,
      timelineGroup: foundEvt?.businessDomain || 'Chung',
      importance: 'Normal',
      detailAttributes: foundEvt?.eventDataPayload?.map((p) => p.dataCode) || [],
      status: 'Active'
    };

    setFormData({
      ...formData,
      selectedEvents: [...current, newSelEvent]
    });
    setEventToAddCode('');
  };

  const handleRemoveEvent = (code: string) => {
    setFormData({
      ...formData,
      selectedEvents: (formData.selectedEvents || []).filter((e) => e.eventCode !== code)
    });
  };

  // Timeline events store (chưa có data thực tế)
  const sampleTimelineEvents: any[] = [];

  return (
    <div className="space-y-6">
      {screen === 'LIST' && (
        /* ======================== VIEW: 01: TIMELINE CONFIGURATION LIST ======================== */
        <div className="space-y-5">
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Customer Timeline Configuration / Danh sách cấu hình dòng thời gian
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo cấu hình Timeline mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Table or Empty State */}
          {timelines.length === 0 ? (
            <EmptyDataState
              icon={Clock}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có cấu hình Customer Timeline nào"
              primaryAction={{
                label: 'Tạo cấu hình Timeline mới',
                onClick: handleCreateNew,
                icon: Plus
              }}
            />
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-4">Timeline Code</th>
                      <th className="py-3 px-4">Tên cấu hình Timeline</th>
                      <th className="py-3 px-4">Loại khách hàng áp dụng</th>
                      <th className="py-3 px-4">Số loại sự kiện đã chọn</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Ngày hiệu lực</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {timelines.map((tl) => (
                      <tr key={tl.id} className="hover:bg-matcha-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-matcha-900">
                          <DataValue value={tl.timelineCode} placeholder="Chưa có mã" monospace />
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          <DataValue value={tl.timelineName} placeholder="Chưa đặt tên" />
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 font-medium">
                            {tl.customerType || 'Tất cả'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-matcha-100 text-matcha-800 font-bold">
                            {tl.selectedEvents?.length || 0} Events
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(
                              tl.status || 'Active'
                            )}`}
                          >
                            {getStatusLabel(tl.status || 'Active')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-500">
                          <DataValue value={tl.effectiveFrom} placeholder="Chưa hiệu lực" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDesigner(tl)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-matcha-50 text-matcha-800 border border-matcha-200 hover:bg-matcha-100 transition-colors"
                            >
                              Thiết kế
                            </button>
                            <button
                              onClick={() => handleOpenFullPreview(tl)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-bronze-50 text-bronze-800 border border-bronze-200 hover:bg-bronze-100 transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Xem trước</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === 'DESIGNER' && (
        /* ======================== VIEW: 02: TIMELINE DETAIL / DESIGNER ======================== */
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen('LIST')}
                className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  Timeline Designer · {formData.timelineName || 'Cấu hình mới'}
                </h2>
                <div className="text-xs text-stone-500 mt-0.5">
                  Chọn lọc Canonical Events từ Event Taxonomy và cấu hình hiển thị theo nhóm/độ quan trọng.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenFullPreview(formData as CustomerTimelineConfig)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bronze-50 border border-bronze-200 text-bronze-800 rounded-lg text-xs font-bold hover:bg-bronze-100 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Xem toàn màn hình</span>
              </button>
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Timeline</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Tabs */}
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
              <span>Chọn sự kiện (Event Selection)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-matcha-100 text-matcha-800">
                {formData.selectedEvents?.length || 0}
              </span>
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
              <span>Xem trước bố cục (Preview)</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs">
            {activeTab === 'TAB_01' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Mã cấu hình Timeline*</label>
                  <input
                    type="text"
                    value={formData.timelineCode || ''}
                    onChange={(e) => setFormData({ ...formData, timelineCode: e.target.value.toUpperCase() })}
                    placeholder="VD: TL_INDIVIDUAL_360"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-matcha-900"
                  />
                  {formErrors.timelineCode && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.timelineCode}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Tên cấu hình Timeline*</label>
                  <input
                    type="text"
                    value={formData.timelineName || ''}
                    onChange={(e) => setFormData({ ...formData, timelineName: e.target.value })}
                    placeholder="VD: Dòng thời gian Khách hàng Cá nhân"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  />
                  {formErrors.timelineName && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.timelineName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Loại khách hàng áp dụng*</label>
                  <select
                    value={formData.customerType || 'Individual'}
                    onChange={(e) =>
                      setFormData({ ...formData, customerType: e.target.value as 'Individual' | 'Organization' })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-stone-800"
                  >
                    <option value="Individual">Individual (Cá nhân)</option>
                    <option value="Organization">Organization (Tổ chức)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Ngày hiệu lực*</label>
                  <input
                    type="date"
                    value={formData.effectiveFrom || ''}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Mô tả nghiệp vụ</label>
                  <textarea
                    rows={2}
                    value={formData.businessDescription || ''}
                    onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                    placeholder="Giải thích mục đích của bộ Timeline này..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  />
                </div>
              </div>
            )}

            {activeTab === 'TAB_02' && (
              <div className="space-y-5 text-xs">
                {/* Pick Event from Event Taxonomy */}
                {(userRole === 'Maker' || userRole === 'Administrator') && (
                  <div className="p-4 bg-matcha-50/60 border border-matcha-200 rounded-xl flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-bold text-matcha-900 mb-1">
                        Chọn Canonical Event từ Event Taxonomy để đưa lên Timeline:
                      </label>
                      <select
                        value={eventToAddCode}
                        onChange={(e) => setEventToAddCode(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-matcha-300 rounded-lg font-medium text-stone-800 text-xs"
                      >
                        <option value="">-- Chọn Canonical Event Active --</option>
                        {canonicalEvents.map((evt) => (
                          <option key={evt.eventCode} value={evt.eventCode}>
                            {evt.eventCode} · {evt.eventName} ({evt.businessDomain})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddEvent}
                      className="self-end sm:self-auto px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Đưa lên Timeline</span>
                    </button>
                  </div>
                )}

                {/* Selected Events List */}
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <tr>
                        <th className="py-2.5 px-3">Mã Event chuẩn</th>
                        <th className="py-2.5 px-3">Tên hiển thị trên Timeline</th>
                        <th className="py-2.5 px-3">Nhóm hiển thị (Group)</th>
                        <th className="py-2.5 px-3">Độ quan trọng (Importance)</th>
                        <th className="py-2.5 px-3">Thuộc tính chi tiết hiển thị</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formData.selectedEvents && formData.selectedEvents.length > 0 ? (
                        formData.selectedEvents.map((item) => (
                          <tr key={item.eventCode} className="hover:bg-stone-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">
                              {item.eventCode}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.eventDisplayName}
                                onChange={(e) => {
                                  const updated = formData.selectedEvents?.map((s) =>
                                    s.eventCode === item.eventCode ? { ...s, eventDisplayName: e.target.value } : s
                                  );
                                  setFormData({ ...formData, selectedEvents: updated });
                                }}
                                className="px-2 py-1 bg-white border border-stone-200 rounded text-xs w-full max-w-xs focus:ring-1 focus:ring-matcha-500"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.timelineGroup}
                                onChange={(e) => {
                                  const updated = formData.selectedEvents?.map((s) =>
                                    s.eventCode === item.eventCode ? { ...s, timelineGroup: e.target.value } : s
                                  );
                                  setFormData({ ...formData, selectedEvents: updated });
                                }}
                                className="px-2 py-1 bg-white border border-stone-200 rounded text-xs w-full max-w-xs focus:ring-1 focus:ring-matcha-500"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={item.importance}
                                onChange={(e) => {
                                  const updated = formData.selectedEvents?.map((s) =>
                                    s.eventCode === item.eventCode
                                      ? { ...s, importance: e.target.value as 'Normal' | 'Important' | 'Critical' }
                                      : s
                                  );
                                  setFormData({ ...formData, selectedEvents: updated });
                                }}
                                className="px-2 py-1 bg-white border border-stone-200 rounded text-xs font-semibold"
                              >
                                <option value="Normal">Normal</option>
                                <option value="Important">Important</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-[11px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                                {item.detailAttributes.join(', ') || 'Tất cả'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-matcha-100 text-matcha-800">
                                {getStatusLabel(item.status)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {(userRole === 'Maker' || userRole === 'Administrator') && (
                                <button
                                  onClick={() => handleRemoveEvent(item.eventCode)}
                                  className="p-1 text-stone-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-stone-400 italic">
                            Chưa chọn sự kiện nào cho Timeline.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'TAB_03' && (
              /* TAB 03: Preview in-designer */
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div className="text-stone-600">
                    Xem trước bố cục dòng thời gian dựa trên các sự kiện đã cấu hình:
                  </div>
                  <button
                    onClick={() => handleOpenFullPreview(formData as CustomerTimelineConfig)}
                    className="px-3 py-1.5 bg-bronze-600 text-white rounded-lg font-bold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Mở toàn màn hình</span>
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl p-5 bg-stone-50/50 space-y-4">
                  {sampleTimelineEvents.length === 0 ? (
                    <EmptyDataState
                      tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
                      title="Chưa có dữ liệu sự kiện phát sinh"
                      compact
                    />
                  ) : (
                    sampleTimelineEvents.map((evt, idx) => (
                      <div key={evt.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full mt-1 ${
                              evt.importance === 'Critical'
                                ? 'bg-rose-500 ring-4 ring-rose-100'
                                : evt.importance === 'Important'
                                ? 'bg-bronze-500 ring-4 ring-bronze-100'
                                : 'bg-matcha-500 ring-4 ring-matcha-100'
                            }`}
                          />
                          {idx !== sampleTimelineEvents.length - 1 && (
                            <div className="w-0.5 flex-1 bg-stone-200 my-1" />
                          )}
                        </div>
                        <div className="flex-1 bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">{evt.name}</span>
                            <span className="font-mono text-[11px] text-stone-500">{evt.time}</span>
                          </div>
                          <div className="text-[11px] text-matcha-800 font-semibold">{evt.group}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === 'FULL_PREVIEW' && (
        /* ======================== VIEW: 03: FULL SCREEN TIMELINE PREVIEW ======================== */
        <div className="space-y-5">
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen('LIST')}
                className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  Customer Timeline Preview (Toàn màn hình)
                </h2>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <select
                value={previewImportanceFilter}
                onChange={(e) => setPreviewImportanceFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800"
              >
                <option value="ALL">Tất cả mức độ</option>
                <option value="Critical">Chỉ Critical</option>
                <option value="Important">Important & Critical</option>
              </select>
            </div>
          </div>

          {/* Interactive Timeline Stream */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Lịch sử sự kiện của khách hàng #CUST_882910</h3>
                <span className="text-xs text-stone-500">Nguyễn Văn An · Khách hàng Cá nhân (Active)</span>
              </div>
              <span className="text-xs font-mono bg-matcha-50 text-matcha-900 border border-matcha-200 px-2 py-1 rounded">
                Live Customer Stream
              </span>
            </div>

            <div className="space-y-6 pl-2">
              {sampleTimelineEvents.length === 0 ? (
                <EmptyDataState
                  tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
                  title="Chưa có sự kiện timeline nào phát sinh trong tài khoản này"
                />
              ) : (
                sampleTimelineEvents
                  .filter((evt) => {
                    if (previewImportanceFilter === 'Critical') return evt.importance === 'Critical';
                    if (previewImportanceFilter === 'Important')
                      return evt.importance === 'Important' || evt.importance === 'Critical';
                    return true;
                  })
                  .map((evt, idx, arr) => (
                    <div key={evt.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-4 h-4 rounded-full mt-1 flex items-center justify-center text-[10px] text-white font-bold ${
                            evt.importance === 'Critical'
                              ? 'bg-rose-500 ring-4 ring-rose-100'
                              : evt.importance === 'Important'
                              ? 'bg-bronze-500 ring-4 ring-bronze-100'
                              : 'bg-matcha-500 ring-4 ring-matcha-100'
                          }`}
                        />
                        {idx !== arr.length - 1 && <div className="w-0.5 flex-1 bg-stone-200 my-1" />}
                      </div>

                      <div className="flex-1 bg-stone-50/70 border border-stone-200 rounded-xl p-4 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-stone-900">{evt.name}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                evt.importance === 'Critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : evt.importance === 'Important'
                                  ? 'bg-bronze-100 text-bronze-800'
                                  : 'bg-matcha-100 text-matcha-800'
                              }`}
                            >
                              {evt.importance}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-stone-500">{evt.time}</span>
                        </div>

                        <div className="text-xs text-matcha-800 font-semibold">{evt.group}</div>

                        {/* Detail attributes card */}
                        <div className="pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {evt.attributes && Object.entries(evt.attributes).map(([k, v]) => (
                            <div key={k} className="p-1.5 bg-white border border-stone-200 rounded text-[11px]">
                              <span className="text-stone-400 font-mono block">{k}:</span>
                              <span className="font-bold text-stone-800">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
