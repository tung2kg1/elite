import React, { useState } from 'react';
import {
  Database,
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
  DataElement,
  EnterpriseDomain,
  ENTERPRISE_DOMAINS,
  DATA_CLASSIFICATIONS,
  DataClassification,
  DATA_TYPES,
  DataType,
  VALUE_DETERMINATIONS,
  ValueDetermination,
  ValueListItem,
  UserRole
} from '../../types';
import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface DataDictionaryModuleProps {
  dataElements: DataElement[];
  onUpdateElements: (elements: DataElement[]) => void;
  selectedDomainFilter: EnterpriseDomain | 'ALL';
  globalSearch: string;
  userRole: UserRole;
  onLoadSampleData?: () => void;
}

export const DataDictionaryModule: React.FC<DataDictionaryModuleProps> = ({
  dataElements,
  onUpdateElements,
  selectedDomainFilter,
  globalSearch,
  userRole,
  onLoadSampleData
}) => {
  const [screen, setScreen] = useState<'LIST' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'TAB_01' | 'TAB_02'>('TAB_01');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Filters
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [determinationFilter, setDeterminationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<Partial<DataElement>>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Value list modal / row adding state
  const [newValueCode, setNewValueCode] = useState('');
  const [newValueNameEn, setNewValueNameEn] = useState('');
  const [newValueNameVi, setNewValueNameVi] = useState('');
  const [newValueDesc, setNewValueDesc] = useState('');

  const filteredElements = dataElements.filter((el) => {
    const matchesDomain =
      selectedDomainFilter === 'ALL' || el.dataDomain === selectedDomainFilter;
    const matchesClass =
      classificationFilter === 'ALL' || el.dataClassification === classificationFilter;
    const matchesType = typeFilter === 'ALL' || el.dataType === typeFilter;
    const matchesDet =
      determinationFilter === 'ALL' || el.valueDetermination === determinationFilter;
    const matchesStatus = statusFilter === 'ALL' || el.status === statusFilter;

    const effectiveSearch = (globalSearch || localSearch).trim().toLowerCase();
    const matchesSearch =
      !effectiveSearch ||
      el.dataCode.toLowerCase().includes(effectiveSearch) ||
      el.dataName.toLowerCase().includes(effectiveSearch) ||
      el.businessObjectDataGroup.toLowerCase().includes(effectiveSearch) ||
      el.businessDefinition.toLowerCase().includes(effectiveSearch);

    return matchesDomain && matchesClass && matchesType && matchesDet && matchesStatus && matchesSearch;
  });

  const handleOpenDetail = (el: DataElement) => {
    setSelectedElementId(el.id);
    setFormData({ ...el });
    setActiveTab('TAB_01');
    setFormErrors({});
    setScreen('DETAIL');
  };

  const handleCreateNew = () => {
    const newEl: Partial<DataElement> = {
      id: `DE_${Date.now()}`,
      dataDomain: (selectedDomainFilter !== 'ALL' ? selectedDomainFilter : 'Customer') as EnterpriseDomain,
      businessObjectDataGroup: 'Customer Profile',
      dataCode: '',
      dataName: '',
      businessDefinition: '',
      dataClassification: 'Internal',
      dataType: 'Text',
      valueDetermination: 'Direct Value',
      availableForSelection: true,
      status: 'Active',
      valueList: []
    };
    setSelectedElementId(null);
    setFormData(newEl);
    setActiveTab('TAB_01');
    setFormErrors({});
    setScreen('DETAIL');
  };

  const handleValidate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.dataCode?.trim()) {
      errors.dataCode = 'Mã dữ liệu không được để trống (Block).';
    } else {
      const duplicate = dataElements.find(
        (el) => el.dataCode.toUpperCase() === formData.dataCode?.toUpperCase() && el.id !== formData.id
      );
      if (duplicate) {
        errors.dataCode = 'Mã dữ liệu đã tồn tại trong Data Dictionary (Block).';
      }
    }

    if (!formData.dataName?.trim()) {
      errors.dataName = 'Tên dữ liệu không được để trống.';
    }

    if (!formData.businessDefinition?.trim()) {
      errors.businessDefinition = 'Bắt buộc nhập định nghĩa nghiệp vụ của Data Element.';
    }

    if (formData.valueDetermination === 'Reference Catalog' && !formData.referenceCatalog?.trim()) {
      errors.referenceCatalog = 'Bắt buộc chọn hoặc nhập tên Danh mục tham chiếu.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!handleValidate()) return;

    if (selectedElementId) {
      const updated = dataElements.map((el) =>
        el.id === selectedElementId ? ({ ...el, ...formData } as DataElement) : el
      );
      onUpdateElements(updated);
    } else {
      const created = {
        ...formData,
        dataCode: formData.dataCode?.toUpperCase().trim()
      } as DataElement;
      onUpdateElements([created, ...dataElements]);
      setSelectedElementId(created.id);
    }
    alert('Đã lưu Data Element thành công.');
  };

  const handleChangeStatus = (newStatus: DataElement['status']) => {
    if (!handleValidate()) return;
    const updated = { ...formData, status: newStatus } as DataElement;
    setFormData(updated);
    if (selectedElementId) {
      onUpdateElements(dataElements.map((el) => (el.id === selectedElementId ? updated : el)));
    }
    alert(`Đã chuyển trạng thái sang ${newStatus}.`);
  };

  const handleAddValueListItem = () => {
    if (!newValueCode.trim() || !newValueNameVi.trim()) {
      alert('Vui lòng nhập Mã giá trị và Tên giá trị tiếng Việt.');
      return;
    }

    const currentList = formData.valueList || [];
    if (currentList.some((v) => v.valueCode.toUpperCase() === newValueCode.toUpperCase())) {
      alert('Mã giá trị đã tồn tại trong danh sách này.');
      return;
    }

    const newItem: ValueListItem = {
      valueCode: newValueCode.toUpperCase().trim(),
      valueNameEn: newValueNameEn.trim() || newValueNameVi.trim(),
      valueNameVi: newValueNameVi.trim(),
      description: newValueDesc.trim(),
      status: 'Active'
    };

    setFormData({
      ...formData,
      valueList: [...currentList, newItem]
    });

    setNewValueCode('');
    setNewValueNameEn('');
    setNewValueNameVi('');
    setNewValueDesc('');
  };

  const handleRemoveValueItem = (code: string) => {
    setFormData({
      ...formData,
      valueList: (formData.valueList || []).filter((v) => v.valueCode !== code)
    });
  };

  return (
    <div className="space-y-6">
      {screen === 'LIST' ? (
        /* ======================== VIEW: 01: DATA DICTIONARY LIST ======================== */
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Data Dictionary List / Danh sách dữ liệu chuẩn
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Khai báo Data Element mới</span>
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
                placeholder="Tìm mã (VD: CUSTOMER_TYPE), tên, nhóm..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-matcha-500"
              />
            </div>

            {/* Phân loại dữ liệu (4 items) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-600">Phân loại:</span>
              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
              >
                <option value="ALL">Tất cả phân loại</option>
                {DATA_CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Kiểu dữ liệu (7 items) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-600">Kiểu DL:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
              >
                <option value="ALL">Tất cả kiểu</option>
                {DATA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Cách xác định giá trị (4 items) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-600">Xác định giá trị:</span>
              <select
                value={determinationFilter}
                onChange={(e) => setDeterminationFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
              >
                <option value="ALL">Tất cả cách</option>
                {VALUE_DETERMINATIONS.map((vd) => (
                  <option key={vd} value={vd}>
                    {vd}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table or Empty State */}
          {dataElements.length === 0 ? (
            <EmptyDataState
              icon={Database}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có phần tử dữ liệu nào (Data Dictionary Catalog)"
              primaryAction={{
                label: 'Thêm phần tử dữ liệu mới',
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
                      <th className="py-3 px-4">Mã dữ liệu (Data Code)</th>
                      <th className="py-3 px-4">Tên dữ liệu</th>
                      <th className="py-3 px-4">Miền & Đối tượng</th>
                      <th className="py-3 px-4">Phân loại bảo mật</th>
                      <th className="py-3 px-4">Kiểu dữ liệu</th>
                      <th className="py-3 px-4">Xác định giá trị</th>
                      <th className="py-3 px-4">Bộ chọn lọc</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredElements.length > 0 ? (
                      filteredElements.map((el) => (
                        <tr
                          key={el.id}
                          onClick={() => handleOpenDetail(el)}
                          className="hover:bg-matcha-50/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-matcha-900 whitespace-nowrap">
                            <DataValue value={el.dataCode} placeholder="Chưa có mã" monospace />
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-900">
                            <DataValue value={el.dataName} placeholder="Chưa đặt tên" />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-stone-800">
                              <DataValue value={el.dataDomain} placeholder="Chưa gán miền" />
                            </div>
                            <div className="text-[11px] text-stone-500 font-normal">
                              <DataValue value={el.businessObjectDataGroup} placeholder="Chưa gán nhóm" />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                el.dataClassification === 'Restricted'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : el.dataClassification === 'Confidential'
                                  ? 'bg-bronze-50 text-bronze-800 border-bronze-200'
                                  : 'bg-stone-100 text-stone-700 border-stone-200'
                              }`}
                            >
                              {el.dataClassification || 'Unclassified'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-stone-700">
                            <DataValue value={el.dataType} placeholder="String" />
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-matcha-100/80 text-matcha-900 border border-matcha-200 font-medium">
                              {el.valueDetermination || 'Direct'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                el.availableForSelection
                                  ? 'bg-matcha-100 text-matcha-800'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {el.availableForSelection ? 'Cho phép' : 'Không'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${getStatusBadgeClass(
                                el.status || 'Active'
                              )}`}
                            >
                              {getStatusLabel(el.status || 'Active')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(el);
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
                        <td colSpan={9} className="py-12 text-center">
                          <EmptyDataState
                            icon={Search}
                            tag="BỘ LỌC KHÔNG CÓ KẾT QUẢ"
                            title="Không tìm thấy phần tử dữ liệu phù hợp"
                            compact
                            primaryAction={{
                              label: 'Xóa bộ lọc tìm kiếm',
                              onClick: () => {
                                setClassificationFilter('ALL');
                                setTypeFilter('ALL');
                                setDeterminationFilter('ALL');
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
        /* ======================== VIEW: 02: DATA ELEMENT DETAIL ======================== */
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
                  {formData.dataCode ? `${formData.dataCode} · ${formData.dataName}` : 'Khai báo Data Element mới'}
                </h2>
                <div className="text-xs text-stone-500 mt-0.5">
                  Định nghĩa dữ liệu chuẩn và cấu hình tập giá trị theo mô hình UI động.
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
                  <span>Lưu thông tin</span>
                </button>
              )}

              {(userRole === 'Checker' || userRole === 'Administrator') && (
                <>
                  {formData.status === 'Pending Approval' && (
                    <button
                      onClick={() => handleChangeStatus('Active')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-matcha-700 hover:bg-matcha-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Phê duyệt (Approve & Active)</span>
                    </button>
                  )}

                  {formData.status === 'Active' && (
                    <button
                      onClick={() => handleChangeStatus('Inactive')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Ngưng áp dụng (Inactive)</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 2 Tabs as specified in technical document */}
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
              <span>Khai báo cơ bản (Basic Information)</span>
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
              <span>Giá trị dữ liệu (Value Definition)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bronze-100 text-bronze-800">
                {formData.valueDetermination}
              </span>
            </button>
          </div>

          {/* Tab 01 Content */}
          {activeTab === 'TAB_01' && (
            <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Data Domain */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Miền dữ liệu (Data Domain) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.dataDomain || 'Customer'}
                  onChange={(e) =>
                    setFormData({ ...formData, dataDomain: e.target.value as EnterpriseDomain })
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

              {/* Business Object / Data Group */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Đối tượng nghiệp vụ / Nhóm dữ liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessObjectDataGroup || ''}
                  onChange={(e) => setFormData({ ...formData, businessObjectDataGroup: e.target.value })}
                  placeholder="VD: Customer, KYC/Identity, Contact, Securities Account..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                />
              </div>

              {/* Data Code */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Mã dữ liệu (Data Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dataCode || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, dataCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })
                  }
                  placeholder="VD: CUSTOMER_TYPE, GENDER, CURRENT_NAV"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-matcha-900 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                />
                {formErrors.dataCode && (
                  <p className="text-rose-600 text-[11px] mt-1">{formErrors.dataCode}</p>
                )}
              </div>

              {/* Data Name */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Tên dữ liệu (Data Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dataName || ''}
                  onChange={(e) => setFormData({ ...formData, dataName: e.target.value })}
                  placeholder="VD: Loại khách hàng, Trạng thái tài khoản"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                />
                {formErrors.dataName && (
                  <p className="text-rose-600 text-[11px] mt-1">{formErrors.dataName}</p>
                )}
              </div>

              {/* Business Definition */}
              <div className="md:col-span-2">
                <label className="block font-bold text-stone-800 mb-1">
                  Định nghĩa nghiệp vụ (Business Definition) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.businessDefinition || ''}
                  onChange={(e) => setFormData({ ...formData, businessDefinition: e.target.value })}
                  placeholder="Giải thích Data Element là gì và được hiểu như thế nào theo ngôn ngữ nghiệp vụ..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                />
                {formErrors.businessDefinition && (
                  <p className="text-rose-600 text-[11px] mt-1">{formErrors.businessDefinition}</p>
                )}
              </div>

              {/* Data Classification (4 items) */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Phân loại dữ liệu (Data Classification) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.dataClassification || 'Internal'}
                  onChange={(e) =>
                    setFormData({ ...formData, dataClassification: e.target.value as DataClassification })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                >
                  {DATA_CLASSIFICATIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Type (7 items) */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Kiểu dữ liệu (Data Type) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.dataType || 'Text'}
                  onChange={(e) => {
                    const newType = e.target.value as DataType;
                    let suggestedDet = formData.valueDetermination;
                    if (newType === 'Boolean') suggestedDet = 'Yes-No';
                    if (newType === 'Enum' && suggestedDet === 'Direct Value') suggestedDet = 'Value List';
                    setFormData({ ...formData, dataType: newType, valueDetermination: suggestedDet });
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                >
                  {DATA_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value Determination (4 items) -> Drives Tab 02 */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Cách xác định giá trị (Value Determination) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.valueDetermination || 'Direct Value'}
                  onChange={(e) =>
                    setFormData({ ...formData, valueDetermination: e.target.value as ValueDetermination })
                  }
                  className="w-full px-3 py-2 bg-stone-50 border border-matcha-300 rounded-lg font-bold text-matcha-900 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                >
                  {VALUE_DETERMINATIONS.map((vd) => (
                    <option key={vd} value={vd}>
                      {vd}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Catalog (Conditional) */}
              {formData.valueDetermination === 'Reference Catalog' && (
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Danh mục tham chiếu (Reference Catalog) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.referenceCatalog || ''}
                    onChange={(e) => setFormData({ ...formData, referenceCatalog: e.target.value })}
                    placeholder="VD: Danh mục Quốc gia ISO-3166, Danh mục Tỉnh/Thành"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  {formErrors.referenceCatalog && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.referenceCatalog}</p>
                  )}
                </div>
              )}

              {/* Available for Selection */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="availSelect"
                  checked={formData.availableForSelection || false}
                  onChange={(e) => setFormData({ ...formData, availableForSelection: e.target.checked })}
                  className="w-4 h-4 text-matcha-600 rounded border-stone-300 focus:ring-matcha-500"
                />
                <label htmlFor="availSelect" className="text-xs font-semibold text-stone-800 cursor-pointer">
                  Cho phép dùng làm danh sách chọn lọc ở Module khác (Available for Selection)
                </label>
              </div>
            </div>
          )}

          {/* Tab 02 Content: Dynamic UI Logic based on Value Determination */}
          {activeTab === 'TAB_02' && (
            <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs space-y-5 text-xs">
              {/* Dynamic Case 1: Direct Value */}
              {formData.valueDetermination === 'Direct Value' && (
                <div className="p-8 text-center bg-stone-50 border border-dashed border-stone-300 rounded-xl space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                    <Info className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">
                    Trạng thái: Không áp dụng khai giá trị con (Direct Value)
                  </h4>
                  <p className="text-stone-500 max-w-lg mx-auto leading-relaxed">
                    Data Element này nhận giá trị trực tiếp từ hệ thống thực tế (ví dụ: CUSTOMER_ID, CURRENT_NAV, số tiền giao dịch...). 
                    Không có danh mục giá trị chuẩn cần định nghĩa trước.
                  </p>
                </div>
              )}

              {/* Dynamic Case 2: Yes-No */}
              {formData.valueDetermination === 'Yes-No' && (
                <div className="space-y-4">
                  <div className="p-4 bg-matcha-50/70 border border-matcha-200 rounded-xl">
                    <h4 className="font-bold text-matcha-900 mb-1">Hệ thống tự sinh 2 giá trị chuẩn Yes/No</h4>
                    <p className="text-stone-600 text-[11px]">
                      Không cần khai báo thủ công. Hai giá trị nhị phân chuẩn được khởi tạo tự động phục vụ các module downstream.
                    </p>
                  </div>

                  <div className="border border-stone-200 rounded-xl overflow-hidden max-w-md">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                        <tr>
                          <th className="py-2.5 px-3">Mã giá trị</th>
                          <th className="py-2.5 px-3">Tên tiếng Anh</th>
                          <th className="py-2.5 px-3">Tên tiếng Việt</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">Y</td>
                          <td className="py-2.5 px-3">Yes</td>
                          <td className="py-2.5 px-3">Có / Đồng ý</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-matcha-100 text-matcha-800 font-semibold">Active</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">N</td>
                          <td className="py-2.5 px-3">No</td>
                          <td className="py-2.5 px-3">Không / Từ chối</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-matcha-100 text-matcha-800 font-semibold">Active</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Dynamic Case 3: Reference Catalog */}
              {formData.valueDetermination === 'Reference Catalog' && (
                <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-stone-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-bronze-600" />
                    Tham chiếu Danh mục Dùng chung (Reference Catalog)
                  </h4>
                  <div className="p-4 bg-white border border-stone-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-stone-500">Tên danh mục tham chiếu:</div>
                      <div className="text-sm font-bold text-matcha-900">
                        {formData.referenceCatalog || 'Chưa cấu hình danh mục tại Tab 01'}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-bronze-100 text-bronze-800 rounded text-xs font-semibold">
                      Catalog Active
                    </span>
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    Toàn bộ các giá trị con (quốc gia, tỉnh thành, loại sản phẩm...) được quản lý tập trung ở Enterprise Catalog Catalog dùng chung, không khai lại tại đây.
                  </p>
                </div>
              )}

              {/* Dynamic Case 4: Value List */}
              {formData.valueDetermination === 'Value List' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900">Danh sách giá trị chuẩn (Value List)</h4>
                      <p className="text-[11px] text-stone-500">
                        Khai báo các giá trị chuẩn hợp lệ của Data Element này.
                      </p>
                    </div>
                  </div>

                  {/* Add New Value Row */}
                  {(userRole === 'Maker' || userRole === 'Administrator') && (
                    <div className="p-4 bg-matcha-50/50 border border-matcha-200 rounded-xl space-y-3">
                      <div className="font-bold text-matcha-900 text-xs">Thêm giá trị mới vào danh sách:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <input
                          type="text"
                          placeholder="Mã giá trị (VD: IND, ORG)*"
                          value={newValueCode}
                          onChange={(e) => setNewValueCode(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-stone-200 rounded font-mono text-xs focus:ring-1 focus:ring-matcha-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Tên tiếng Việt*"
                          value={newValueNameVi}
                          onChange={(e) => setNewValueNameVi(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs focus:ring-1 focus:ring-matcha-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Tên tiếng Anh (EN)"
                          value={newValueNameEn}
                          onChange={(e) => setNewValueNameEn(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs focus:ring-1 focus:ring-matcha-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddValueListItem}
                          className="px-3 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm vào bảng</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Table of Values */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                        <tr>
                          <th className="py-2.5 px-3">Mã giá trị (Value Code)</th>
                          <th className="py-2.5 px-3">Tên tiếng Việt</th>
                          <th className="py-2.5 px-3">Tên tiếng Anh</th>
                          <th className="py-2.5 px-3">Mô tả nghiệp vụ</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                          <th className="py-2.5 px-3 text-right">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {formData.valueList && formData.valueList.length > 0 ? (
                          formData.valueList.map((val) => (
                            <tr key={val.valueCode} className="hover:bg-stone-50">
                              <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">
                                {val.valueCode}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-stone-900">{val.valueNameVi}</td>
                              <td className="py-2.5 px-3 text-stone-600">{val.valueNameEn}</td>
                              <td className="py-2.5 px-3 text-stone-500 truncate max-w-xs">{val.description || '—'}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-matcha-100 text-matcha-800">
                                  {val.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {(userRole === 'Maker' || userRole === 'Administrator') && (
                                  <button
                                    onClick={() => handleRemoveValueItem(val.valueCode)}
                                    className="p-1 text-stone-400 hover:text-rose-600 rounded"
                                    title="Xóa giá trị này"
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
                              Chưa có giá trị nào trong Value List. Vui lòng thêm ít nhất một giá trị.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
