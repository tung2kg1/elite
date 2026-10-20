import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Save,
  Check,
  AlertTriangle,
  Info,
  Layers,
  Sliders,
  Play,
  Trash2,
  ExternalLink,
  Smartphone,
  Award,
  Zap,
  Tag,
  Target
} from 'lucide-react';
import {
  NBAStrategy,
  NBAActionItem,
  UserRole
} from '../../types';
import { getStatusBadgeClass, getStatusLabel } from '../../lib/utils';
import { EmptyDataState } from '../common/EmptyDataState';
import { DataValue } from '../common/DataValue';

interface NBAModuleProps {
  strategies: NBAStrategy[];
  onUpdateStrategies: (strategies: NBAStrategy[]) => void;
  userRole: UserRole;
  onLoadSampleData?: () => void;
}

const OBJECTIVES = [
  'Cross-sell (Bán chéo)',
  'Upsell (Nâng hạng)',
  'Retention (Giữ chân)',
  'Education (Kiến thức/Đào tạo)',
  'Advisory (Tư vấn chuyên sâu)'
];

const CHANNELS = [
  'Mobile App Push & In-app Banner',
  'Web Portal Notification',
  'Advisor / Broker CRM Workbench',
  'Automated Email',
  'SMS Gateway'
];

export const NBAModule: React.FC<NBAModuleProps> = ({
  strategies,
  onUpdateStrategies,
  userRole,
  onLoadSampleData
}) => {
  const [screen, setScreen] = useState<'LIST' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'TAB_01' | 'TAB_02' | 'TAB_03' | 'TAB_04'>('TAB_01');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<NBAStrategy>>({});
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Action proposition adding state
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionSegment, setNewActionSegment] = useState('All Customers');
  const [newActionCriteria, setNewActionCriteria] = useState('');
  const [newActionHeadline, setNewActionHeadline] = useState('');
  const [newActionCta, setNewActionCta] = useState('');
  const [newActionWeight, setNewActionWeight] = useState(80);

  // Simulation test state
  const [simSegment, setSimSegment] = useState<'MASS' | 'AFFLUENT' | 'HIGH_NET_WORTH'>('AFFLUENT');
  const [simInterest, setSimInterest] = useState<'Fixed Income' | 'High-Growth Tech Equities' | 'Margin Trading'>('High-Growth Tech Equities');
  const [simNav, setSimNav] = useState<number>(350000000);

  const [simResults, setSimResults] = useState<{
    evaluated: boolean;
    rankedActions: {
      actionId: string;
      title: string;
      finalScore: number;
      propensityScore: number;
      businessValueScore: number;
      contextScore: number;
      headline: string;
      ctaText: string;
      gateCheck: 'Passed' | 'Flagged';
    }[];
  } | null>(null);

  const handleOpenDetail = (st: NBAStrategy) => {
    setSelectedStrategyId(st.id);
    setFormData(JSON.parse(JSON.stringify(st)));
    setActiveTab('TAB_01');
    setSimResults(null);
    setScreen('DETAIL');
  };

  const handleCreateNew = () => {
    const newSt: Partial<NBAStrategy> = {
      id: `NBA_${Date.now()}`,
      strategyCode: '',
      strategyName: '',
      objective: 'Cross-sell (Bán chéo)',
      channel: 'Mobile App Push & In-app Banner',
      rankingModel: 'Multi-Factor Scoring',
      arbitrationWeights: {
        propensityWeight: 40,
        businessValueWeight: 35,
        contextWeight: 25
      },
      status: 'Active',
      actions: []
    };
    setSelectedStrategyId(null);
    setFormData(newSt);
    setActiveTab('TAB_01');
    setSimResults(null);
    setScreen('DETAIL');
  };

  const handleValidate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.strategyCode?.trim()) errors.strategyCode = 'Mã chiến lược không được để trống.';
    if (!formData.strategyName?.trim()) errors.strategyName = 'Tên chiến lược không được để trống.';

    // Check weights sum up to 100
    const w = formData.arbitrationWeights;
    if (w) {
      const sum = (w.propensityWeight || 0) + (w.businessValueWeight || 0) + (w.contextWeight || 0);
      if (sum !== 100) {
        errors.weights = `Tổng trọng số xếp hạng phải đúng bằng 100% (Hiện tại: ${sum}%).`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!handleValidate()) return;

    if (selectedStrategyId) {
      const updated = strategies.map((s) =>
        s.id === selectedStrategyId ? ({ ...s, ...formData } as NBAStrategy) : s
      );
      onUpdateStrategies(updated);
    } else {
      const created = {
        ...formData,
        strategyCode: formData.strategyCode?.toUpperCase().trim()
      } as NBAStrategy;
      onUpdateStrategies([created, ...strategies]);
      setSelectedStrategyId(created.id);
    }
    alert('Đã lưu chiến lược NBA thành công.');
  };

  const handleAddAction = () => {
    if (!newActionTitle.trim() || !newActionHeadline.trim()) {
      alert('Vui lòng nhập Tên hành động và Tiêu đề đề xuất (Headline).');
      return;
    }

    const currentActions = formData.actions || [];
    const newAct: NBAActionItem = {
      actionId: `ACT_${Date.now()}`,
      actionTitle: newActionTitle.trim(),
      targetSegment: newActionSegment,
      eligibilityCriteria: newActionCriteria || 'Không có điều kiện phụ',
      propositionPayload: {
        headline: newActionHeadline.trim(),
        ctaText: newActionCta.trim() || 'Tìm hiểu ngay',
        deepLink: '/app/trade/recommendation'
      },
      baseWeight: Number(newActionWeight) || 50,
      status: 'Active'
    };

    setFormData({
      ...formData,
      actions: [...currentActions, newAct]
    });

    setNewActionTitle('');
    setNewActionHeadline('');
    setNewActionCta('');
  };

  const handleRemoveAction = (actionId: string) => {
    setFormData({
      ...formData,
      actions: (formData.actions || []).filter((a: NBAActionItem) => a.actionId !== actionId)
    });
  };

  const handleRunSimulation = () => {
    const actions = formData.actions || [];
    const weights = formData.arbitrationWeights || {
      propensityWeight: 40,
      businessValueWeight: 35,
      contextWeight: 25
    };

    const calculated = actions.map((act: NBAActionItem) => {
      // Calculate mock propensity based on context
      let prop = 70;
      if (simInterest.includes('Tech') && act.actionTitle.includes('Tech')) prop += 25;
      if (simInterest.includes('Fixed') && act.actionTitle.includes('Trái phiếu')) prop += 20;

      // Business value score
      let val = act.baseWeight;
      if (simSegment === 'AFFLUENT') val += 10;

      // Context relevancy score
      let ctx = 80;
      if (simNav > 100000000) ctx += 10;

      const finalScore = Math.round(
        (prop * weights.propensityWeight +
          val * weights.businessValueWeight +
          ctx * weights.contextWeight) /
          100
      );

      return {
        actionId: act.actionId,
        title: act.actionTitle,
        finalScore,
        propensityScore: Math.min(prop, 100),
        businessValueScore: Math.min(val, 100),
        contextScore: Math.min(ctx, 100),
        headline: act.propositionPayload.headline,
        ctaText: act.propositionPayload.ctaText,
        gateCheck: 'Passed' as const
      };
    });

    // Sort descending by finalScore
    calculated.sort((a: { finalScore: number }, b: { finalScore: number }) => b.finalScore - a.finalScore);

    setSimResults({
      evaluated: true,
      rankedActions: calculated
    });
  };

  return (
    <div className="space-y-6">
      {screen === 'LIST' ? (
        /* ======================== VIEW: 01: NBA STRATEGY LIST ======================== */
        <div className="space-y-5">
          <div className="bg-white border border-matcha-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                Next-Best-Action (NBA) Engine / Động cơ quyết định hành động tiếp theo
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {(userRole === 'Maker' || userRole === 'Administrator') && (
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Khai báo Chiến lược NBA mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Table or Empty State */}
          {strategies.length === 0 ? (
            <EmptyDataState
              icon={Target}
              tag="HỆ THỐNG CHƯA CÓ DỮ LIỆU"
              title="Chưa có chiến lược Next-Best-Action nào"
              primaryAction={{
                label: 'Khai báo Chiến lược NBA mới',
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
                      <th className="py-3 px-4">Strategy Code</th>
                      <th className="py-3 px-4">Tên chiến lược</th>
                      <th className="py-3 px-4">Mục tiêu nghiệp vụ</th>
                      <th className="py-3 px-4">Kênh phân phối (Channel)</th>
                      <th className="py-3 px-4">Mô hình xếp hạng</th>
                      <th className="py-3 px-4">Số hành động (Actions)</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {strategies.map((st) => (
                      <tr
                        key={st.id}
                        onClick={() => handleOpenDetail(st)}
                        className="hover:bg-matcha-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-matcha-900">
                          <DataValue value={st.strategyCode} placeholder="Chưa có mã" monospace />
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          <DataValue value={st.strategyName} placeholder="Chưa đặt tên" />
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 font-medium">
                            {st.objective || 'Mục tiêu chung'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-700">
                          <DataValue value={st.channel} placeholder="Đa kênh" />
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-bronze-800 font-semibold">
                          {st.rankingModel || 'Heuristic'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-matcha-100 text-matcha-800 font-bold">
                            {st.actions?.length || 0} Propositions
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusBadgeClass(
                              st.status || 'Active'
                            )}`}
                          >
                            {getStatusLabel(st.status || 'Active')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(st);
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
        /* ======================== VIEW: 02: STRATEGY DETAIL & DESIGNER ======================== */
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
                  NBA Designer · {formData.strategyName || 'Chiến lược mới'}
                </h2>
                <div className="text-xs text-stone-500 mt-0.5">
                  Mã: <code className="text-matcha-900 font-mono font-bold">{formData.strategyCode}</code> | 
                  Kênh: {formData.channel}
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
                  <span>Lưu chiến lược</span>
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
              <span>Kho hành động (Action Inventory)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-matcha-100 text-matcha-800">
                {formData.actions?.length || 0}
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
              <span>Trọng tài & Xếp hạng (Arbitration Weights)</span>
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
              <span>Mô phỏng NBA thời gian thực (Simulation)</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="bg-white border border-stone-200 border-t-0 rounded-b-2xl p-6 shadow-xs">
            {activeTab === 'TAB_01' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Mã chiến lược NBA*</label>
                  <input
                    type="text"
                    value={formData.strategyCode || ''}
                    onChange={(e) => setFormData({ ...formData, strategyCode: e.target.value.toUpperCase() })}
                    placeholder="VD: NBA_MOBILE_INVEST_RECS"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-matcha-900"
                  />
                  {formErrors.strategyCode && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.strategyCode}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Tên chiến lược*</label>
                  <input
                    type="text"
                    value={formData.strategyName || ''}
                    onChange={(e) => setFormData({ ...formData, strategyName: e.target.value })}
                    placeholder="VD: Đề xuất Danh mục Đầu tư trên Ứng dụng Di động"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                  />
                  {formErrors.strategyName && (
                    <p className="text-rose-600 text-[11px] mt-1">{formErrors.strategyName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Mục tiêu kinh doanh (Objective)*</label>
                  <select
                    value={formData.objective || OBJECTIVES[0]}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-stone-800"
                  >
                    {OBJECTIVES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Kênh phân phối (Channel)*</label>
                  <select
                    value={formData.channel || CHANNELS[0]}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-stone-800"
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Mô hình xếp hạng (Ranking Model)*</label>
                  <select
                    value={formData.rankingModel || 'Multi-Factor Scoring'}
                    onChange={(e) => setFormData({ ...formData, rankingModel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-stone-800"
                  >
                    <option value="Multi-Factor Scoring">Multi-Factor Scoring (Đa nhân tố)</option>
                    <option value="AI Propensity">AI Propensity Model (Xác suất học máy)</option>
                    <option value="Heuristic Rule">Heuristic Rule (Quy tắc ưu tiên định sẵn)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'TAB_02' && (
              <div className="space-y-5 text-xs">
                {/* Add Action Proposition Form */}
                {(userRole === 'Maker' || userRole === 'Administrator') && (
                  <div className="p-4 bg-matcha-50/60 border border-matcha-200 rounded-xl space-y-3">
                    <div className="font-bold text-matcha-900 text-xs">Thêm Hành động Đề xuất (Action Proposition):</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Tên hành động nghiệp vụ*"
                        value={newActionTitle}
                        onChange={(e) => setNewActionTitle(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Phân khúc mục tiêu (VD: Affluent, Mass, Trader)"
                        value={newActionSegment}
                        onChange={(e) => setNewActionSegment(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Điểm trọng số cơ sở (1-100)"
                        value={newActionWeight}
                        onChange={(e) => setNewActionWeight(Number(e.target.value))}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Tiêu đề hiển thị cho KH (Headline)*"
                        value={newActionHeadline}
                        onChange={(e) => setNewActionHeadline(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Nút hành động (CTA Text, VD: Đăng ký ngay, Xem danh mục)"
                        value={newActionCta}
                        onChange={(e) => setNewActionCta(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddAction}
                      className="px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm vào kho Action</span>
                    </button>
                  </div>
                )}

                {/* Table of Actions */}
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                      <tr>
                        <th className="py-2.5 px-3">Tên hành động</th>
                        <th className="py-2.5 px-3">Phân khúc mục tiêu</th>
                        <th className="py-2.5 px-3">Tiêu đề đề xuất (Headline)</th>
                        <th className="py-2.5 px-3">Nút CTA</th>
                        <th className="py-2.5 px-3">Trọng số cơ sở</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {formData.actions && formData.actions.map((act: NBAActionItem) => (
                        <tr key={act.actionId} className="hover:bg-stone-50">
                          <td className="py-2.5 px-3 font-semibold text-stone-900">{act.actionTitle}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 font-medium">
                              {act.targetSegment}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-700">{act.propositionPayload.headline}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-bronze-100 text-bronze-800 text-[10px] font-bold">
                              {act.propositionPayload.ctaText}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">{act.baseWeight}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-matcha-100 text-matcha-800">
                              {getStatusLabel(act.status)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {(userRole === 'Maker' || userRole === 'Administrator') && (
                              <button
                                onClick={() => handleRemoveAction(act.actionId)}
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
              /* TAB 03: Arbitration & Ranking Weights */
              <div className="space-y-6 text-xs max-w-2xl">
                <div className="p-4 bg-bronze-50/70 border border-bronze-300 rounded-xl space-y-1">
                  <div className="font-bold text-bronze-900 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-bronze-700" />
                    <span>Cấu hình Trọng số Trọng tài Xếp hạng (Arbitration Formula)</span>
                  </div>
                  <p className="text-stone-600">
                    Công thức điểm tổng hợp: <code>Score = (P × Wp) + (V × Wv) + (C × Wc)</code>. 
                    Tổng 3 trọng số bắt buộc phải bằng đúng 100%.
                  </p>
                </div>

                {formErrors.weights && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.weights}</span>
                  </div>
                )}

                <div className="p-5 border border-stone-200 rounded-xl space-y-4 bg-stone-50/50">
                  <div>
                    <div className="flex justify-between font-bold text-stone-800 mb-1">
                      <span>Xác suất khách hàng chấp nhận (Propensity Weight):</span>
                      <span className="text-matcha-900 font-mono">
                        {formData.arbitrationWeights?.propensityWeight || 40}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.arbitrationWeights?.propensityWeight || 40}
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        setFormData({
                          ...formData,
                          arbitrationWeights: {
                            ...formData.arbitrationWeights!,
                            propensityWeight: p
                          }
                        });
                      }}
                      className="w-full accent-matcha-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-stone-800 mb-1">
                      <span>Giá trị kinh doanh mang lại (Business Value Weight):</span>
                      <span className="text-bronze-900 font-mono">
                        {formData.arbitrationWeights?.businessValueWeight || 35}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.arbitrationWeights?.businessValueWeight || 35}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setFormData({
                          ...formData,
                          arbitrationWeights: {
                            ...formData.arbitrationWeights!,
                            businessValueWeight: v
                          }
                        });
                      }}
                      className="w-full accent-bronze-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-stone-800 mb-1">
                      <span>Độ phù hợp ngữ cảnh tức thì (Context Relevancy Weight):</span>
                      <span className="text-stone-900 font-mono">
                        {formData.arbitrationWeights?.contextWeight || 25}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.arbitrationWeights?.contextWeight || 25}
                      onChange={(e) => {
                        const c = Number(e.target.value);
                        setFormData({
                          ...formData,
                          arbitrationWeights: {
                            ...formData.arbitrationWeights!,
                            contextWeight: c
                          }
                        });
                      }}
                      className="w-full accent-stone-700 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Tổng trọng số:</span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        (formData.arbitrationWeights?.propensityWeight || 0) +
                          (formData.arbitrationWeights?.businessValueWeight || 0) +
                          (formData.arbitrationWeights?.contextWeight || 0) ===
                        100
                          ? 'text-matcha-800'
                          : 'text-rose-600'
                      }`}
                    >
                      {(formData.arbitrationWeights?.propensityWeight || 0) +
                        (formData.arbitrationWeights?.businessValueWeight || 0) +
                        (formData.arbitrationWeights?.contextWeight || 0)}
                      % / 100%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'TAB_04' && (
              /* TAB 04: Real-time NBA Simulation */
              <div className="space-y-6 text-xs max-w-3xl">
                <div className="p-4 bg-matcha-50/70 border border-matcha-300 rounded-xl space-y-1">
                  <div className="font-bold text-matcha-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-matcha-700" />
                    <span>Mô phỏng động cơ NBA thời gian thực (Real-time Ranking Simulation)</span>
                  </div>
                  <p className="text-stone-600">
                    Nạp dữ liệu hành vi của khách hàng để xem hành động nào sẽ được hệ thống xếp hạng số 1 và banner hiển thị như thế nào.
                  </p>
                </div>

                <div className="p-5 border border-stone-200 rounded-xl space-y-4 bg-stone-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Phân khúc khách hàng:</label>
                      <select
                        value={simSegment}
                        onChange={(e) => setSimSegment(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded font-semibold text-xs"
                      >
                        <option value="MASS">Mass Retail</option>
                        <option value="AFFLUENT">Affluent / VIP Silver</option>
                        <option value="HIGH_NET_WORTH">High Net Worth (HNW)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Mối quan tâm gần nhất:</label>
                      <select
                        value={simInterest}
                        onChange={(e) => setSimInterest(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded font-semibold text-xs"
                      >
                        <option value="High-Growth Tech Equities">Cổ phiếu Công nghệ & Tăng trưởng</option>
                        <option value="Fixed Income">Trái phiếu / Thu nhập cố định</option>
                        <option value="Margin Trading">Giao dịch đòn bẩy Margin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">Giá trị tài sản NAV (VND):</label>
                      <input
                        type="number"
                        value={simNav}
                        onChange={(e) => setSimNav(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded text-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunSimulation}
                    className="px-4 py-2 bg-matcha-600 hover:bg-matcha-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Chạy đề xuất Next-Best-Action</span>
                  </button>
                </div>

                {simResults && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-bronze-600" />
                      <span>Kết quả xếp hạng các hành động (Rank-Ordered Propositions):</span>
                    </h4>

                    {/* Top 1 Highlight Preview Card */}
                    {simResults.rankedActions.length > 0 && (
                      <div className="p-5 border-2 border-matcha-400 bg-linear-to-r from-matcha-50/70 to-bronze-50/50 rounded-2xl shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-matcha-600 text-white text-[10px] font-bold uppercase tracking-wider">
                            Top #1 Recommendation
                          </span>
                          <span className="font-mono text-sm font-bold text-matcha-900">
                            Điểm tổng: {simResults.rankedActions[0].finalScore} / 100
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-stone-900">
                            {simResults.rankedActions[0].headline}
                          </h3>
                          <div className="text-xs text-stone-600 mt-0.5">
                            Chiến lược: {simResults.rankedActions[0].title}
                          </div>
                        </div>

                        {/* Banner presentation simulation */}
                        <div className="p-4 bg-white border border-matcha-300 rounded-xl flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-matcha-100 text-matcha-800 flex items-center justify-center font-bold">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-stone-900">
                                {simResults.rankedActions[0].headline}
                              </div>
                              <div className="text-[11px] text-stone-500">
                                Hiển thị dạng In-app Banner trên ứng dụng di động khách hàng
                              </div>
                            </div>
                          </div>

                          <button className="px-3 py-1.5 bg-bronze-600 hover:bg-bronze-700 text-white rounded-lg font-bold text-xs shadow-xs">
                            {simResults.rankedActions[0].ctaText}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Full table of candidates */}
                    <div className="border border-stone-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                          <tr>
                            <th className="py-2.5 px-3">Hạng</th>
                            <th className="py-2.5 px-3">Hành động</th>
                            <th className="py-2.5 px-3">Propensity</th>
                            <th className="py-2.5 px-3">Business Value</th>
                            <th className="py-2.5 px-3">Context</th>
                            <th className="py-2.5 px-3">Điểm tổng hợp</th>
                            <th className="py-2.5 px-3">Kiểm tra Cổng</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {simResults.rankedActions.map((item, idx) => (
                            <tr key={item.actionId} className="hover:bg-stone-50">
                              <td className="py-2.5 px-3 font-bold font-mono text-stone-600">#{idx + 1}</td>
                              <td className="py-2.5 px-3 font-semibold text-stone-900">{item.title}</td>
                              <td className="py-2.5 px-3 font-mono text-stone-700">{item.propensityScore}</td>
                              <td className="py-2.5 px-3 font-mono text-stone-700">{item.businessValueScore}</td>
                              <td className="py-2.5 px-3 font-mono text-stone-700">{item.contextScore}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-matcha-900">{item.finalScore}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-matcha-100 text-matcha-800">
                                  {item.gateCheck}
                                </span>
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
          </div>
        </div>
      )}
    </div>
  );
};
