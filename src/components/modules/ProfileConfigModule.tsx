import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Eye,
  Settings,
  Layers,
  Sparkles,
  ArrowLeft,
  Save,
  Check,
  AlertTriangle,
  Info,
  ChevronRight,
  Shield,
  Trash2,
  Sliders,
  Filter
} from 'lucide-react';
import { ProfileConfig, ProfileSection, ProfileExtension, DataElement, UserRole } from '../../types';
import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface ProfileConfigModuleProps {
  profiles: ProfileConfig[];
  onUpdateProfiles: (profiles: ProfileConfig[]) => void;
  dataElements: DataElement[];
  userRole: UserRole;
  onLoadSampleData?: () => void;
}

export const ProfileConfigModule: React.FC<ProfileConfigModuleProps> = ({
  profiles,
  onUpdateProfiles,
  dataElements,
  userRole,
  onLoadSampleData
}) => {
  // Screen: 'OVERVIEW' (Screen 01), 'DESIGNER' (Screen 02 & 03), 'PREVIEW' (Screen 04)
  const [screen, setScreen] = useState<'OVERVIEW' | 'DESIGNER' | 'PREVIEW'>('OVERVIEW');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(profiles[0]?.id || '');
  const [designerTab, setDesignerTab] = useState<'BASE' | 'EXTENSIONS'>('BASE');

  // Preview Context Simulation State (Screen 04)
  const [previewContext, setPreviewContext] = useState<'ALL' | 'IND' | 'ORG' | 'VIP'>('IND');

  // Editing profile
  const [formData, setFormData] = useState<ProfileConfig>(profiles[0] || ({} as ProfileConfig));

  React.useEffect(() => {
    if ((!formData || !formData.id) && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id);
      setFormData(profiles[0]);
    }
  }, [profiles]);

  const handleOpenDesigner = (prof: ProfileConfig) => {
    setSelectedProfileId(prof.id);
    setFormData(JSON.parse(JSON.stringify(prof)));
    setScreen('DESIGNER');
  };

  const handleOpenPreview = (prof: ProfileConfig) => {
    setSelectedProfileId(prof.id);
    setFormData(JSON.parse(JSON.stringify(prof)));
    setScreen('PREVIEW');
  };

  const handleSave = () => {
    const updated = profiles.map((p) => (p.id === formData.id ? formData : p));
    onUpdateProfiles(updated);
    alert('Đã cập nhật cấu hình Profile thành công.');
  };

  // Add Section to Base
  const handleAddBaseSection = () => {
    const newSec: ProfileSection = {
      id: `SEC_${Date.now()}`,
      sectionCode: `SECTION_${formData.baseSections.length + 1}`,
      sectionName: 'Phân khu mới',
      displayOrder: formData.baseSections.length + 1,
      visible: true,
      elements: []
    };
    setFormData({
      ...formData,
      baseSections: [...formData.baseSections, newSec]
    });
  };

  // Add Element to a Section
  const handleAddElementToSection = (secId: string, dataCode: string) => {
    if (!dataCode) return;
    const foundEl = dataElements.find((d) => d.dataCode === dataCode);
    const updatedSections = formData.baseSections.map((sec) => {
      if (sec.id === secId) {
        if (sec.elements.some((e) => e.dataElementCode === dataCode)) {
          alert('Data Element này đã tồn tại trong Section.');
          return sec;
        }
        return {
          ...sec,
          elements: [
            ...sec.elements,
            {
              id: `EL_${Date.now()}`,
              dataElementCode: dataCode,
              displayLabel: foundEl?.dataName || dataCode,
              elementOrder: sec.elements.length + 1
            }
          ]
        };
      }
      return sec;
    });

    setFormData({ ...formData, baseSections: updatedSections });
  };

  const handleRemoveElement = (secId: string, elId: string) => {
    const updatedSections = formData.baseSections.map((sec) => {
      if (sec.id === secId) {
        return {
          ...sec,
          elements: sec.elements.filter((e) => e.id !== elId)
        };
      }
      return sec;
    });
    setFormData({ ...formData, baseSections: updatedSections });
  };

  // Resolved structure simulation for Screen 04 Preview
  const getResolvedStructure = () => {
    let resolvedSections: ProfileSection[] = JSON.parse(JSON.stringify(formData.baseSections || []));

    // Find extensions matching context
    const matchingExtensions = (formData.extensions || []).filter((ext) => {
      if (previewContext === 'IND' && ext.applyValues.includes('IND')) return true;
      if (previewContext === 'ORG' && ext.applyValues.includes('ORG')) return true;
      if (previewContext === 'VIP' && (ext.applyValues.includes('DIAMOND') || ext.applyValues.includes('PLATINUM'))) return true;
      return false;
    });

    matchingExtensions.forEach((ext) => {
      // 1. Add extra sections if any
      if (ext.actions.addSections) {
        resolvedSections.push(...ext.actions.addSections);
      }
      // 2. Add extra elements to existing sections
      if (ext.actions.addElements) {
        ext.actions.addElements.forEach((addEl) => {
          const targetSec = resolvedSections.find((s) => s.sectionCode === addEl.sectionCode);
          if (targetSec && !targetSec.elements.some((e) => e.dataElementCode === addEl.element.dataElementCode)) {
            targetSec.elements.push(addEl.element);
          }
        });
      }
      // 3. Hide sections
      if (ext.actions.hideSections) {
        resolvedSections = resolvedSections.filter((s) => !ext.actions.hideSections?.includes(s.sectionCode));
      }
    });

    return resolvedSections;
  };

  return (
    <div className="space-y-6">
      {screen === 'OVERVIEW' && (
        /* ======================== SCREEN 01: PROFILE OVERVIEW ======================== */
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-matcha-800 bg-matcha-100 px-2 py-0.5 rounded border border-matcha-300">
                  SCREEN 01
                </span>
                <h2 className="text-xl font-bold text-stone-900">
                  Profile Configuration / Cấu hình hồ sơ khách hàng 360
                </h2>
              </div>
            </div>
          </div>

          {/* 4 Profiles Table or Empty State */}
          {profiles.length === 0 ? (
            <EmptyDataState
              icon={UserCheck}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có cấu hình hồ sơ khách hàng 360 nào"
            />
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-4">Profile Code</th>
                      <th className="py-3 px-4">Tên hồ sơ (Profile Name)</th>
                      <th className="py-3 px-4">Loại hồ sơ (Profile Type)</th>
                      <th className="py-3 px-4">Tóm tắt Extension (Extension Summary)</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Phiên bản</th>
                      <th className="py-3 px-4">Cập nhật lần cuối</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {profiles.map((prof) => {
                      const extSummary =
                        prof.extensions && prof.extensions.length > 0
                          ? `Base + ${prof.extensions.map((e) => e.extensionName.split(' ')[0]).join(' + ')}`
                          : 'Base';

                      return (
                        <tr key={prof.id} className="hover:bg-matcha-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-matcha-900">
                            <DataValue value={prof.profileCode} placeholder="Chưa có mã" monospace />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-stone-900">
                              <DataValue value={prof.profileName} placeholder="Chưa đặt tên" />
                            </div>
                            <div className="text-[11px] text-stone-500 truncate max-w-xs">
                              <DataValue value={prof.description} placeholder="Chưa có mô tả" />
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-matcha-100/80 text-matcha-900 border border-matcha-200">
                              {prof.profileType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-1 bg-stone-100 border border-stone-200 rounded text-stone-800 font-mono text-[11px] font-medium">
                              {extSummary}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(
                                prof.status || 'Active'
                              )}`}
                            >
                              {getStatusLabel(prof.status || 'Active')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-stone-600">{prof.version || 'v1.0'}</td>
                          <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                            {prof.lastUpdated || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenDesigner(prof)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-matcha-50 text-matcha-800 border border-matcha-200 hover:bg-matcha-100 transition-colors"
                                title="Mở màn hình thiết kế cấu trúc Profile"
                              >
                                Thiết kế
                              </button>
                              <button
                                onClick={() => handleOpenPreview(prof)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-bronze-50 text-bronze-800 border border-bronze-200 hover:bg-bronze-100 transition-colors"
                                title="Xem trước giao diện mô phỏng (Screen 04)"
                              >
                                Xem trước
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === 'DESIGNER' && (
        /* ======================== SCREEN 02 & 03: PROFILE DESIGNER ======================== */
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen('OVERVIEW')}
                className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-matcha-800 bg-matcha-100 px-2 py-0.5 rounded border border-matcha-300">
                    SCREEN 03
                  </span>
                  <h2 className="text-xl font-bold text-stone-900">
                    Profile Designer · {formData.profileName}
                  </h2>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  Mã: <code className="text-matcha-900 font-mono font-bold">{formData.profileCode}</code> | 
                  Phiên bản: <span className="font-mono">{formData.version}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenPreview(formData)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bronze-50 border border-bronze-200 text-bronze-800 rounded-lg text-xs font-bold hover:bg-bronze-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trước kết quả (Screen 04)</span>
              </button>
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thiết kế</span>
                </button>
              )}
            </div>
          </div>

          {/* Designer Tab selector: Base Configuration vs Extensions */}
          <div className="flex border-b border-matcha-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 shadow-2xs">
            <button
              onClick={() => setDesignerTab('BASE')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                designerTab === 'BASE'
                  ? 'border-matcha-600 text-matcha-800'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Base Configuration / Cấu hình dùng chung ({formData.baseSections?.length || 0} Phân khu)</span>
            </button>

            <button
              onClick={() => setDesignerTab('EXTENSIONS')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                designerTab === 'EXTENSIONS'
                  ? 'border-matcha-600 text-matcha-800'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-bronze-600" />
              <span>Extensions Configuration / Cấu hình mở rộng ({formData.extensions?.length || 0} Extension)</span>
            </button>
          </div>

          {/* Designer Content */}
          <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs space-y-6">
            {designerTab === 'BASE' && (
              /* BASE CONFIGURATION VIEW */
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-stone-600">
                    Khai báo các Phân khu (Section) và trường dữ liệu (Data Element) áp dụng mặc định cho toàn bộ hồ sơ.
                  </p>
                  {(userRole === 'Maker' || userRole === 'Administrator') && (
                    <button
                      onClick={handleAddBaseSection}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Phân khu (Section)</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.baseSections && formData.baseSections.map((section, sIdx) => (
                    <div
                      key={section.id}
                      className="border border-stone-200 rounded-xl p-4 bg-stone-50/50 space-y-4 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-matcha-200 text-matcha-800 font-mono font-bold text-xs flex items-center justify-center">
                            {sIdx + 1}
                          </span>
                          <div>
                            <input
                              type="text"
                              value={section.sectionName}
                              onChange={(e) => {
                                const updated = formData.baseSections.map((s) =>
                                  s.id === section.id ? { ...s, sectionName: e.target.value } : s
                                );
                                setFormData({ ...formData, baseSections: updated });
                              }}
                              className="font-bold text-sm text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-matcha-500 focus:outline-none"
                            />
                            <div className="text-[11px] font-mono text-stone-500">
                              Mã section: {section.sectionCode}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={section.visible}
                              onChange={(e) => {
                                const updated = formData.baseSections.map((s) =>
                                  s.id === section.id ? { ...s, visible: e.target.checked } : s
                                );
                                setFormData({ ...formData, baseSections: updated });
                              }}
                              className="w-4 h-4 text-matcha-600 rounded"
                            />
                            <span className="text-stone-700 font-medium">Hiển thị (Visible)</span>
                          </label>

                          {/* Quick Add Element Picker */}
                          <select
                            onChange={(e) => {
                              handleAddElementToSection(section.id, e.target.value);
                              e.target.value = '';
                            }}
                            className="bg-white border border-stone-200 rounded px-2.5 py-1 font-medium text-matcha-900 text-xs focus:ring-1 focus:ring-matcha-500"
                          >
                            <option value="">+ Gắn Data Element...</option>
                            {dataElements.map((d) => (
                              <option key={d.dataCode} value={d.dataCode}>
                                {d.dataCode} ({d.dataName})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Elements List inside Section */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                          Trường dữ liệu trong phân khu ({section.elements.length}):
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {section.elements.map((el) => (
                            <div
                              key={el.id}
                              className="p-2.5 bg-white border border-stone-200 rounded-lg flex items-center justify-between shadow-2xs group"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-mono text-xs font-bold text-matcha-900 truncate">
                                  {el.dataElementCode}
                                </div>
                                <div className="text-[11px] text-stone-600 truncate">
                                  {el.displayLabel || el.dataElementCode}
                                </div>
                              </div>
                              {(userRole === 'Maker' || userRole === 'Administrator') && (
                                <button
                                  onClick={() => handleRemoveElement(section.id, el.id)}
                                  className="text-stone-300 hover:text-rose-600 transition-colors p-1"
                                  title="Gỡ khỏi phân khu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {designerTab === 'EXTENSIONS' && (
              /* EXTENSIONS CONFIGURATION VIEW */
              <div className="space-y-5">
                <div className="p-4 bg-bronze-50/70 border border-bronze-300 rounded-xl text-xs text-stone-700 space-y-1">
                  <div className="font-bold text-bronze-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-bronze-700" />
                    <span>Mô hình Cấu hình Mở rộng (Extension Model)</span>
                  </div>
                  <p>
                    Extension chỉ khai báo phần <strong>khác biệt so với Base</strong> (Add / Hide / Override). 
                    Không sao chép lại toàn bộ Base. Apply By không hard-code mà được chọn linh hoạt từ Data Dictionary (VD: CUSTOMER_TYPE, Segment, VIP Tier...).
                  </p>
                </div>

                <div className="space-y-4">
                  {formData.extensions && formData.extensions.map((ext) => (
                    <div
                      key={ext.id}
                      className="border border-stone-200 rounded-xl p-4 bg-stone-50/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                        <div>
                          <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                            <span>{ext.extensionName}</span>
                            <span className="text-[10px] font-mono bg-bronze-100 text-bronze-800 px-1.5 py-0.5 rounded font-semibold">
                              {ext.extensionCode}
                            </span>
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5">
                            Áp dụng theo: <strong>{ext.applyBy}</strong> ={' '}
                            <span className="font-mono text-matcha-900">{ext.applyValues.join(', ')}</span> | 
                            Độ ưu tiên (Priority): <strong>{ext.priority}</strong>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-stone-500">
                          Hiệu lực từ: {ext.effectiveFrom}
                        </span>
                      </div>

                      {/* Summary of Actions */}
                      <div className="space-y-1.5 text-xs text-stone-700">
                        <div className="font-semibold text-stone-800">Hành động cấu hình (Actions):</div>
                        {ext.actions.addSections && (
                          <div className="pl-3 text-stone-600">
                            • <strong>Bổ sung phân khu (Add Section):</strong>{' '}
                            {ext.actions.addSections.map((s) => s.sectionName).join(', ')}
                          </div>
                        )}
                        {ext.actions.addElements && (
                          <div className="pl-3 text-stone-600">
                            • <strong>Bổ sung trường dữ liệu (Add Element):</strong>{' '}
                            {ext.actions.addElements.map((e) => e.element.dataElementCode).join(', ')}
                          </div>
                        )}
                        {ext.actions.hideSections && (
                          <div className="pl-3 text-stone-600">
                            • <strong>Ẩn phân khu (Hide Section):</strong> {ext.actions.hideSections.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === 'PREVIEW' && (
        /* ======================== SCREEN 04: PREVIEW ======================== */
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScreen('OVERVIEW')}
                className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-matcha-800 bg-matcha-100 px-2 py-0.5 rounded border border-matcha-300">
                    SCREEN 04
                  </span>
                  <h2 className="text-xl font-bold text-stone-900">
                    Profile Structure Simulation / Xem trước cấu trúc kết hợp
                  </h2>
                </div>
              </div>
            </div>

            {/* Simulation Context Switcher */}
            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl">
              <span className="text-xs font-bold text-stone-600 px-2">Mô phỏng Context:</span>
              <button
                onClick={() => setPreviewContext('IND')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewContext === 'IND'
                    ? 'bg-matcha-600 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                Cá nhân (IND)
              </button>
              <button
                onClick={() => setPreviewContext('ORG')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewContext === 'ORG'
                    ? 'bg-matcha-600 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                Tổ chức (ORG)
              </button>
              <button
                onClick={() => setPreviewContext('VIP')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewContext === 'VIP'
                    ? 'bg-bronze-600 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200'
                }`}
              >
                VIP Diamond
              </button>
            </div>
          </div>

          {/* Resolved Structure Display */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="p-3.5 bg-matcha-50/70 border border-matcha-300 rounded-xl flex items-center justify-between text-xs">
              <div className="text-stone-800">
                <strong>Đang áp dụng:</strong> Base Configuration +{' '}
                <span className="font-bold text-matcha-900">
                  {previewContext === 'IND'
                    ? 'Individual Extension (GENDER)'
                    : previewContext === 'ORG'
                    ? 'Organization Extension (Corporate Governance)'
                    : 'VIP Diamond Extension (Private Wealth)'}
                </span>
              </div>
              <span className="text-[11px] text-stone-500 font-mono">No Customer Data (Chỉ render cấu trúc nhãn)</span>
            </div>

            {/* Render Resolved Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {getResolvedStructure().map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className="border border-stone-200 rounded-xl p-4 bg-stone-50/40 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-matcha-200 text-matcha-800 font-mono text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{sec.sectionName}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-stone-400">{sec.sectionCode}</span>
                  </div>

                  <div className="space-y-2">
                    {sec.elements.map((el) => (
                      <div
                        key={el.id}
                        className="p-2.5 bg-white border border-stone-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-stone-800">{el.displayLabel || el.dataElementCode}</span>
                        <span className="font-mono text-[10px] text-matcha-800 bg-matcha-50 px-1.5 py-0.5 rounded border border-matcha-200">
                          {el.dataElementCode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
