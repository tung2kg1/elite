export type UserRole = 'Maker' | 'Checker' | 'Administrator' | 'View-only';

export const ENTERPRISE_DOMAINS = [
  'Customer',
  'Trading',
  'Cash',
  'Portfolio',
  'Margin & Credit',
  'Product',
  'Digital',
  'Compliance',
  'Research',
  'Communication',
  'Loyalty',
  'Corporate Action',
  'Settlement',
  'Broker/RM',
  'AI & Recommendation',
  'Channel',
  'Consent'
] as const;

export type EnterpriseDomain = typeof ENTERPRISE_DOMAINS[number];

// ===================== MODULE 1: BUSINESS VOCABULARY =====================
export const VOCABULARY_TYPES = [
  'Entity Classification',
  'Entity Subtype',
  'State',
  'Lifecycle',
  'Condition',
  'Metric',
  'Action',
  'Channel',
  'Consent'
] as const;

export type VocabularyType = typeof VOCABULARY_TYPES[number];

export type VocabularyStatus = 'Draft' | 'Pending Approval' | 'Active' | 'Deprecated' | 'Retired';

export interface VocabularyTerm {
  id: string;
  termCode: string;
  termNameEn: string;
  termNameVi: string;
  businessDomain: EnterpriseDomain;
  vocabularyGroup: string;
  vocabularyType: VocabularyType;
  businessOwner: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: VocabularyStatus;
  
  // Tab 02: Definition & Meaning
  standardDefinition: string;
  distinguishFrom?: string[];
  distinguishNotes?: string;
  synonyms?: string[];
  businessNote?: string;

  // Tab 03: Relationship & Usage
  relatedTerms?: string[];
  usedByDataDictionary?: string[];
  usedByEventTaxonomy?: string[];
  usedByMetricRule?: string[];
  usageCount: number;
}

export type BusinessVocabulary = VocabularyTerm;

// ===================== MODULE 2: DATA DICTIONARY =====================
export const DATA_CLASSIFICATIONS = [
  'Public',
  'Internal',
  'Confidential',
  'Restricted'
] as const;
export type DataClassification = typeof DATA_CLASSIFICATIONS[number];

export const DATA_TYPES = [
  'Text',
  'Number',
  'Percentage',
  'Date-Time',
  'Boolean',
  'Enum',
  'Currency',
  'Score'
] as const;
export type DataType = typeof DATA_TYPES[number];

export const VALUE_DETERMINATIONS = [
  'Direct Value',
  'Value List',
  'Yes-No',
  'Reference Catalog'
] as const;
export type ValueDetermination = typeof VALUE_DETERMINATIONS[number];

export type DataDictionaryStatus = 'Draft' | 'Pending Approval' | 'Active' | 'Inactive';

export interface ValueListItem {
  valueCode: string;
  valueNameEn: string;
  valueNameVi: string;
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface DataElement {
  id: string;
  dataDomain: EnterpriseDomain;
  businessObjectDataGroup: string;
  dataCode: string;
  dataName: string;
  businessDefinition: string;
  dataClassification: DataClassification;
  dataType: DataType;
  valueDetermination: ValueDetermination;
  referenceCatalog?: string;
  availableForSelection: boolean;
  status: DataDictionaryStatus;
  valueList?: ValueListItem[];
}

// ===================== MODULE 3: EVENT TAXONOMY =====================
export const EVENT_TYPES = [
  'Business Event',
  'Derived Event',
  'System Event',
  'AI Event'
] as const;
export type EventType = typeof EVENT_TYPES[number];

export const GENERATION_MECHANISMS = [
  'Real-time',
  'Scheduled',
  'Batch'
] as const;
export type GenerationMechanism = typeof GENERATION_MECHANISMS[number];

export const DATA_ROLES = [
  'Identity',
  'Core Content',
  'Context'
] as const;
export type DataRole = typeof DATA_ROLES[number];

export type EventStatus = 'Draft' | 'Pending Approval' | 'Active' | 'Inactive';

export interface EventDataItem {
  dataCode: string;
  dataName: string;
  required: boolean;
  dataRole: DataRole;
  businessUsage?: string;
}

export interface CanonicalEvent {
  id: string;
  eventCode: string;
  eventName: string;
  businessDefinition: string;
  businessDomain: EnterpriseDomain;
  eventType: EventType;
  businessOwner: string;
  effectiveFrom: string;
  status: EventStatus;
  
  // Tab 02: Trigger Source
  sourceSystems: string[];
  generationMechanism: GenerationMechanism;

  // Tab 03: Event Data
  eventDataPayload: EventDataItem[];
}

// ===================== MODULE 4: PROFILE CONFIGURATION (4A) =====================
export type ProfileType = 'Customer' | 'Financial' | 'Product' | 'Digital';

export interface ProfileSectionElement {
  id: string;
  dataElementCode: string;
  displayLabel?: string;
  elementOrder: number;
}

export interface ProfileSection {
  id: string;
  sectionCode: string;
  sectionName: string;
  displayOrder: number;
  visible: boolean;
  elements: ProfileSectionElement[];
}

export interface ProfileExtension {
  id: string;
  extensionCode: string;
  extensionName: string;
  applyBy: string; // e.g., CUSTOMER_TYPE, Segment, Tier
  applyValues: string[]; // e.g., ['Individual'], ['Organization'], ['VIP']
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  actions: {
    addSections?: ProfileSection[];
    addElements?: { sectionCode: string; element: ProfileSectionElement }[];
    hideSections?: string[];
    hideElements?: { sectionCode: string; elementCode: string }[];
    overrideLabels?: { code: string; label: string }[];
  };
}

export interface ProfileConfig {
  id: string;
  profileCode: string;
  profileName: string;
  profileType: ProfileType;
  description: string;
  status: 'Draft' | 'Pending Approval' | 'Active' | 'Inactive';
  version: string;
  lastUpdated: string;
  effectiveFrom: string;
  baseSections: ProfileSection[];
  extensions: ProfileExtension[];
}

// ===================== MODULE 5: CUSTOMER TIMELINE (4A) =====================
export interface TimelineSelectedEvent {
  eventCode: string;
  eventDisplayName: string;
  timelineGroup: string;
  importance: 'Normal' | 'Important' | 'Critical';
  detailAttributes: string[];
  status: 'Active' | 'Inactive';
}

export interface CustomerTimelineConfig {
  id: string;
  timelineCode: string;
  timelineName: string;
  customerType: 'Individual' | 'Organization';
  businessDescription: string;
  status: 'Draft' | 'Pending Approval' | 'Active' | 'Inactive';
  effectiveFrom: string;
  effectiveTo?: string;
  selectedEvents: TimelineSelectedEvent[];
}

// ===================== MODULE 6: CUSTOMER STATE & LIFECYCLE (4A) =====================
export interface LifecycleStateItem {
  id?: string;
  stateCode: string;
  stateName: string;
  stage?: string;
  lifecycleStage?: string;
  order?: number;
  stateOrder?: number;
  isInitial?: boolean;
  initialState?: boolean;
  isTerminal?: boolean;
  terminalState?: boolean;
  status: 'Active' | 'Inactive';
}

export interface TransitionMappingItem {
  id: string;
  fromState: string;
  toState: string;
  triggerEvent?: string;
  conditionRule?: string;
  transitionRule?: string;
  actionOnTransition?: string;
  priority?: number;
  transitionPriority?: number;
  manualOverridePolicy: 'Not Allowed' | 'Allowed with Checker' | 'Admin Only' | 'Compliance/Admin Only';
  status?: 'Active' | 'Inactive';
  transitionStatus?: 'Active' | 'Inactive';
}

export type LifecycleTransition = TransitionMappingItem;

export interface LifecycleModelConfig {
  id: string;
  modelCode?: string;
  lifecycleModelCode?: string;
  modelName?: string;
  lifecycleModelName?: string;
  customerType: 'Individual' | 'Organization';
  description?: string;
  businessDescription?: string;
  status: 'Draft' | 'Pending Approval' | 'Active' | 'Inactive';
  effectiveFrom: string;
  effectiveTo?: string;
  states: LifecycleStateItem[];
  transitions: TransitionMappingItem[];
}

export type LifecycleModel = LifecycleModelConfig;

export interface GateCheckpoint {
  id: string;
  order: number;
  checkpointName: string;
  gateType: 'Hard Gate' | 'Soft Gate';
  conditionRule: string;
  failAction: 'Block' | 'Warn' | 'Route to Specialist';
  status: 'Active' | 'Inactive';
}

export interface GatePolicy {
  id: string;
  policyCode: string;
  policyName: string;
  domain: EnterpriseDomain;
  triggerEvent: string;
  failAction: 'Block' | 'Warn' | 'Route to Specialist';
  status: 'Draft' | 'Pending Approval' | 'Active' | 'Inactive';
  checkpoints: GateCheckpoint[];
  gateCode?: string;
  gateName?: string;
  gateType?: GateType;
  businessPurpose?: string;
  decisionContexts?: DecisionContext[];
  effectiveFrom?: string;
  effectiveTo?: string;
  customerInputs?: string[];
  productActionContext?: string;
  suitabilityInputs?: string[];
  complianceInputs?: string[];
  rules?: GateRuleItem[];
  combinationLogic?: 'ALL' | 'ANY' | 'K-of-N';
  requiredCount?: number;
  passResult?: 'Allow';
  overridePolicy?: 'Not Allowed' | 'Allowed with Checker' | 'Compliance Only';
  decisionValidity?: 'Current Evaluation Only' | 'Until Data Changes' | 'Fixed Duration';
  fixedDurationDays?: number;
  evidenceNoteRequired?: boolean;
}

export interface NBAActionItem {
  actionId: string;
  actionTitle: string;
  targetSegment: string;
  eligibilityCriteria: string;
  propositionPayload: {
    headline: string;
    ctaText: string;
    deepLink: string;
  };
  baseWeight: number;
  status: 'Active' | 'Inactive';
}

export interface NBAStrategy {
  id: string;
  strategyCode: string;
  strategyName: string;
  objective: string;
  channel: string;
  rankingModel: 'Multi-Factor Scoring' | 'AI Propensity' | 'Heuristic Rule';
  arbitrationWeights: {
    propensityWeight: number;
    businessValueWeight: number;
    contextWeight: number;
  };
  status: 'Draft' | 'Pending Approval' | 'Active' | 'Inactive';
  actions: NBAActionItem[];
  businessObjective?: string;
  targetPopulation?: string;
  decisionContexts?: DecisionContext[];
  effectiveFrom?: string;
  effectiveTo?: string;
  candidateActions?: NBACandidateAction[];
  eligibilityRules?: string[];
  hardConstraintRules?: string[];
  suitabilityComplianceGate?: string;
  journeyLifecycleContext?: string;
  scoringMode?: 'Rule-based' | 'Model-based' | 'Hybrid';
  rankingFactors?: NBARankingFactor[];
  minimumScore?: number;
  selectionMethod?: 'Highest Score' | 'Top-N' | 'Threshold + Priority';
  tieBreaker?: 'Business Priority' | 'Higher Business Value' | 'Configured Order';
  maxSelectedActions?: number;
  noActionAllowed?: boolean;
  fallbackAction?: string;
  decisionValidity?: 'Current Context Only' | 'Until Context Changes' | 'Fixed Duration';
  actionExecutionPolicy?: string;
}

export type GatePolicyConfig = GatePolicy;
export type NBAStrategyConfig = NBAStrategy;

// ===================== MODULE 7: SUITABILITY & COMPLIANCE GATE (4B) =====================
export type GateType = 'Suitability' | 'Compliance' | 'Combined';
export type DecisionContext = 
  | 'Product Recommendation' 
  | 'Next Best Action' 
  | 'Communication' 
  | 'Trading/Service Action' 
  | 'AI Agent Action';

export interface GateRuleItem {
  id: string;
  ruleReference: string;
  evaluationOrder: number;
  failureDecision: 'Reject' | 'Restrict' | 'Review Required';
  reasonCode: string;
}

// ===================== MODULE 8: NEXT BEST ACTION ENGINE (4B) =====================
export type NBAActionType = 
  | 'Send Communication'
  | 'Trigger Journey'
  | 'Create RM Task'
  | 'Recommend Product/Content'
  | 'Call Workflow';

export interface NBACandidateAction {
  id: string;
  actionType: NBAActionType;
  actionReference: string;
  businessPriority: number;
  candidateStatus: 'Active' | 'Inactive';
}

export interface NBARankingFactor {
  id: string;
  factorSource: 'Business Metric' | 'Model Output' | 'Business Constant';
  factorReference: string;
  weight: number; // percentage 0-100%
  scoreDirection: 'Higher is Better' | 'Lower is Better';
}

// ===================== MODULE 9: REQUEST & APPROVAL HUB (MAKER - CHECKER GOVERNANCE) =====================
export type RequestType = 'CREATE' | 'UPDATE' | 'DEPRECATE' | 'DELETE';
export type RequestStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Active' | 'Rejected' | 'Cancelled';
export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface RequestAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: 'CREATE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CANCEL' | 'UPDATE' | 'COMMENT';
  comment: string;
}

export interface ApprovalRequest {
  id: string;
  requestCode: string;
  title: string;
  targetModule: ModuleId;
  targetModuleName: string;
  targetEntityId: string;
  targetEntityCode: string;
  targetEntityName: string;
  businessDomain: EnterpriseDomain;
  requestType: RequestType;
  priority: RequestPriority;
  status: RequestStatus;
  maker: string;
  makerRole: UserRole;
  createdAt: string;
  submittedAt?: string;
  checker?: string;
  checkerRole?: UserRole;
  reviewedAt?: string;
  businessJustification: string;
  legalOrPolicyReference?: string;
  impactSummary?: string;
  beforeData?: Record<string, any>;
  afterData: Record<string, any>;
  checkerNotes?: string;
  rejectionReason?: string;
  auditLogs: RequestAuditLog[];
}

// Navigation items
export type NavGroupId = 'group1' | 'group2' | 'group3' | 'group4a' | 'group4b' | 'governance' | 'system';
export type ModuleId = 
  | 'vocabulary'
  | 'data_dictionary'
  | 'event_taxonomy'
  | 'profile_config'
  | 'customer_timeline'
  | 'state_lifecycle'
  | 'suitability_gate'
  | 'next_best_action'
  | 'approval_hub'
  | 'settings';

// ===================== SETTINGS & USER ACCESS MANAGEMENT =====================
export interface UserProfile {
  id: string;
  fullName: string;
  staffId: string; // Mã số nhân viên PHS (e.g. PHS0892)
  companyEmail: string; // Email công ty bắt buộc có đuôi @phs.vn hoặc @phs
  role: UserRole;
  department: string;
  phoneNumber?: string;
  joinedDate?: string;
  avatarUrl?: string;
  status: 'Active' | 'Inactive';
  assignedDomains: EnterpriseDomain[];
  accessibleModules: ModuleId[];
  permissions: {
    canCreateRequest: boolean;
    canApproveRequest: boolean;
    canEditCatalog: boolean;
    canExportData: boolean;
    canManageUsers: boolean;
  };
  lastLogin?: string;
  notes?: string;
}
