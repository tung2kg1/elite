import React, { useState } from 'react';
import {
  GitCommit,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Save,
  Check,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Eye,
  Trash2,
  Play,
  ArrowRight,
  Shield,
  HelpCircle,
  Network,
  Activity
} from 'lucide-react';
import {
  LifecycleModel,
  LifecycleStateItem,
  LifecycleTransition,
  UserRole
} from '../../types';
import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface StateLifecycleModuleProps {
  lifecycleModels: LifecycleModel[];
  onUpdateModels: (models: LifecycleModel[]) => void;
  userRole: UserRole;
  onLoadSampleData?: () => void;
}

const VOCAB_STAGES = [
  'Tiềm năng (Prospect)',
  'Mới (New/Onboarding)',
  'Đang hoạt động (Active)',
  'Suy giảm (Dormant)',
  'Rời bỏ (Churned)',
  'Đóng quan hệ (Closed)'
];

export const StateLifecycleModule: React.FC<StateLifecycleModuleProps> = ({
  lifecycleModels,
  onUpdateModels,
  userRole,
  onLoadSampleData
}) => {
  // Screens: 'LIST' , 'DESIGNER' , 'SIMULATION_FLOW' 
  const [screen, setScreen] = useState<'LIST' | 'DESIGNER' | 'SIMULATION_FLOW'>('LIST');
  const [activeTab, setActiveTab] = useState<'TAB_01' | 'TAB_02' | 'TAB_03' | 'TAB_04'>('TAB_01');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<LifecycleModel>>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Simulation test state in Tab 04
  const [simCurrentState, setSimCurrentState] = useState<string>('LEAD');
  const [simContextDaysInactive, setSimContextDaysInactive] = useState<number>(95);
  const [simContextTradingVol, setSimContextTradingVol] = useState<number>(0);
  const [simResult, setSimResult] = useState<{
    evaluated: boolean;
    ruleMatched: string | null;
    nextState: string | null;
    actionRequired: string | null;
  } | null>(null);

  // New state form state
  const [newStateCode, setNewStateCode] = useState('');
  const [newStateName, setNewStateName] = useState('');
  const [newStateStage, setNewStateStage] = useState(VOCAB_STAGES[0]);

  // New transition form state
  const [transFrom, setTransFrom] = useState('');
  const [transTo, setTransTo] = useState('');
  const [transRule, setTransRule] = useState('');
  const [transOverride, setTransOverride] = useState<'Not Allowed' | 'Allowed with Checker' | 'Admin Only'>('Allowed with Checker');

  const handleOpenDesigner = (model: LifecycleModel) => {
    setSelectedModelId(model.id);
    setFormData(JSON.parse(JSON.stringify(model)));
    setActiveTab('TAB_01');
    setSimResult(null);
    setScreen('DESIGNER');
  };

  const handleOpenFlow = (model: LifecycleModel) => {
    setSelectedModelId(model.id);
    setFormData(JSON.parse(JSON.stringify(model)));
    setScreen('SIMULATION_FLOW');
  };

  const handleCreateNew = () => {
    const newModel: Partial<LifecycleModel> = {
      id: `LC_${Date.now()}`,
      modelCode: '',
      modelName: '',
      customerType: 'Individual',
      businessDescription: '',
      status: 'Active',
      effectiveFrom: new Date().toISOString().split('T')[0],
      states: [
        {
          stateCode: 'LEAD',
          stateName: 'Khách hàng tiềm năng',
          stage: 'Tiềm năng (Prospect)',
          order: 1,
          isInitial: true,
          isTerminal: false,
          status: 'Active'
        }
      ],
      transitions: []
    };
    setSelectedModelId(null);
    setFormData(newModel);
    setActiveTab('TAB_01');
    setScreen('DESIGNER');
  };

  const handleValidate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.modelCode?.trim()) errors.modelCode = 'Mã mô hình không được để trống.';
    if (!formData.modelName?.trim()) errors.modelName = 'Tên mô hình không được để trống.';

    // Check states: exactly 1 initial state
    const initials = (formData.states || []).filter((s: LifecycleStateItem) => s.isInitial);
    if (initials.length !== 1) {
      errors.states = 'Mô hình vòng đời bắt buộc phải có đúng 1 Trạng thái khởi tạo (Initial State).';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!handleValidate()) return;

    if (selectedModelId) {
      const updated = lifecycleModels.map((m) =>
        m.id === selectedModelId ? ({ ...m, ...formData } as LifecycleModel) : m
      );
      onUpdateModels(updated);
    } else {
      const created = {
        ...formData,
        modelCode: formData.modelCode?.toUpperCase().trim()
      } as LifecycleModel;
      onUpdateModels([created, ...lifecycleModels]);
      setSelectedModelId(created.id);
    }
    alert('Đã lưu mô hình Lifecycle thành công.');
  };

  const handleAddState = () => {
    if (!newStateCode.trim() || !newStateName.trim()) {
      alert('Vui lòng nhập Mã và Tên trạng thái.');
      return;
    }

    const currentStates = formData.states || [];
    if (currentStates.some((s: LifecycleStateItem) => s.stateCode.toUpperCase() === newStateCode.toUpperCase())) {
      alert('Mã trạng thái đã tồn tại trong mô hình này.');
      return;
    }

    const newState: LifecycleStateItem = {
      stateCode: newStateCode.toUpperCase().trim(),
      stateName: newStateName.trim(),
      stage: newStateStage,
      order: currentStates.length + 1,
      isInitial: false,
      isTerminal: false,
      status: 'Active'
    };

    setFormData({
      ...formData,
      states: [...currentStates, newState]
    });
    setNewStateCode('');
    setNewStateName('');
  };

  const handleAddTransition = () => {
    if (!transFrom || !transTo || !transRule.trim()) {
      alert('Vui lòng chọn Trạng thái nguồn, đích và nhập Điều kiện / Quy tắc.');
      return;
    }

    const currentTrans = formData.transitions || [];
    const newTrans: LifecycleTransition = {
      id: `TR_${Date.now()}`,
      fromState: transFrom,
      toState: transTo,
      transitionRule: transRule.trim(),
      priority: currentTrans.length + 1,
      manualOverridePolicy: transOverride,
      status: 'Active'
    };

    setFormData({
      ...formData,
      transitions: [...currentTrans, newTrans]
    });
    setTransRule('');
  };

  const handleRunSimulation = () => {
    // Evaluate transition based on simCurrentState and context
    let matchedRule = null;
    let nextState = null;
    let actionRequired = null;

    if (simCurrentState === 'ACTIVE' && simContextDaysInactive >= 90) {
      matchedRule = 'RULE_DORMANT_TRIGGER (Không phát sinh giao dịch >= 90 ngày)';
      nextState = 'DORMANT';
      actionRequired = 'Chuyển sang nhóm Cần chăm sóc kích hoạt lại; gửi tín hiệu sang NBA';
    } else if (simCurrentState === 'DORMANT' && simContextTradingVol > 0) {
      matchedRule = 'RULE_REACTIVATION (Có khớp lệnh mới)';
      nextState = 'ACTIVE';
      actionRequired = 'Tái kích hoạt quan hệ giao dịch thành công';
    } else if (simCurrentState === 'LEAD') {
      matchedRule = 'RULE_ONBOARDING_COMPLETED (Hoàn tất eKYC & Ký hợp đồng)';
      nextState = 'NEW_ONBOARDED';
      actionRequired = 'Kích hoạt tài khoản chứng khoán';
    } else {
      matchedRule = 'Không thỏa mãn điều kiện chuyển đổi nào. Giữ nguyên trạng thái.';
      nextState = simCurrentState;
      actionRequired = 'Duy trì trạng thái hiện tại';
    }

    setSimResult({
      evaluated: true,
      ruleMatched: matchedRule,
      nextState,
      actionRequired
    });
  };

  return (
    <div className="space-y-6">
      {screen === 'LIST' && (
        /* ======================== VIEW: 01: LIFECYCLE MODEL LIST ======================== */
        <div className="space-y-5">
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Customer State & Lifecycle / Mô hình trạng thái & vòng đời khách hàng
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo mô hình mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Table or Empty State */}
          {lifecycleModels.length === 0 ? (
            <EmptyDataState
              icon={Activity}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có mô hình trạng thái & vòng đời nào (Customer Lifecycle)"
              primaryAction={{
                label: 'Tạo mô hình mới',
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
                      <th className="py-3 px-4">Model Code</th>
                      <th className="py-3 px-4">Tên mô hình</th>
                      <th className="py-3 px-4">Loại khách hàng</th>
                      <th className="py-3 px-4">Số trạng thái</th>
                      <th className="py-3 px-4">Số quy tắc chuyển</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Ngày hiệu lực</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {lifecycleModels.map((m) => (
                      <tr key={m.id} className="hover:bg-matcha-50/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-matcha-900">
                          <DataValue value={m.modelCode} placeholder="Chưa có mã" monospace />
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          <DataValue value={m.modelName} placeholder="Chưa đặt tên" />
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 font-medium">
                            {m.customerType || 'Tất cả'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-matcha-100 text-matcha-800 font-bold">
                            {m.states?.length || 0} States
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-bronze-100 text-bronze-800 font-bold">
                            {m.transitions?.length || 0} Transitions
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(
                              m.status || 'Active'
                            )}`}
                          >
                            {getStatusLabel(m.status || 'Active')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-500">
                          <DataValue value={m.effectiveFrom} placeholder="Chưa hiệu lực" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDesigner(m)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-matcha-50 text-matcha-800 border border-matcha-200 hover:bg-matcha-100 transition-colors"
                            >
                              Thiết kế
                            </button>
                            <button
                              onClick={() => handleOpenFlow(m)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-bronze-50 text-bronze-800 border border-bronze-200 hover:bg-bronze-100 transition-colors flex items-center gap-1"
                            >
                              <Network className="w-3 h-3" />
                              <span>Mô phỏng Flow</span>
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
        /* ======================== VIEW: 02: LIFECYCLE MODEL DESIGNER ======================== */
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
                  Lifecycle Designer · {formData.modelName}
                </h2>
                <div className="text-xs text-stone-500 mt-0.5">
                  Mã: <code className="text-matcha-900 font-mono font-bold">{formData.modelCode}</code> | 
                  Khách hàng: {formData.customerType}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenFlow(formData as LifecycleModel)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bronze-50 border border-bronze-200 text-bronze-800 rounded-lg text-xs font-bold hover:bg-bronze-100 transition-colors"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Xem sơ đồ chuyển đổi</span>
              </button>
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu mô hình</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Tabs */}
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
              <span>Khai báo trạng thái (State Structure)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-matcha-100 text-matcha-800">
                {formData.states?.length || 0}
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
              <span>Quy tắc chuyển trạng thái (Transition Mapping)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bronze-100 text-bronze-800">
                {formData.transitions?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('TAB_04')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'TAB_04'
                  ? 'border-matcha-600 text-matcha-800'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="font-mono text-[10px] bg-matcha-100 text-matcha-800 px-1.5 py-0.5 rounded">
                TAB 04
              </span>
              <span>Mô phỏng quy tắc (Simulation & Test)</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs">
            {activeTab === 'TAB_01' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Mã mô hình (Model Code)*</label>
                  <input
                    type="text"
                    value={formData.modelCode || ''}
                    onChange={(e) => setFormData({ ...formData, modelCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-matcha-900"
                  />
                  {formErrors.modelCode && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.modelCode}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Tên mô hình*</label>
                  <input
                    type="text"
                    value={formData.modelName || ''}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  />
                  {formErrors.modelName && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.modelName}</p>
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
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  />
                </div>
              </div>
            )}

            {activeTab === 'TAB_02' && (
              <div className="space-y-5 text-xs">
                {formErrors.states && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.states}</span>
                  </div>
                )}

                {/* Add State Row */}
                {(userRole === 'Maker' || userRole === 'Administrator') && (
                  <div className="p-4 bg-matcha-50/60 border border-matcha-200 rounded-xl space-y-3">
                    <div className="font-bold text-matcha-900 text-xs">Thêm trạng thái mới vào mô hình:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Mã trạng thái (VD: DORMANT)*"
                        value={newStateCode}
                        onChange={(e) => setNewStateCode(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded font-mono text-xs focus:ring-1 focus:ring-matcha-500"
                      />
                      <input
                        type="text"
                        placeholder="Tên trạng thái*"
                        value={newStateName}
                        onChange={(e) => setNewStateName(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs focus:ring-1 focus:ring-matcha-500"
                      />
                      <select
                        value={newStateStage}
                        onChange={(e) => setNewStateStage(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs focus:ring-1 focus:ring-matcha-500"
                      >
                        {VOCAB_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddState}
                        className="px-3 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm trạng thái</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* States Table */}
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <tr>
                        <th className="py-2.5 px-3">Thứ tự</th>
                        <th className="py-2.5 px-3">Mã trạng thái</th>
                        <th className="py-2.5 px-3">Tên trạng thái</th>
                        <th className="py-2.5 px-3">Giai đoạn (Vocabulary)</th>
                        <th className="py-2.5 px-3">Khởi tạo (Initial)</th>
                        <th className="py-2.5 px-3">Kết thúc (Terminal)</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formData.states && formData.states.map((st: LifecycleStateItem) => (
                        <tr key={st.stateCode} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-mono">{st.order}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">{st.stateCode}</td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">{st.stateName}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 font-medium">
                              {st.stage}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="radio"
                              name="initialRadio"
                              checked={st.isInitial}
                              onChange={() => {
                                const updated = formData.states?.map((s: LifecycleStateItem) => ({
                                  ...s,
                                  isInitial: s.stateCode === st.stateCode
                                }));
                                setFormData({ ...formData, states: updated });
                              }}
                              className="text-matcha-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={st.isTerminal}
                              onChange={(e) => {
                                const updated = formData.states?.map((s: LifecycleStateItem) =>
                                  s.stateCode === st.stateCode ? { ...s, isTerminal: e.target.checked } : s
                                );
                                setFormData({ ...formData, states: updated });
                              }}
                              className="text-matcha-600 rounded"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-matcha-100 text-matcha-800">
                              {getStatusLabel(st.status)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {(userRole === 'Maker' || userRole === 'Administrator') && (
                              <button
                                onClick={() => {
                                  const updated = formData.states?.filter((s: LifecycleStateItem) => s.stateCode !== st.stateCode);
                                  setFormData({ ...formData, states: updated });
                                }}
                                className="p-1 text-stone-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'TAB_03' && (
              <div className="space-y-5 text-xs">
                {/* Add Transition Form */}
                {(userRole === 'Maker' || userRole === 'Administrator') && (
                  <div className="p-4 bg-bronze-50/60 border border-bronze-200 rounded-xl space-y-3">
                    <div className="font-bold text-bronze-900 text-xs">Thêm quy tắc chuyển trạng thái:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-stone-500 mb-1">Từ trạng thái:*</label>
                        <select
                          value={transFrom}
                          onChange={(e) => setTransFrom(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded font-mono text-xs"
                        >
                          <option value="">-- Chọn trạng thái nguồn --</option>
                          {formData.states?.map((s: LifecycleStateItem) => (
                            <option key={s.stateCode} value={s.stateCode}>
                              {s.stateCode} ({s.stateName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-stone-500 mb-1">Sang trạng thái:*</label>
                        <select
                          value={transTo}
                          onChange={(e) => setTransTo(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded font-mono text-xs"
                        >
                          <option value="">-- Chọn trạng thái đích --</option>
                          {formData.states?.map((s: LifecycleStateItem) => (
                            <option key={s.stateCode} value={s.stateCode}>
                              {s.stateCode} ({s.stateName})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-stone-500 mb-1">Chính sách can thiệp tay:*</label>
                        <select
                          value={transOverride}
                          onChange={(e) =>
                            setTransOverride(e.target.value as 'Not Allowed' | 'Allowed with Checker' | 'Admin Only')
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                        >
                          <option value="Not Allowed">Không cho phép (Not Allowed)</option>
                          <option value="Allowed with Checker">Cho phép qua phê duyệt Maker-Checker</option>
                          <option value="Admin Only">Chỉ Admin / Compliance</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddTransition}
                          className="w-full px-3 py-1.5 bg-bronze-600 hover:bg-bronze-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm Transition</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">
                        Tên quy tắc / Điều kiện kích hoạt chuyển đổi (BRE Rule):*
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Không phát sinh giao dịch >= 90 ngày liên tiếp..."
                        value={transRule}
                        onChange={(e) => setTransRule(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Transitions Table */}
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <tr>
                        <th className="py-2.5 px-3">Ưu tiên</th>
                        <th className="py-2.5 px-3">Từ trạng thái</th>
                        <th className="py-2.5 px-3">Sang trạng thái</th>
                        <th className="py-2.5 px-3">Điều kiện chuyển (Rule)</th>
                        <th className="py-2.5 px-3">Can thiệp thủ công (Manual Override)</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formData.transitions && formData.transitions.map((tr: LifecycleTransition) => (
                        <tr key={tr.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-mono font-bold">{tr.priority}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-800">{tr.fromState}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">{tr.toState}</td>
                          <td className="py-2.5 px-3 text-stone-700">{tr.transitionRule}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 font-medium">
                              {tr.manualOverridePolicy}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-matcha-100 text-matcha-800">
                              {getStatusLabel(tr.status)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {(userRole === 'Maker' || userRole === 'Administrator') && (
                              <button
                                onClick={() => {
                                  const updated = formData.transitions?.filter((t: LifecycleTransition) => t.id !== tr.id);
                                  setFormData({ ...formData, transitions: updated });
                                }}
                                className="p-1 text-stone-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'TAB_04' && (
              /* TAB 04: Simulation & Test */
              <div className="space-y-6 text-xs max-w-3xl">
                <div className="p-4 bg-matcha-50/70 border border-matcha-300 rounded-xl space-y-1">
                  <div className="font-bold text-matcha-900 flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-matcha-700" />
                    <span>Mô phỏng máy trạng thái (Transition Evaluator)</span>
                  </div>
                  <p className="text-stone-600">
                    Thử nghiệm nạp ngữ cảnh khách hàng mẫu để kiểm tra xem hệ thống sẽ chuyển sang trạng thái nào và kích hoạt hành động gì.
                  </p>
                </div>

                <div className="p-5 border border-stone-200 rounded-xl space-y-4 bg-stone-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Trạng thái hiện tại:</label>
                      <select
                        value={simCurrentState}
                        onChange={(e) => setSimCurrentState(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono font-bold text-matcha-900"
                      >
                        {formData.states?.map((s: LifecycleStateItem) => (
                          <option key={s.stateCode} value={s.stateCode}>
                            {s.stateCode} ({s.stateName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Số ngày không phát sinh GD:</label>
                      <input
                        type="number"
                        value={simContextDaysInactive}
                        onChange={(e) => setSimContextDaysInactive(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Giá trị GD trong kỳ (VND):</label>
                      <input
                        type="number"
                        value={simContextTradingVol}
                        onChange={(e) => setSimContextTradingVol(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-stone-800 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunSimulation}
                    className="px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Chạy đánh giá chuyển trạng thái</span>
                  </button>
                </div>

                {simResult && (
                  <div className="p-5 border border-matcha-300 rounded-xl bg-matcha-50/50 space-y-3">
                    <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <Check className="w-4 h-4 text-matcha-700" />
                      <span>Kết quả đánh giá máy trạng thái:</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white border border-matcha-200 rounded-lg">
                        <span className="text-stone-500 block text-[11px]">Trạng thái tiếp theo (Next State):</span>
                        <span className="text-base font-bold font-mono text-matcha-900">
                          {simResult.nextState}
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-matcha-200 rounded-lg">
                        <span className="text-stone-500 block text-[11px]">Quy tắc khớp (Matched Rule):</span>
                        <span className="font-semibold text-stone-800">{simResult.ruleMatched}</span>
                      </div>
                    </div>

                    <div className="text-xs text-stone-600 bg-white p-3 border border-stone-200 rounded-lg">
                      <strong>Hành động tiếp theo:</strong> {simResult.actionRequired}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {screen === 'SIMULATION_FLOW' && (
        /* ======================== VIEW: 03: LIFECYCLE SIMULATION FLOW ======================== */
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
                  Sơ đồ mạng lưới chuyển trạng thái (State Transition Machine)
                </h2>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-xs space-y-8">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {formData.states?.map((st: LifecycleStateItem, idx: number, arr: LifecycleStateItem[]) => (
                <div key={st.stateCode} className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-2xl border-2 w-48 shadow-xs space-y-2 text-center transition-all ${
                      st.isInitial
                        ? 'border-matcha-500 bg-matcha-50/60'
                        : st.isTerminal
                        ? 'border-stone-400 bg-stone-100'
                        : 'border-matcha-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                      <span>Step {st.order}</span>
                      {st.isInitial && (
                        <span className="px-1.5 py-0.5 rounded bg-matcha-600 text-white font-bold">Initial</span>
                      )}
                      {st.isTerminal && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-600 text-white font-bold">Terminal</span>
                      )}
                    </div>
                    <div className="font-mono font-bold text-sm text-matcha-900">{st.stateCode}</div>
                    <div className="text-xs font-semibold text-stone-800">{st.stateName}</div>
                    <div className="text-[10px] text-stone-500 bg-stone-50 py-0.5 px-2 rounded-full border border-stone-200 inline-block">
                      {st.stage}
                    </div>
                  </div>

                  {idx !== arr.length - 1 && (
                    <div className="flex flex-col items-center text-matcha-700">
                      <ArrowRight className="w-6 h-6 animate-pulse" />
                      <span className="text-[10px] font-mono text-stone-500 mt-0.5">Transition</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Transition Rules Matrix Summary */}
            <div className="pt-6 border-t border-stone-200 space-y-3">
              <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                Ma trận các đường chuyển đổi hợp lệ ({formData.transitions?.length || 0}):
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.transitions?.map((tr: LifecycleTransition) => (
                  <div
                    key={tr.id}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono font-bold">
                        <span className="text-stone-700">{tr.fromState}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-bronze-600" />
                        <span className="text-matcha-900">{tr.toState}</span>
                      </div>
                      <div className="text-[11px] text-stone-600">{tr.transitionRule}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-stone-200 rounded text-stone-600">
                      {tr.manualOverridePolicy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
