import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Save,
  Check,
  X,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react';
import {
  VocabularyTerm,
  EnterpriseDomain,
  ENTERPRISE_DOMAINS,
  VOCABULARY_TYPES,
  VocabularyType,
  UserRole
} from '../../types';
import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface BusinessVocabularyModuleProps {
  terms: VocabularyTerm[];
  onUpdateTerms: (terms: VocabularyTerm[]) => void;
  selectedDomainFilter: EnterpriseDomain | 'ALL';
  globalSearch: string;
  userRole: UserRole;
  onLoadSampleData?: () => void;
}

export const BusinessVocabularyModule: React.FC<BusinessVocabularyModuleProps> = ({
  terms,
  onUpdateTerms,
  selectedDomainFilter,
  globalSearch,
  userRole,
  onLoadSampleData
}) => {
  // Screen state: 'LIST'  or 'DETAIL' 
  const [screen, setScreen] = useState<'LIST' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'TAB_01' | 'TAB_02' | 'TAB_03'>('TAB_01');
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Form State for Editing/Creating
  const [formData, setFormData] = useState<Partial<VocabularyTerm>>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [impactWarning, setImpactWarning] = useState<string | null>(null);

  const selectedTerm = terms.find((t) => t.id === selectedTermId);

  // Filtered terms
  const filteredTerms = terms.filter((term) => {
    const matchesDomain =
      selectedDomainFilter === 'ALL' || term.businessDomain === selectedDomainFilter;
    const matchesType = typeFilter === 'ALL' || term.vocabularyType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || term.status === statusFilter;
    const effectiveSearch = (globalSearch || localSearch).trim().toLowerCase();
    const matchesSearch =
      !effectiveSearch ||
      term.termCode.toLowerCase().includes(effectiveSearch) ||
      term.termNameEn.toLowerCase().includes(effectiveSearch) ||
      term.termNameVi.toLowerCase().includes(effectiveSearch) ||
      term.standardDefinition.toLowerCase().includes(effectiveSearch);

    return matchesDomain && matchesType && matchesStatus && matchesSearch;
  });

  const handleOpenDetail = (term: VocabularyTerm) => {
    setSelectedTermId(term.id);
    setFormData({ ...term });
    setActiveTab('TAB_01');
    setFormErrors({});
    if (term.usageCount > 0) {
      setImpactWarning(
        `Thuật ngữ này đang được ${term.usageCount} đối tượng downstream (Data Dictionary, Event, Rule) tham chiếu. Mọi thay đổi sẽ ảnh hưởng đến các cấu hình liên quan.`
      );
    } else {
      setImpactWarning(null);
    }
    setScreen('DETAIL');
  };

  const handleCreateNew = () => {
    const newTerm: Partial<VocabularyTerm> = {
      id: `VOC_${Date.now()}`,
      termCode: '',
      termNameEn: '',
      termNameVi: '',
      businessDomain: (selectedDomainFilter !== 'ALL' ? selectedDomainFilter : 'Customer') as EnterpriseDomain,
      vocabularyGroup: 'General',
      vocabularyType: 'Lifecycle',
      businessOwner: 'Khối Quản trị Khách hàng',
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'Active',
      standardDefinition: '',
      distinguishFrom: [],
      synonyms: [],
      relatedTerms: [],
      usedByDataDictionary: [],
      usedByEventTaxonomy: [],
      usedByMetricRule: [],
      usageCount: 0
    };
    setSelectedTermId(null);
    setFormData(newTerm);
    setActiveTab('TAB_01');
    setFormErrors({});
    setImpactWarning(null);
    setScreen('DETAIL');
  };

  const handleValidate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.termCode?.trim()) {
      errors.termCode = 'Mã thuật ngữ không được để trống (Block).';
    } else {
      // Check duplicate code
      const duplicate = terms.find(
        (t) => t.termCode.toUpperCase() === formData.termCode?.toUpperCase() && t.id !== formData.id
      );
      if (duplicate) {
        errors.termCode = 'Mã thuật ngữ đã tồn tại trong hệ thống (Block).';
      }
    }

    if (!formData.termNameEn?.trim()) errors.termNameEn = 'Tên tiếng Anh không được để trống.';
    if (!formData.termNameVi?.trim()) errors.termNameVi = 'Tên tiếng Việt không được để trống.';
    if (!formData.standardDefinition?.trim()) {
      errors.standardDefinition = 'Bắt buộc nhập định nghĩa chuẩn bằng ngôn ngữ nghiệp vụ.';
    }

    if (formData.effectiveFrom && formData.effectiveTo) {
      if (new Date(formData.effectiveTo) < new Date(formData.effectiveFrom)) {
        errors.effectiveTo = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu hiệu lực.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!handleValidate()) return;

    if (selectedTermId) {
      // Update
      const updated = terms.map((t) =>
        t.id === selectedTermId ? ({ ...t, ...formData } as VocabularyTerm) : t
      );
      onUpdateTerms(updated);
    } else {
      // Create new
      const created = {
        ...formData,
        termCode: formData.termCode?.toUpperCase().trim()
      } as VocabularyTerm;
      onUpdateTerms([created, ...terms]);
      setSelectedTermId(created.id);
    }
    alert('Đã lưu thông tin thuật ngữ chuẩn thành công.');
  };

  const handleChangeStatus = (newStatus: VocabularyTerm['status']) => {
    if (!handleValidate()) return;
    const updatedTerm = { ...formData, status: newStatus } as VocabularyTerm;
    setFormData(updatedTerm);
    if (selectedTermId) {
      onUpdateTerms(terms.map((t) => (t.id === selectedTermId ? updatedTerm : t)));
    }
  };

  return (
    <div className="space-y-6">
      {screen === 'LIST' ? (
        /* ======================== VIEW: 01: VOCABULARY LIST ======================== */
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Vocabulary List / Danh sách thuật ngữ chuẩn
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Khai báo thuật ngữ mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-2xs">
              <div className="text-[11px] text-stone-600 font-medium">Tổng thuật ngữ</div>
              <div className="text-xl font-bold text-stone-900 mt-0.5">{terms.length}</div>
            </div>
            <div className="bg-matcha-50/60 border border-matcha-200 rounded-xl p-3 shadow-2xs">
              <div className="text-[11px] text-matcha-800 font-medium">Đang Active</div>
              <div className="text-xl font-bold text-matcha-800 mt-0.5">
                {terms.filter((t) => t.status === 'Active').length}
              </div>
            </div>
            <div className="bg-bronze-50/60 border border-bronze-200 rounded-xl p-3 shadow-2xs">
              <div className="text-[11px] text-bronze-800 font-medium">Chờ duyệt (Pending)</div>
              <div className="text-xl font-bold text-bronze-800 mt-0.5">
                {terms.filter((t) => t.status === 'Pending Approval').length}
              </div>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 shadow-2xs">
              <div className="text-[11px] text-stone-600 font-medium">Ngưng sử dụng (Retired/Dep)</div>
              <div className="text-xl font-bold text-stone-700 mt-0.5">
                {terms.filter((t) => t.status === 'Deprecated' || t.status === 'Retired').length}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên thuật ngữ (VI/EN)..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-matcha-500"
              />
            </div>

            {/* Type filter (9 types) */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-600">Loại thuật ngữ:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
              >
                <option value="ALL">Tất cả 9 loại</option>
                {VOCABULARY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
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
                <option value="Deprecated">Lỗi thời</option>
                <option value="Retired">Đã ngưng</option>
              </select>
            </div>
          </div>

          {/* Table or Empty State */}
          {terms.length === 0 ? (
            <EmptyDataState
              icon={BookOpen}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có thuật ngữ nghiệp vụ nào (Business Vocabulary)"
              primaryAction={{
                label: 'Khai báo thuật ngữ mới',
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
                      <th className="py-3 px-4">Mã thuật ngữ (Term Code)</th>
                      <th className="py-3 px-4">Tên tiếng Việt / Anh</th>
                      <th className="py-3 px-4">Miền nghiệp vụ</th>
                      <th className="py-3 px-4">Loại thuật ngữ (9 loại)</th>
                      <th className="py-3 px-4">Đơn vị sở hữu</th>
                      <th className="py-3 px-4">Nơi dùng</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTerms.length > 0 ? (
                      filteredTerms.map((term) => (
                        <tr
                          key={term.id}
                          onClick={() => handleOpenDetail(term)}
                          className="hover:bg-matcha-50/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-matcha-900 whitespace-nowrap">
                            <DataValue value={term.termCode} placeholder="Chưa có mã" monospace />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">
                              <DataValue value={term.termNameVi} placeholder="Chưa đặt tên tiếng Việt" />
                            </div>
                            <div className="text-[11px] text-stone-500 font-normal">
                              <DataValue value={term.termNameEn} placeholder="Chưa có tên tiếng Anh" />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[11px] font-medium border border-stone-200">
                              {term.businessDomain || 'Chưa gán miền'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-matcha-100/70 text-matcha-800 rounded text-[11px] font-medium border border-matcha-200">
                              {term.vocabularyType || 'Chưa phân loại'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-600 truncate max-w-[160px]">
                            <DataValue value={term.businessOwner} placeholder="Chưa chỉ định chủ sở hữu" />
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                (term.usageCount || 0) > 0
                                  ? 'bg-bronze-100 text-bronze-800 border border-bronze-200'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {term.usageCount || 0} liên kết
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${getStatusBadgeClass(
                                term.status || 'Active'
                              )}`}
                            >
                              {getStatusLabel(term.status || 'Active')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetail(term);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-matcha-700 hover:text-matcha-900 hover:bg-matcha-100 transition-colors"
                            >
                              Chi tiết
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
                            title="Không tìm thấy thuật ngữ phù hợp"
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
        /* ======================== VIEW: 02: VOCABULARY DETAIL ======================== */
        <div className="space-y-5">
          {/* Back & Title Header */}
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
                  {formData.termCode ? `${formData.termCode} · ${formData.termNameVi || 'Chi tiết thuật ngữ'}` : 'Khai báo thuật ngữ mới'}
                </h2>
                <div className="text-xs text-stone-500 mt-0.5">
                  Quản lý định danh, định nghĩa ngữ nghĩa và liên kết downstream của thuật ngữ chuẩn.
                </div>
              </div>
            </div>

            {/* Workflow / Action Buttons based on User Role */}
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-matcha-700 hover:bg-matcha-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Phê duyệt (Approve & Active)</span>
                    </button>
                  )}

                  {formData.status === 'Active' && (
                    <button
                      onClick={() => handleChangeStatus('Deprecated')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Ngưng áp dụng (Deprecate)</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Impact Warning Banner if term is widely used */}
          {impactWarning && (
            <div className="bg-bronze-50 border border-bronze-300 rounded-xl p-4 flex items-start gap-3 text-xs text-bronze-900 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-bronze-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Cảnh báo tác động hệ thống (Impact Warning):</strong>
                <p className="mt-0.5 text-stone-700">{impactWarning}</p>
              </div>
            </div>
          )}

          {/* Tabs Navigation */}
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
              <span>Định nghĩa & Ý nghĩa (Definition & Meaning)</span>
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
              <span>Liên kết & Nơi sử dụng (Relationship & Usage)</span>
              {formData.usageCount ? (
                <span className="ml-1 text-[10px] font-mono bg-bronze-100 text-bronze-800 px-1.5 rounded-full">
                  {formData.usageCount}
                </span>
              ) : null}
            </button>
          </div>

          {/* Tab Contents */}
          <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs">
            {activeTab === 'TAB_01' && (
              /* TAB 01: General Information */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* Term Code */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Mã thuật ngữ (Term Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={formData.status === 'Active' && userRole !== 'Administrator'}
                    value={formData.termCode || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, termCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })
                    }
                    placeholder="VD: NEW_CUSTOMER, DORMANT"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-matcha-900 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  {formErrors.termCode && (
                    <p className="text-rose-600 text-[11px] mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.termCode}
                    </p>
                  )}
                  <p className="text-[11px] text-stone-500 mt-1">
                    Mã duy nhất, khuyến nghị dạng UPPER_SNAKE_CASE. Hạn chế đổi sau khi Active vì các module khác đang tham chiếu.
                  </p>
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
                  <p className="text-[11px] text-stone-500 mt-1">
                    Chọn từ 17 Enterprise Domain Catalog dùng chung toàn hệ thống.
                  </p>
                </div>

                {/* Term Name (EN) */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Tên thuật ngữ tiếng Anh (Term Name EN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.termNameEn || ''}
                    onChange={(e) => setFormData({ ...formData, termNameEn: e.target.value })}
                    placeholder="VD: New Customer"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  {formErrors.termNameEn && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.termNameEn}</p>
                  )}
                </div>

                {/* Term Name (VI) */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Tên thuật ngữ tiếng Việt (Term Name VI) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.termNameVi || ''}
                    onChange={(e) => setFormData({ ...formData, termNameVi: e.target.value })}
                    placeholder="VD: Khách hàng mới"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  {formErrors.termNameVi && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.termNameVi}</p>
                  )}
                </div>

                {/* Vocabulary Group */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Nhóm thuật ngữ (Vocabulary Group)
                  </label>
                  <input
                    type="text"
                    value={formData.vocabularyGroup || ''}
                    onChange={(e) => setFormData({ ...formData, vocabularyGroup: e.target.value })}
                    placeholder="VD: Lifecycle & Segmentation"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">Phân loại nhóm nhỏ trong Domain gốc.</p>
                </div>

                {/* Vocabulary Type (9 types standard) */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Loại thuật ngữ (Vocabulary Type) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.vocabularyType || 'Lifecycle'}
                    onChange={(e) =>
                      setFormData({ ...formData, vocabularyType: e.target.value as VocabularyType })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-matcha-900 focus:outline-none focus:ring-1 focus:ring-matcha-500 cursor-pointer"
                  >
                    {VOCABULARY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Bộ chuẩn 9 loại: Entity Classification, Entity Subtype, State, Lifecycle, Condition, Metric, Action, Channel, Consent.
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
                    placeholder="VD: Khối Khách hàng Cá nhân"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">Đơn vị chịu trách nhiệm nội dung thuật ngữ.</p>
                </div>

                {/* Effective Period */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Hiệu lực từ (Effective From) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveFrom || ''}
                      onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Hiệu lực đến (Effective To)
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveTo || ''}
                      onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                    />
                    {formErrors.effectiveTo && (
                      <p className="text-rose-600 text-[11px] mt-1">{formErrors.effectiveTo}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'TAB_02' && (
              /* TAB 02: Definition & Meaning */
              <div className="space-y-5 text-xs">
                {/* Crucial Principle Note */}
                <div className="p-3.5 bg-matcha-50/80 border border-matcha-300 rounded-xl text-stone-700 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-matcha-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-matcha-900 font-bold">Nguyên tắc thiết kế cốt lõi:</strong>{' '}
                    Vocabulary định nghĩa <em>"ý nghĩa"</em>; tham số và logic thay đổi theo chính sách nằm ở Metric/Rule.
                    Ví dụ "New Customer" được định nghĩa bằng lời, còn ngưỡng 60 ngày hay 90 ngày được cấu hình ở Rule.
                  </div>
                </div>

                {/* Standard Definition */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Định nghĩa chuẩn (Standard Definition) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.standardDefinition || ''}
                    onChange={(e) => setFormData({ ...formData, standardDefinition: e.target.value })}
                    placeholder="Giải thích chính thức 'khái niệm này là gì' bằng ngôn ngữ nghiệp vụ, ngắn gọn, không chứa SQL/công thức kỹ thuật..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500 leading-relaxed"
                  />
                  {formErrors.standardDefinition && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.standardDefinition}</p>
                  )}
                </div>

                {/* Distinguish From */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Phân biệt với (Distinguish From)
                  </label>
                  <input
                    type="text"
                    value={formData.distinguishNotes || ''}
                    onChange={(e) => setFormData({ ...formData, distinguishNotes: e.target.value })}
                    placeholder="Khác biệt nghiệp vụ (VD: Khác với Prospect và Onboarding ở chỗ...)"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                </div>

                {/* Synonym / Alias */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Tên gọi tương đương / Tên khác (Synonym / Alias)
                  </label>
                  <input
                    type="text"
                    value={formData.synonyms?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        synonyms: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      })
                    }
                    placeholder="Các tên cũ hoặc tên khác, phân cách bởi dấu phẩy"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                </div>

                {/* Business Note */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Ghi chú nghiệp vụ (Business Note)</label>
                  <textarea
                    rows={2}
                    value={formData.businessNote || ''}
                    onChange={(e) => setFormData({ ...formData, businessNote: e.target.value })}
                    placeholder="Lưu ý bổ sung cho các module khác... Không để tham số biến động như 60/90 ngày nếu thuộc Rule/Metric."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-1 focus:ring-matcha-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'TAB_03' && (
              /* TAB 03: Relationship & Usage */
              <div className="space-y-6 text-xs">
                {/* Related Terms */}
                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50">
                  <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-matcha-700" />
                    Thuật ngữ liên quan (Related Terms)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.relatedTerms && formData.relatedTerms.length > 0 ? (
                      formData.relatedTerms.map((rt) => (
                        <span
                          key={rt}
                          className="px-2.5 py-1 bg-white border border-matcha-300 text-matcha-900 rounded-lg font-mono font-semibold"
                        >
                          {rt}
                        </span>
                      ))
                    ) : (
                      <span className="text-stone-500 italic">Chưa liên kết thuật ngữ nào.</span>
                    )}
                  </div>
                </div>

                {/* Downstream Usage Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Used by Data Dictionary */}
                  <div className="border border-stone-200 rounded-xl p-4 bg-white shadow-2xs">
                    <div className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-matcha-500" />
                      Được dùng bởi Data Dictionary
                    </div>
                    <p className="text-[11px] text-stone-500 mb-3">
                      Các Data Element đang tham chiếu/đồng nghĩa với thuật ngữ này.
                    </p>
                    <div className="space-y-1.5">
                      {formData.usedByDataDictionary && formData.usedByDataDictionary.length > 0 ? (
                        formData.usedByDataDictionary.map((item) => (
                          <div
                            key={item}
                            className="px-2 py-1 bg-matcha-50 border border-matcha-200 rounded text-matcha-900 font-mono text-[11px] font-semibold"
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="text-stone-400 italic text-[11px]">Chưa có Data Element liên kết.</div>
                      )}
                    </div>
                  </div>

                  {/* Used by Event Taxonomy */}
                  <div className="border border-stone-200 rounded-xl p-4 bg-white shadow-2xs">
                    <div className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-bronze-500" />
                      Được dùng bởi Event Taxonomy
                    </div>
                    <p className="text-[11px] text-stone-500 mb-3">
                      Các Canonical Events có sử dụng khái niệm này trong payload.
                    </p>
                    <div className="space-y-1.5">
                      {formData.usedByEventTaxonomy && formData.usedByEventTaxonomy.length > 0 ? (
                        formData.usedByEventTaxonomy.map((item) => (
                          <div
                            key={item}
                            className="px-2 py-1 bg-bronze-50 border border-bronze-200 rounded text-bronze-900 font-mono text-[11px] font-semibold"
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="text-stone-400 italic text-[11px]">Chưa có Event liên kết.</div>
                      )}
                    </div>
                  </div>

                  {/* Used by Metric / Rule */}
                  <div className="border border-stone-200 rounded-xl p-4 bg-white shadow-2xs">
                    <div className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-stone-700" />
                      Được dùng bởi Metric / Rule
                    </div>
                    <p className="text-[11px] text-stone-500 mb-3">
                      Quy tắc nghiệp vụ và công thức tính tham chiếu thuật ngữ này.
                    </p>
                    <div className="space-y-1.5">
                      {formData.usedByMetricRule && formData.usedByMetricRule.length > 0 ? (
                        formData.usedByMetricRule.map((item) => (
                          <div
                            key={item}
                            className="px-2 py-1 bg-stone-100 border border-stone-200 rounded text-stone-800 font-mono text-[11px] font-semibold"
                          >
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="text-stone-400 italic text-[11px]">Chưa có Rule/Metric liên kết.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                  <div className="text-stone-600">
                    Tổng số liên kết hạ nguồn (Usage Count):{' '}
                    <strong className="text-stone-900 font-mono font-bold text-sm">
                      {formData.usageCount || 0} đối tượng
                    </strong>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Hệ thống tự động tổng hợp khi có linkage từ các module khác.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
