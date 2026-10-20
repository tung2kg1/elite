import React, { useState } from 'react';
import {
  ShieldCheck,
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
  XCircle,
  AlertCircle,
  Lock,
  Unlock,
  Shield
} from 'lucide-react';
import {
  GatePolicy,
  GateCheckpoint,
  EnterpriseDomain,
  ENTERPRISE_DOMAINS,
  UserRole
} from '../../types';
import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface SuitabilityGateModuleProps {
  policies: GatePolicy[];
  onUpdatePolicies: (policies: GatePolicy[]) => void;
  userRole: UserRole;
  onLoadSampleData?: () => void;
}

export const SuitabilityGateModule: React.FC<SuitabilityGateModuleProps> = ({
  policies,
  onUpdatePolicies,
  userRole,
  onLoadSampleData
}) => {
  const [screen, setScreen] = useState<'LIST' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'TAB_01' | 'TAB_02' | 'TAB_03'>('TAB_01');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<GatePolicy>>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Checkpoint addition state
  const [newCheckName, setNewCheckName] = useState('');
  const [newCheckType, setNewCheckType] = useState<'Hard Gate' | 'Soft Gate'>('Hard Gate');
  const [newCheckCondition, setNewCheckCondition] = useState('');
  const [newCheckFailAction, setNewCheckFailAction] = useState<'Block' | 'Warn' | 'Route to Specialist'>('Block');

  // Simulation test state in Tab 03
  const [simCustomerRisk, setSimCustomerRisk] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Conservative');
  const [simKycStatus, setSimKycStatus] = useState<'Verified' | 'Pending' | 'Rejected'>('Verified');
  const [simAccountNav, setSimAccountNav] = useState<number>(50000000);
  const [simProductRisk, setSimProductRisk] = useState<'Derivatives' | 'Margin' | 'Equities'>('Margin');

  const [simEvaluation, setSimEvaluation] = useState<{
    tested: boolean;
    verdict: 'PASSED' | 'HARD_BLOCKED' | 'SOFT_WARNING';
    checkpointResults: { name: string; type: string; passed: boolean; reason: string }[];
  } | null>(null);

  const handleOpenDetail = (policy: GatePolicy) => {
    setSelectedPolicyId(policy.id);
    setFormData(JSON.parse(JSON.stringify(policy)));
    setActiveTab('TAB_01');
    setSimEvaluation(null);
    setScreen('DETAIL');
  };

  const handleCreateNew = () => {
    const newPolicy: Partial<GatePolicy> = {
      id: `GATE_${Date.now()}`,
      policyCode: '',
      policyName: '',
      domain: 'Trading',
      triggerEvent: 'MARGIN_SUBSCRIPTION_REQUESTED',
      failAction: 'Block',
      status: 'Active',
      checkpoints: []
    };
    setSelectedPolicyId(null);
    setFormData(newPolicy);
    setActiveTab('TAB_01');
    setSimEvaluation(null);
    setScreen('DETAIL');
  };

  const handleValidate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.policyCode?.trim()) errors.policyCode = 'Mã chính sách cổng không được để trống.';
    if (!formData.policyName?.trim()) errors.policyName = 'Tên chính sách không được để trống.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!handleValidate()) return;

    if (selectedPolicyId) {
      const updated = policies.map((p) =>
        p.id === selectedPolicyId ? ({ ...p, ...formData } as GatePolicy) : p
      );
      onUpdatePolicies(updated);
    } else {
      const created = {
        ...formData,
        policyCode: formData.policyCode?.toUpperCase().trim()
      } as GatePolicy;
      onUpdatePolicies([created, ...policies]);
      setSelectedPolicyId(created.id);
    }
    alert('Đã lưu Suitability & Gate Policy thành công.');
  };

  const handleAddCheckpoint = () => {
    if (!newCheckName.trim() || !newCheckCondition.trim()) {
      alert('Vui lòng nhập Tên điểm kiểm tra và Điều kiện kiểm tra.');
      return;
    }

    const currentChecks = formData.checkpoints || [];
    const newCheck: GateCheckpoint = {
      id: `CP_${Date.now()}`,
      order: currentChecks.length + 1,
      checkpointName: newCheckName.trim(),
      gateType: newCheckType,
      conditionRule: newCheckCondition.trim(),
      failAction: newCheckFailAction,
      status: 'Active'
    };

    setFormData({
      ...formData,
      checkpoints: [...currentChecks, newCheck]
    });
    setNewCheckName('');
    setNewCheckCondition('');
  };

  const handleRemoveCheckpoint = (id: string) => {
    setFormData({
      ...formData,
      checkpoints: (formData.checkpoints || []).filter((c: GateCheckpoint) => c.id !== id)
    });
  };

  const handleRunGateSimulation = () => {
    const results = [];
    let hasHardBlock = false;
    let hasWarning = false;

    // Check 1: KYC
    const kycPass = simKycStatus === 'Verified';
    results.push({
      name: 'Kiểm tra trạng thái xác thực eKYC',
      type: 'Hard Gate',
      passed: kycPass,
      reason: kycPass ? 'Khách hàng đã eKYC thành công' : 'Chưa hoàn tất eKYC hợp lệ'
    });
    if (!kycPass) hasHardBlock = true;

    // Check 2: Risk Suitability
    let riskPass = true;
    if (simProductRisk === 'Margin' && simCustomerRisk === 'Conservative') {
      riskPass = false;
    }
    results.push({
      name: 'Kiểm tra độ phù hợp khẩu vị rủi ro (Risk Appetite)',
      type: 'Hard Gate',
      passed: riskPass,
      reason: riskPass
        ? 'Khẩu vị rủi ro phù hợp với sản phẩm'
        : 'Khách hàng nhóm Thận trọng (Conservative) không được phép dùng Margin'
    });
    if (!riskPass) hasHardBlock = true;

    // Check 3: NAV threshold
    const navPass = simAccountNav >= 20000000;
    results.push({
      name: 'Giá trị tài sản ròng tối thiểu (Min NAV >= 20M)',
      type: 'Soft Gate',
      passed: navPass,
      reason: navPass ? 'NAV đáp ứng ngưỡng tối thiểu' : 'NAV hiện tại dưới 20,000,000 VND (Cảnh báo)'
    });
    if (!navPass) hasWarning = true;

    let verdict: 'PASSED' | 'HARD_BLOCKED' | 'SOFT_WARNING' = 'PASSED';
    if (hasHardBlock) verdict = 'HARD_BLOCKED';
    else if (hasWarning) verdict = 'SOFT_WARNING';

    setSimEvaluation({
      tested: true,
      verdict,
      checkpointResults: results
    });
  };

  return (
    <div className="space-y-6">
      {screen === 'LIST' ? (
        /* ======================== VIEW: 01: GATE POLICY LIST ======================== */
        <div className="space-y-5">
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Suitability & Gate Policy / Cổng kiểm soát độ phù hợp & tuân thủ
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Khai báo Chính sách Cổng mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Table or Empty State */}
          {policies.length === 0 ? (
            <EmptyDataState
              icon={Shield}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có chính sách kiểm soát phù hợp nào (Suitability Gate)"
              primaryAction={{
                label: 'Khai báo Chính sách Cổng mới',
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
                      <th className="py-3 px-4">Policy Code</th>
                      <th className="py-3 px-4">Tên chính sách cổng</th>
                      <th className="py-3 px-4">Miền áp dụng</th>
                      <th className="py-3 px-4">Sự kiện kích hoạt (Trigger)</th>
                      <th className="py-3 px-4">Số điểm kiểm soát</th>
                      <th className="py-3 px-4">Hành vi khi không đạt</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {policies.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => handleOpenDetail(p)}
                        className="hover:bg-matcha-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-matcha-900">
                          <DataValue value={p.policyCode} placeholder="Chưa có mã" monospace />
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          <DataValue value={p.policyName} placeholder="Chưa đặt tên" />
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 font-medium">
                            {p.domain || 'Chung'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-600">
                          <DataValue value={p.triggerEvent} placeholder="Không có trigger" monospace />
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-matcha-100 text-matcha-800 font-bold">
                            {p.checkpoints?.length || 0} Checkpoints
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.failAction === 'Block'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.failAction || 'Block'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(
                              p.status || 'Active'
                            )}`}
                          >
                            {getStatusLabel(p.status || 'Active')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(p);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-matcha-700 hover:text-matcha-900 hover:bg-matcha-100 transition-colors"
                          >
                            Xem
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================== VIEW: 02: GATE POLICY DETAIL / DESIGNER ======================== */
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
                  Gate Policy · {formData.policyName || 'Chính sách mới'}
                </h2>
                <div className="text-xs text-stone-500 mt-0.5">
                  Mã: <code className="text-matcha-900 font-mono font-bold">{formData.policyCode}</code> | 
                  Miền: {formData.domain}
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
                  <span>Lưu chính sách</span>
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
              <span>Các điểm kiểm soát (Checkpoints)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-matcha-100 text-matcha-800">
                {formData.checkpoints?.length || 0}
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
              <span>Thử nghiệm & Đánh giá (Test & Evaluation)</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs">
            {activeTab === 'TAB_01' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Mã chính sách cổng*</label>
                  <input
                    type="text"
                    value={formData.policyCode || ''}
                    onChange={(e) => setFormData({ ...formData, policyCode: e.target.value.toUpperCase() })}
                    placeholder="VD: GATE_MARGIN_APPETITE"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-matcha-900"
                  />
                  {formErrors.policyCode && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.policyCode}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Tên chính sách*</label>
                  <input
                    type="text"
                    value={formData.policyName || ''}
                    onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                    placeholder="VD: Kiểm tra độ phù hợp sản phẩm Margin"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  />
                  {formErrors.policyName && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.policyName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Miền áp dụng*</label>
                  <select
                    value={formData.domain || 'Trading'}
                    onChange={(e) =>
                      setFormData({ ...formData, domain: e.target.value as EnterpriseDomain })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-stone-800"
                  >
                    {ENTERPRISE_DOMAINS.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Sự kiện kích hoạt (Trigger Event)*</label>
                  <input
                    type="text"
                    value={formData.triggerEvent || ''}
                    onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value })}
                    placeholder="VD: MARGIN_ORDER_SUBMITTED"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-stone-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Hành vi chung khi không đạt:*</label>
                  <select
                    value={formData.failAction || 'Block'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        failAction: e.target.value as 'Block' | 'Warn' | 'Route to Specialist'
                      })
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-bold text-rose-800"
                  >
                    <option value="Block">Chặn ngay lập tức (Hard Block)</option>
                    <option value="Warn">Cảnh báo và yêu cầu xác nhận rủi ro (Soft Warn)</option>
                    <option value="Route to Specialist">Chuyển chuyên viên tư vấn đầu tư duyệt</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'TAB_02' && (
              <div className="space-y-5 text-xs">
                {/* Add Checkpoint */}
                {(userRole === 'Maker' || userRole === 'Administrator') && (
                  <div className="p-4 bg-matcha-50/60 border border-matcha-200 rounded-xl space-y-3">
                    <div className="font-bold text-matcha-900 text-xs">Thêm Điểm kiểm soát (Checkpoint):</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Tên điểm kiểm soát*"
                        value={newCheckName}
                        onChange={(e) => setNewCheckName(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                      <select
                        value={newCheckType}
                        onChange={(e) => setNewCheckType(e.target.value as 'Hard Gate' | 'Soft Gate')}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded font-bold text-xs"
                      >
                        <option value="Hard Gate">Hard Gate (Chặn bắt buộc)</option>
                        <option value="Soft Gate">Soft Gate (Cảnh báo)</option>
                      </select>
                      <select
                        value={newCheckFailAction}
                        onChange={(e) =>
                          setNewCheckFailAction(e.target.value as 'Block' | 'Warn' | 'Route to Specialist')
                        }
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                      >
                        <option value="Block">Block</option>
                        <option value="Warn">Warn</option>
                        <option value="Route to Specialist">Route to Specialist</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddCheckpoint}
                        className="px-3 py-1.5 bg-matcha-600 hover:bg-matcha-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm Checkpoint</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Quy tắc kiểm tra (VD: CUST_KYC_STATUS == 'VERIFIED' & RISK_APPETITE >= 3)..."
                      value={newCheckCondition}
                      onChange={(e) => setNewCheckCondition(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs font-mono"
                    />
                  </div>
                )}

                {/* Table */}
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <tr>
                        <th className="py-2.5 px-3">Thứ tự</th>
                        <th className="py-2.5 px-3">Tên điểm kiểm soát</th>
                        <th className="py-2.5 px-3">Loại cổng</th>
                        <th className="py-2.5 px-3">Điều kiện logic (BRE Rule)</th>
                        <th className="py-2.5 px-3">Hành vi Fail</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formData.checkpoints && formData.checkpoints.map((cp: GateCheckpoint) => (
                        <tr key={cp.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-mono">{cp.order}</td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">{cp.checkpointName}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cp.gateType === 'Hard Gate'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {cp.gateType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-stone-700">
                            {cp.conditionRule}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-stone-800">{cp.failAction}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-matcha-100 text-matcha-800">
                              {getStatusLabel(cp.status)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {(userRole === 'Maker' || userRole === 'Administrator') && (
                              <button
                                onClick={() => handleRemoveCheckpoint(cp.id)}
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
              /* TAB 03: Test & Evaluation */
              <div className="space-y-6 text-xs max-w-3xl">
                <div className="p-4 bg-matcha-50/70 border border-matcha-300 rounded-xl space-y-1">
                  <div className="font-bold text-matcha-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-matcha-700" />
                    <span>Mô phỏng thẩm định độ phù hợp (Gate Evaluator)</span>
                  </div>
                  <p className="text-stone-600">
                    Kiểm tra các tình huống giả định của khách hàng trước khi hệ thống cho phép đặt lệnh hoặc đề xuất.
                  </p>
                </div>

                <div className="p-5 border border-stone-200 rounded-xl space-y-4 bg-stone-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Khẩu vị rủi ro KH:</label>
                      <select
                        value={simCustomerRisk}
                        onChange={(e) => setSimCustomerRisk(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded font-semibold text-xs"
                      >
                        <option value="Conservative">Conservative (Thận trọng)</option>
                        <option value="Moderate">Moderate (Cân bằng)</option>
                        <option value="Aggressive">Aggressive (Mạo hiểm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Trạng thái eKYC:</label>
                      <select
                        value={simKycStatus}
                        onChange={(e) => setSimKycStatus(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded font-semibold text-xs"
                      >
                        <option value="Verified">Đã xác thực (Verified)</option>
                        <option value="Pending">Chờ bổ sung (Pending)</option>
                        <option value="Rejected">Từ chối (Rejected)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Sản phẩm đăng ký:</label>
                      <select
                        value={simProductRisk}
                        onChange={(e) => setSimProductRisk(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded font-semibold text-xs"
                      >
                        <option value="Margin">Giao dịch Ký quỹ (Margin)</option>
                        <option value="Derivatives">Chứng khoán Phái sinh</option>
                        <option value="Equities">Cổ phiếu thông thường</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">NAV hiện tại (VND):</label>
                      <input
                        type="number"
                        value={simAccountNav}
                        onChange={(e) => setSimAccountNav(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunGateSimulation}
                    className="px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Chạy kiểm tra Suitability Gate</span>
                  </button>
                </div>

                {simEvaluation && (
                  <div className="p-5 border border-stone-200 rounded-xl bg-white shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <div className="text-stone-500 text-[11px]">Kết luận tổng thể (Gate Verdict):</div>
                        <div
                          className={`text-base font-bold flex items-center gap-1.5 ${
                            simEvaluation.verdict === 'PASSED'
                              ? 'text-matcha-800'
                              : simEvaluation.verdict === 'SOFT_WARNING'
                              ? 'text-amber-800'
                              : 'text-rose-800'
                          }`}
                        >
                          {simEvaluation.verdict === 'PASSED' && <Check className="w-5 h-5 text-matcha-600" />}
                          {simEvaluation.verdict === 'SOFT_WARNING' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                          {simEvaluation.verdict === 'HARD_BLOCKED' && <XCircle className="w-5 h-5 text-rose-600" />}
                          <span>
                            {simEvaluation.verdict === 'PASSED'
                              ? 'HỢP LỆ (Passed Gate - Cho phép thực hiện)'
                              : simEvaluation.verdict === 'SOFT_WARNING'
                              ? 'CẢNH BÁO (Soft Warning - Cần xác nhận rủi ro)'
                              : 'CHẶN RỦI RO (Hard Block - Không đủ điều kiện)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-semibold text-stone-700">Chi tiết từng điểm kiểm soát:</div>
                      {simEvaluation.checkpointResults.map((cp, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-stone-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-stone-900">{cp.name}</div>
                            <div className="text-[11px] text-stone-500">{cp.reason}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                              {cp.type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                cp.passed ? 'bg-matcha-100 text-matcha-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {cp.passed ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
