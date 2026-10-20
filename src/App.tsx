import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BusinessVocabularyModule } from './components/modules/BusinessVocabularyModule';
import { DataDictionaryModule } from './components/modules/DataDictionaryModule';
import { EventTaxonomyModule } from './components/modules/EventTaxonomyModule';
import { ProfileConfigModule } from './components/modules/ProfileConfigModule';
import { CustomerTimelineModule } from './components/modules/CustomerTimelineModule';
import { StateLifecycleModule } from './components/modules/StateLifecycleModule';
import { SuitabilityGateModule } from './components/modules/SuitabilityGateModule';
import { NBAModule } from './components/modules/NBAModule';
import { RequestApprovalModule } from './components/modules/RequestApprovalModule';
import { SettingsModule } from './components/modules/SettingsModule';

import {
  EnterpriseDomain,
  ModuleId,
  UserRole,
  UserProfile,
  BusinessVocabulary,
  DataElement,
  CanonicalEvent,
  ProfileConfig,
  CustomerTimelineConfig,
  LifecycleModel,
  GatePolicy,
  NBAStrategy,
  ApprovalRequest
} from './types';

import {
  INITIAL_BUSINESS_VOCABULARIES,
  INITIAL_DATA_ELEMENTS,
  INITIAL_CANONICAL_EVENTS,
  INITIAL_PROFILES,
  INITIAL_CUSTOMER_TIMELINES,
  INITIAL_LIFECYCLE_MODELS,
  INITIAL_GATE_POLICIES,
  INITIAL_NBA_STRATEGIES,
  INITIAL_APPROVAL_REQUESTS,
  INITIAL_COMPANY_USERS
} from './data/mockData';

import {
  Download,
  X,
  FileCode,
  Shield,
  CheckCircle2,
  Layers,
  Sparkles
} from 'lucide-react';

export default function App() {
  // Navigation & Role State (approval_hub is the primary home screen)
  const [currentModule, setCurrentModule] = useState<ModuleId>('approval_hub');
  const [userRole, setUserRole] = useState<UserRole>('Maker');
  const [selectedDomain, setSelectedDomain] = useState<EnterpriseDomain | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modals
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Core Data Stores initialized with system mock data
  const [vocabularies, setVocabularies] = useState<BusinessVocabulary[]>(INITIAL_BUSINESS_VOCABULARIES);
  const [dataElements, setDataElements] = useState<DataElement[]>(INITIAL_DATA_ELEMENTS);
  const [canonicalEvents, setCanonicalEvents] = useState<CanonicalEvent[]>(INITIAL_CANONICAL_EVENTS);
  const [profiles, setProfiles] = useState<ProfileConfig[]>(INITIAL_PROFILES);
  const [timelines, setTimelines] = useState<CustomerTimelineConfig[]>(INITIAL_CUSTOMER_TIMELINES);
  const [lifecycleModels, setLifecycleModels] = useState<LifecycleModel[]>(INITIAL_LIFECYCLE_MODELS);
  const [gatePolicies, setGatePolicies] = useState<GatePolicy[]>(INITIAL_GATE_POLICIES);
  const [nbaStrategies, setNbaStrategies] = useState<NBAStrategy[]>(INITIAL_NBA_STRATEGIES);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(INITIAL_APPROVAL_REQUESTS);
  const [preselectedRequestId, setPreselectedRequestId] = useState<string | null>(null);

  // Corporate Users & Current Profile (@phs)
  const [usersList, setUsersList] = useState<UserProfile[]>(INITIAL_COMPANY_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_COMPANY_USERS[0]);

  // Role Change Handler synchronizing user profile
  const handleRoleChange = (newRole: UserRole) => {
    setUserRole(newRole);
    const matchingUser = usersList.find((u) => u.role === newRole);
    if (matchingUser) {
      setCurrentUser(matchingUser);
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        role: newRole,
        permissions: {
          ...prev.permissions,
          canCreateRequest: newRole === 'Maker' || newRole === 'Administrator',
          canApproveRequest: newRole === 'Checker' || newRole === 'Administrator',
          canEditCatalog: newRole === 'Maker' || newRole === 'Administrator',
          canManageUsers: newRole === 'Administrator'
        }
      }));
    }
  };

  // Computed pending count for Checker and indicators
  const pendingRequestsCount = approvalRequests.filter((r) => r.status === 'Pending Approval').length;

  // Checker Approval Handler
  const handleApproveRequest = (request: ApprovalRequest, checkerNote: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const approveLog = {
      id: `LOG_${Date.now()}`,
      timestamp: nowStr,
      actor: userRole === 'Checker' ? 'Trần Thị Mai (Checker)' : `${userRole} (Checker)`,
      role: 'Checker' as const,
      action: 'APPROVE' as const,
      comment: checkerNote
    };

    const updatedRequest: ApprovalRequest = {
      ...request,
      status: 'Approved',
      reviewedAt: nowStr,
      checker: userRole === 'Checker' ? 'Trần Thị Mai (Checker)' : `${userRole}`,
      checkerNotes: checkerNote,
      auditLogs: [...request.auditLogs, approveLog]
    };

    setApprovalRequests((prev) => prev.map((r) => (r.id === request.id ? updatedRequest : r)));

    // Synchronize downstream module entity to Active
    if (request.targetModule === 'vocabulary') {
      setVocabularies((prev) =>
        prev.map((item) =>
          item.termCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    } else if (request.targetModule === 'data_dictionary') {
      setDataElements((prev) =>
        prev.map((item) =>
          item.dataCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    } else if (request.targetModule === 'event_taxonomy') {
      setCanonicalEvents((prev) =>
        prev.map((item) =>
          item.eventCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    } else if (request.targetModule === 'suitability_gate') {
      setGatePolicies((prev) =>
        prev.map((item) =>
          item.gateCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    } else if (request.targetModule === 'next_best_action') {
      setNbaStrategies((prev) =>
        prev.map((item) =>
          item.strategyCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    }
  };

  // Activate Request Handler (From Approved to Active)
  const handleActivateRequest = (request: ApprovalRequest) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const activateLog = {
      id: `LOG_${Date.now()}`,
      timestamp: nowStr,
      actor: userRole === 'Checker' ? 'Trần Thị Mai (Checker)' : `${userRole}`,
      role: userRole,
      action: 'APPROVE' as const,
      comment: 'Kích hoạt cấu hình đưa vào trạng thái Đang hoạt động trên hệ thống Catalog Production.'
    };

    const updatedRequest: ApprovalRequest = {
      ...request,
      status: 'Active',
      auditLogs: [...request.auditLogs, activateLog]
    };

    setApprovalRequests((prev) => prev.map((r) => (r.id === request.id ? updatedRequest : r)));

    // Synchronize downstream module entity to Active
    if (request.targetModule === 'vocabulary') {
      setVocabularies((prev) =>
        prev.map((item) =>
          item.termCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    } else if (request.targetModule === 'data_dictionary') {
      setDataElements((prev) =>
        prev.map((item) =>
          item.dataCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    } else if (request.targetModule === 'event_taxonomy') {
      setCanonicalEvents((prev) =>
        prev.map((item) =>
          item.eventCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    } else if (request.targetModule === 'suitability_gate') {
      setGatePolicies((prev) =>
        prev.map((item) =>
          item.gateCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    } else if (request.targetModule === 'next_best_action') {
      setNbaStrategies((prev) =>
        prev.map((item) =>
          item.strategyCode === request.targetEntityCode || item.id === request.targetEntityId
            ? { ...item, status: 'Active' }
            : item
        )
      );
    }
  };

  // Checker Rejection Handler
  const handleRejectRequest = (request: ApprovalRequest, rejectionReason: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const rejectLog = {
      id: `LOG_${Date.now()}`,
      timestamp: nowStr,
      actor: userRole === 'Checker' ? 'Trần Thị Mai (Checker)' : `${userRole} (Checker)`,
      role: 'Checker' as const,
      action: 'REJECT' as const,
      comment: `Từ chối thẩm tra: ${rejectionReason}`
    };

    const updatedRequest: ApprovalRequest = {
      ...request,
      status: 'Rejected',
      reviewedAt: nowStr,
      checker: userRole === 'Checker' ? 'Trần Thị Mai (Checker)' : `${userRole}`,
      rejectionReason,
      auditLogs: [...request.auditLogs, rejectLog]
    };

    setApprovalRequests((prev) => prev.map((r) => (r.id === request.id ? updatedRequest : r)));
  };

  // Export bundle as JSON
  const handleExportJson = () => {
    const bundle = {
      exportTime: new Date().toISOString(),
      platform: 'Customer 360 & Decisioning Admin Portal',
      theme: 'Matcha Green & Bronze',
      version: '1.0.0',
      data: {
        approvalRequests,
        businessVocabularies: vocabularies,
        dataElements,
        canonicalEvents,
        profiles,
        customerTimelines: timelines,
        lifecycleModels,
        gatePolicies,
        nbaStrategies,
        companyUsers: usersList
      }
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `customer360_platform_catalog_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex h-screen w-full bg-[#f8faf7] text-stone-800 font-sans overflow-hidden">
      {/* Sidebar with custom Matcha & Bronze theme */}
      <Sidebar
        currentModule={currentModule}
        onSelectModule={(mod) => {
          setCurrentModule(mod);
          setPreselectedRequestId(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        userRole={userRole}
        onChangeRole={handleRoleChange}
        currentUser={currentUser}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentModule={currentModule}
          onSelectModule={setCurrentModule}
          selectedDomain={selectedDomain}
          onChangeDomain={setSelectedDomain}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          userRole={userRole}
          onChangeRole={handleRoleChange}
          currentUser={currentUser}
          onOpenExportModal={() => setShowExportModal(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Dynamic Module Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/70">
          <div className="max-w-[1600px] w-full mx-auto pb-16">
            {currentModule === 'vocabulary' && (
              <BusinessVocabularyModule
                terms={vocabularies}
                onUpdateTerms={setVocabularies}
                selectedDomainFilter={selectedDomain}
                globalSearch={searchTerm}
                userRole={userRole}
              />
            )}

            {currentModule === 'data_dictionary' && (
              <DataDictionaryModule
                dataElements={dataElements}
                onUpdateElements={setDataElements}
                selectedDomainFilter={selectedDomain}
                globalSearch={searchTerm}
                userRole={userRole}
              />
            )}

            {currentModule === 'event_taxonomy' && (
              <EventTaxonomyModule
                events={canonicalEvents}
                onUpdateEvents={setCanonicalEvents}
                dataElements={dataElements}
                selectedDomainFilter={selectedDomain}
                globalSearch={searchTerm}
                userRole={userRole}
              />
            )}

            {currentModule === 'profile_config' && (
              <ProfileConfigModule
                profiles={profiles}
                onUpdateProfiles={setProfiles}
                dataElements={dataElements}
                userRole={userRole}
              />
            )}

            {currentModule === 'customer_timeline' && (
              <CustomerTimelineModule
                timelines={timelines}
                onUpdateTimelines={setTimelines}
                canonicalEvents={canonicalEvents}
                userRole={userRole}
              />
            )}

            {currentModule === 'state_lifecycle' && (
              <StateLifecycleModule
                lifecycleModels={lifecycleModels}
                onUpdateModels={setLifecycleModels}
                userRole={userRole}
              />
            )}

            {currentModule === 'suitability_gate' && (
              <SuitabilityGateModule
                policies={gatePolicies}
                onUpdatePolicies={setGatePolicies}
                userRole={userRole}
              />
            )}

            {currentModule === 'next_best_action' && (
              <NBAModule
                strategies={nbaStrategies}
                onUpdateStrategies={setNbaStrategies}
                userRole={userRole}
              />
            )}

            {currentModule === 'approval_hub' && (
              <RequestApprovalModule
                requests={approvalRequests}
                onUpdateRequests={setApprovalRequests}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onActivateRequest={handleActivateRequest}
                userRole={userRole}
                selectedDomainFilter={selectedDomain}
                globalSearch={searchTerm}
                onNavigateToModule={(modId) => {
                  setCurrentModule(modId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                preselectedRequestId={preselectedRequestId}
              />
            )}

            {currentModule === 'settings' && (
              <SettingsModule
                currentUser={currentUser}
                onUpdateCurrentUser={setCurrentUser}
                usersList={usersList}
                onUpdateUsersList={setUsersList}
                userRole={userRole}
                onChangeRole={handleRoleChange}
                onNavigateToModule={(modId) => {
                  setCurrentModule(modId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-matcha-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-matcha-100 text-matcha-800 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-stone-900 text-base">
                  Xuất dữ liệu cấu hình hệ thống (Export Platform Catalog)
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Toàn bộ định nghĩa Business Vocabulary, Data Dictionary, Canonical Events, Profile Extension, 
              Timeline, Lifecycle State Machine, Gate Policies và NBA Strategies sẽ được đóng gói thành chuẩn JSON dùng chung.
            </p>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Số thuật ngữ Vocabulary:</span>
                <span className="font-bold text-matcha-900">{vocabularies.length}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Số Data Element:</span>
                <span className="font-bold text-matcha-900">{dataElements.length}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Số Canonical Events:</span>
                <span className="font-bold text-matcha-900">{canonicalEvents.length}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Số Profiles (Extension Model):</span>
                <span className="font-bold text-matcha-900">{profiles.length}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Số Gate Policies & NBA Strategies:</span>
                <span className="font-bold text-matcha-900">{gatePolicies.length + nbaStrategies.length}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleExportJson();
                  setShowExportModal(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-matcha-600 hover:bg-matcha-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải tệp JSON Catalog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
