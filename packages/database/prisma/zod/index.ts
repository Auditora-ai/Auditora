/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted', 'ReadCommitted', 'RepeatableRead', 'Serializable'])

export type TransactionIsolationLevel = z.infer<typeof TransactionIsolationLevelSchema>;

// File: UserScalarFieldEnum.schema.ts

export const UserScalarFieldEnumSchema = z.enum(['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt', 'username', 'role', 'banned', 'banReason', 'banExpires', 'onboardingComplete', 'paymentsCustomerId', 'locale', 'displayUsername', 'twoFactorEnabled', 'lastActiveOrganizationId'])

export type UserScalarFieldEnum = z.infer<typeof UserScalarFieldEnumSchema>;

// File: SessionScalarFieldEnum.schema.ts

export const SessionScalarFieldEnumSchema = z.enum(['id', 'expiresAt', 'ipAddress', 'userAgent', 'userId', 'impersonatedBy', 'activeOrganizationId', 'token', 'createdAt', 'updatedAt'])

export type SessionScalarFieldEnum = z.infer<typeof SessionScalarFieldEnumSchema>;

// File: AccountScalarFieldEnum.schema.ts

export const AccountScalarFieldEnumSchema = z.enum(['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'expiresAt', 'password', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'createdAt', 'updatedAt'])

export type AccountScalarFieldEnum = z.infer<typeof AccountScalarFieldEnumSchema>;

// File: VerificationScalarFieldEnum.schema.ts

export const VerificationScalarFieldEnumSchema = z.enum(['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'])

export type VerificationScalarFieldEnum = z.infer<typeof VerificationScalarFieldEnumSchema>;

// File: PasskeyScalarFieldEnum.schema.ts

export const PasskeyScalarFieldEnumSchema = z.enum(['id', 'name', 'publicKey', 'userId', 'credentialID', 'counter', 'deviceType', 'backedUp', 'transports', 'aaguid', 'createdAt'])

export type PasskeyScalarFieldEnum = z.infer<typeof PasskeyScalarFieldEnumSchema>;

// File: TwoFactorScalarFieldEnum.schema.ts

export const TwoFactorScalarFieldEnumSchema = z.enum(['id', 'secret', 'backupCodes', 'userId'])

export type TwoFactorScalarFieldEnum = z.infer<typeof TwoFactorScalarFieldEnumSchema>;

// File: OrganizationScalarFieldEnum.schema.ts

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId', 'industry', 'operationsProfile', 'businessModel', 'employeeCount', 'notes', 'aiTier', 'aiTokenBudget'])

export type OrganizationScalarFieldEnum = z.infer<typeof OrganizationScalarFieldEnumSchema>;

// File: MemberScalarFieldEnum.schema.ts

export const MemberScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'role', 'createdAt'])

export type MemberScalarFieldEnum = z.infer<typeof MemberScalarFieldEnumSchema>;

// File: InvitationScalarFieldEnum.schema.ts

export const InvitationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'email', 'role', 'status', 'expiresAt', 'inviterId', 'createdAt'])

export type InvitationScalarFieldEnum = z.infer<typeof InvitationScalarFieldEnumSchema>;

// File: ProcessArchitectureScalarFieldEnum.schema.ts

export const ProcessArchitectureScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'projectPlan', 'createdAt', 'updatedAt'])

export type ProcessArchitectureScalarFieldEnum = z.infer<typeof ProcessArchitectureScalarFieldEnumSchema>;

// File: ProcessDefinitionScalarFieldEnum.schema.ts

export const ProcessDefinitionScalarFieldEnumSchema = z.enum(['id', 'architectureId', 'name', 'description', 'level', 'parentId', 'owner', 'goals', 'triggers', 'outputs', 'processStatus', 'category', 'bpmnXml', 'priority', 'createdAt'])

export type ProcessDefinitionScalarFieldEnum = z.infer<typeof ProcessDefinitionScalarFieldEnumSchema>;

// File: MeetingSessionScalarFieldEnum.schema.ts

export const MeetingSessionScalarFieldEnumSchema = z.enum(['id', 'type', 'status', 'meetingUrl', 'organizationId', 'processDefinitionId', 'userId', 'continuationOf', 'recallBotId', 'recallBotStatus', 'scheduledFor', 'scheduledEnd', 'sessionGoals', 'sessionContext', 'intakeToken', 'intakeStatus', 'startedAt', 'endedAt', 'bpmnXml', 'videoUrl', 'audioUrl', 'shareToken', 'createdAt', 'updatedAt'])

export type MeetingSessionScalarFieldEnum = z.infer<typeof MeetingSessionScalarFieldEnumSchema>;

// File: DiagramNodeScalarFieldEnum.schema.ts

export const DiagramNodeScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'nodeType', 'label', 'state', 'lane', 'confidence', 'positionX', 'positionY', 'connections', 'formedAt', 'confirmedAt', 'rejectedAt', 'parentId', 'properties', 'createdAt', 'updatedAt'])

export type DiagramNodeScalarFieldEnum = z.infer<typeof DiagramNodeScalarFieldEnumSchema>;

// File: NodeCommentScalarFieldEnum.schema.ts

export const NodeCommentScalarFieldEnumSchema = z.enum(['id', 'nodeId', 'content', 'authorId', 'authorName', 'sourceType', 'sourceSnippet', 'createdAt', 'updatedAt'])

export type NodeCommentScalarFieldEnum = z.infer<typeof NodeCommentScalarFieldEnumSchema>;

// File: TranscriptEntryScalarFieldEnum.schema.ts

export const TranscriptEntryScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'speaker', 'text', 'correctedText', 'timestamp', 'confidence', 'source', 'createdAt'])

export type TranscriptEntryScalarFieldEnum = z.infer<typeof TranscriptEntryScalarFieldEnumSchema>;

// File: CorrectionLogScalarFieldEnum.schema.ts

export const CorrectionLogScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'nodeId', 'action', 'oldState', 'newState', 'oldLabel', 'newLabel', 'createdAt'])

export type CorrectionLogScalarFieldEnum = z.infer<typeof CorrectionLogScalarFieldEnumSchema>;

// File: TeleprompterLogScalarFieldEnum.schema.ts

export const TeleprompterLogScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'question', 'used', 'skipped', 'shownAt', 'completenessScore', 'gapType', 'sipocCoverage'])

export type TeleprompterLogScalarFieldEnum = z.infer<typeof TeleprompterLogScalarFieldEnumSchema>;

// File: SessionSummaryScalarFieldEnum.schema.ts

export const SessionSummaryScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'summary', 'actionItems', 'emailSentAt', 'createdAt'])

export type SessionSummaryScalarFieldEnum = z.infer<typeof SessionSummaryScalarFieldEnumSchema>;

// File: SessionDeliverableScalarFieldEnum.schema.ts

export const SessionDeliverableScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'type', 'status', 'data', 'error', 'startedAt', 'completedAt', 'createdAt', 'updatedAt'])

export type SessionDeliverableScalarFieldEnum = z.infer<typeof SessionDeliverableScalarFieldEnumSchema>;

// File: MeetingParticipantScalarFieldEnum.schema.ts

export const MeetingParticipantScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'name', 'email', 'role', 'participantType', 'talkTimeMs', 'joinedAt', 'leftAt', 'createdAt'])

export type MeetingParticipantScalarFieldEnum = z.infer<typeof MeetingParticipantScalarFieldEnumSchema>;

// File: DiscoveryThreadScalarFieldEnum.schema.ts

export const DiscoveryThreadScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'processDefinitionId', 'createdBy', 'rejectedProcessNames', 'createdAt', 'updatedAt'])

export type DiscoveryThreadScalarFieldEnum = z.infer<typeof DiscoveryThreadScalarFieldEnumSchema>;

// File: DiscoveryMessageScalarFieldEnum.schema.ts

export const DiscoveryMessageScalarFieldEnumSchema = z.enum(['id', 'threadId', 'role', 'content', 'audioFileUrl', 'extractedProcesses', 'createdAt'])

export type DiscoveryMessageScalarFieldEnum = z.infer<typeof DiscoveryMessageScalarFieldEnumSchema>;

// File: RaciEntryScalarFieldEnum.schema.ts

export const RaciEntryScalarFieldEnumSchema = z.enum(['id', 'processId', 'activityName', 'role', 'assignment', 'source', 'createdAt'])

export type RaciEntryScalarFieldEnum = z.infer<typeof RaciEntryScalarFieldEnumSchema>;

// File: StakeholderConflictScalarFieldEnum.schema.ts

export const StakeholderConflictScalarFieldEnumSchema = z.enum(['id', 'processId', 'nodeLabel', 'conflictType', 'perspectives', 'resolved', 'resolution', 'createdAt'])

export type StakeholderConflictScalarFieldEnum = z.infer<typeof StakeholderConflictScalarFieldEnumSchema>;

// File: ProcessIntelligenceScalarFieldEnum.schema.ts

export const ProcessIntelligenceScalarFieldEnumSchema = z.enum(['id', 'processDefinitionId', 'knowledgeSnapshot', 'confidenceScores', 'completenessScore', 'shareToken', 'shareExpiresAt', 'riskShareToken', 'riskShareExpiresAt', 'version', 'lastAuditAt', 'createdAt', 'updatedAt'])

export type ProcessIntelligenceScalarFieldEnum = z.infer<typeof ProcessIntelligenceScalarFieldEnumSchema>;

// File: IntelligenceItemScalarFieldEnum.schema.ts

export const IntelligenceItemScalarFieldEnumSchema = z.enum(['id', 'intelligenceId', 'category', 'question', 'context', 'priority', 'dependsOn', 'status', 'resolution', 'resolvedAt', 'resolvedBy', 'sourceType', 'sourceId', 'elementRef', 'insightType', 'createdAt', 'updatedAt'])

export type IntelligenceItemScalarFieldEnum = z.infer<typeof IntelligenceItemScalarFieldEnumSchema>;

// File: IntelligenceAuditLogScalarFieldEnum.schema.ts

export const IntelligenceAuditLogScalarFieldEnumSchema = z.enum(['id', 'intelligenceId', 'triggerType', 'triggerId', 'delta', 'completenessScore', 'inputTokens', 'outputTokens', 'createdAt'])

export type IntelligenceAuditLogScalarFieldEnum = z.infer<typeof IntelligenceAuditLogScalarFieldEnumSchema>;

// File: ProcessRiskScalarFieldEnum.schema.ts

export const ProcessRiskScalarFieldEnumSchema = z.enum(['id', 'processDefinitionId', 'title', 'description', 'riskType', 'status', 'source', 'severity', 'probability', 'riskScore', 'residualSeverity', 'residualProbability', 'residualScore', 'affectedStep', 'affectedRole', 'relatedItemId', 'isOpportunity', 'opportunityValue', 'failureMode', 'failureEffect', 'detectionDifficulty', 'rpn', 'shareVisible', 'createdBy', 'createdAt', 'updatedAt'])

export type ProcessRiskScalarFieldEnum = z.infer<typeof ProcessRiskScalarFieldEnumSchema>;

// File: RiskMitigationScalarFieldEnum.schema.ts

export const RiskMitigationScalarFieldEnumSchema = z.enum(['id', 'riskId', 'action', 'owner', 'deadline', 'status', 'notes', 'completedAt', 'createdAt', 'updatedAt'])

export type RiskMitigationScalarFieldEnum = z.infer<typeof RiskMitigationScalarFieldEnumSchema>;

// File: RiskControlScalarFieldEnum.schema.ts

export const RiskControlScalarFieldEnumSchema = z.enum(['id', 'riskId', 'name', 'description', 'controlType', 'effectiveness', 'automated', 'system', 'createdAt', 'updatedAt'])

export type RiskControlScalarFieldEnum = z.infer<typeof RiskControlScalarFieldEnumSchema>;

// File: RiskAuditLogScalarFieldEnum.schema.ts

export const RiskAuditLogScalarFieldEnumSchema = z.enum(['id', 'riskId', 'action', 'delta', 'userId', 'createdAt'])

export type RiskAuditLogScalarFieldEnum = z.infer<typeof RiskAuditLogScalarFieldEnumSchema>;

// File: ProcessTemplateScalarFieldEnum.schema.ts

export const ProcessTemplateScalarFieldEnumSchema = z.enum(['id', 'framework', 'industry', 'name', 'description', 'structure', 'createdAt'])

export type ProcessTemplateScalarFieldEnum = z.infer<typeof ProcessTemplateScalarFieldEnumSchema>;

// File: ProcessVersionScalarFieldEnum.schema.ts

export const ProcessVersionScalarFieldEnumSchema = z.enum(['id', 'processDefinitionId', 'version', 'name', 'description', 'bpmnXml', 'goals', 'triggers', 'outputs', 'changeNote', 'createdBy', 'createdAt'])

export type ProcessVersionScalarFieldEnum = z.infer<typeof ProcessVersionScalarFieldEnumSchema>;

// File: ArchitectureVersionScalarFieldEnum.schema.ts

export const ArchitectureVersionScalarFieldEnumSchema = z.enum(['id', 'architectureId', 'version', 'snapshot', 'changeNote', 'createdBy', 'createdAt'])

export type ArchitectureVersionScalarFieldEnum = z.infer<typeof ArchitectureVersionScalarFieldEnumSchema>;

// File: DocumentScalarFieldEnum.schema.ts

export const DocumentScalarFieldEnumSchema = z.enum(['id', 'name', 'description', 'mimeType', 'filePath', 'fileSize', 'organizationId', 'processDefinitionId', 'extractedText', 'isProcessed', 'createdBy', 'createdAt', 'updatedAt'])

export type DocumentScalarFieldEnum = z.infer<typeof DocumentScalarFieldEnumSchema>;

// File: DocumentVersionScalarFieldEnum.schema.ts

export const DocumentVersionScalarFieldEnumSchema = z.enum(['id', 'documentId', 'version', 'filePath', 'fileSize', 'changeNote', 'createdBy', 'createdAt'])

export type DocumentVersionScalarFieldEnum = z.infer<typeof DocumentVersionScalarFieldEnumSchema>;

// File: ToolLeadScalarFieldEnum.schema.ts

export const ToolLeadScalarFieldEnumSchema = z.enum(['id', 'email', 'toolUsed', 'outputData', 'ipAddress', 'source', 'nurture1At', 'nurture2At', 'createdAt'])

export type ToolLeadScalarFieldEnum = z.infer<typeof ToolLeadScalarFieldEnumSchema>;

// File: CompanyBrainScalarFieldEnum.schema.ts

export const CompanyBrainScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'lastEnrichedAt', 'createdAt', 'updatedAt'])

export type CompanyBrainScalarFieldEnum = z.infer<typeof CompanyBrainScalarFieldEnumSchema>;

// File: OrgContextScalarFieldEnum.schema.ts

export const OrgContextScalarFieldEnumSchema = z.enum(['id', 'companyBrainId', 'mission', 'missionConfidence', 'missionSources', 'vision', 'visionConfidence', 'visionSources', 'values', 'valuesConfidence', 'valuesSources', 'industrySector', 'industrySubsector', 'companySize', 'geography', 'orgStructure', 'businessModel', 'createdAt', 'updatedAt'])

export type OrgContextScalarFieldEnum = z.infer<typeof OrgContextScalarFieldEnumSchema>;

// File: ValueChainActivityScalarFieldEnum.schema.ts

export const ValueChainActivityScalarFieldEnumSchema = z.enum(['id', 'companyBrainId', 'name', 'type', 'description', 'orderIndex', 'linkedProcessIds', 'createdAt', 'updatedAt'])

export type ValueChainActivityScalarFieldEnum = z.infer<typeof ValueChainActivityScalarFieldEnumSchema>;

// File: ProcessLinkScalarFieldEnum.schema.ts

export const ProcessLinkScalarFieldEnumSchema = z.enum(['id', 'companyBrainId', 'fromProcessId', 'toProcessId', 'linkType', 'description', 'confidence', 'source', 'createdAt'])

export type ProcessLinkScalarFieldEnum = z.infer<typeof ProcessLinkScalarFieldEnumSchema>;

// File: GlobalRoleScalarFieldEnum.schema.ts

export const GlobalRoleScalarFieldEnumSchema = z.enum(['id', 'companyBrainId', 'name', 'department', 'title', 'appearsInProcessIds', 'createdAt', 'updatedAt'])

export type GlobalRoleScalarFieldEnum = z.infer<typeof GlobalRoleScalarFieldEnumSchema>;

// File: GlobalSystemScalarFieldEnum.schema.ts

export const GlobalSystemScalarFieldEnumSchema = z.enum(['id', 'companyBrainId', 'name', 'vendor', 'description', 'usedInProcessIds', 'createdAt', 'updatedAt'])

export type GlobalSystemScalarFieldEnum = z.infer<typeof GlobalSystemScalarFieldEnumSchema>;

// File: EnrichmentHistoryScalarFieldEnum.schema.ts

export const EnrichmentHistoryScalarFieldEnumSchema = z.enum(['id', 'companyBrainId', 'sourceType', 'sourceId', 'field', 'oldValue', 'newValue', 'confidence', 'action', 'createdAt'])

export type EnrichmentHistoryScalarFieldEnum = z.infer<typeof EnrichmentHistoryScalarFieldEnumSchema>;

// File: OrgDeliverableScalarFieldEnum.schema.ts

export const OrgDeliverableScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'type', 'status', 'data', 'error', 'confidence', 'processDefinitionId', 'startedAt', 'completedAt', 'createdAt', 'updatedAt'])

export type OrgDeliverableScalarFieldEnum = z.infer<typeof OrgDeliverableScalarFieldEnumSchema>;

// File: ClientIntakeResponseScalarFieldEnum.schema.ts

export const ClientIntakeResponseScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'questionKey', 'questionText', 'response', 'respondedAt', 'createdAt'])

export type ClientIntakeResponseScalarFieldEnum = z.infer<typeof ClientIntakeResponseScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'customerId', 'subscriptionId', 'priceId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: AiUsageLogScalarFieldEnum.schema.ts

export const AiUsageLogScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'pipeline', 'model', 'inputTokens', 'outputTokens', 'durationMs', 'success', 'error', 'metadata', 'createdAt'])

export type AiUsageLogScalarFieldEnum = z.infer<typeof AiUsageLogScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: NullableJsonNullValueInput.schema.ts

export const NullableJsonNullValueInputSchema = z.enum(['DbNull', 'JsonNull'])

export type NullableJsonNullValueInput = z.infer<typeof NullableJsonNullValueInputSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInput = z.infer<typeof JsonNullValueInputSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilter = z.infer<typeof JsonNullValueFilterSchema>;

// File: ProcessLevel.schema.ts

export const ProcessLevelSchema = z.enum(['MACRO_PROCESS', 'PROCESS', 'SUBPROCESS', 'TASK', 'PROCEDURE'])

export type ProcessLevel = z.infer<typeof ProcessLevelSchema>;

// File: SessionType.schema.ts

export const SessionTypeSchema = z.enum(['DISCOVERY', 'DEEP_DIVE', 'CONTINUATION'])

export type SessionType = z.infer<typeof SessionTypeSchema>;

// File: SessionStatus.schema.ts

export const SessionStatusSchema = z.enum(['SCHEDULED', 'CONNECTING', 'ACTIVE', 'ENDED', 'FAILED'])

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

// File: NodeType.schema.ts

export const NodeTypeSchema = z.enum(['START_EVENT', 'END_EVENT', 'TASK', 'USER_TASK', 'SERVICE_TASK', 'MANUAL_TASK', 'BUSINESS_RULE_TASK', 'SUBPROCESS', 'EXCLUSIVE_GATEWAY', 'PARALLEL_GATEWAY', 'TIMER_EVENT', 'MESSAGE_EVENT', 'SIGNAL_EVENT', 'CONDITIONAL_EVENT', 'TEXT_ANNOTATION', 'DATA_OBJECT'])

export type NodeType = z.infer<typeof NodeTypeSchema>;

// File: NodeState.schema.ts

export const NodeStateSchema = z.enum(['FORMING', 'CONFIRMED', 'REJECTED', 'ARCHIVED'])

export type NodeState = z.infer<typeof NodeStateSchema>;

// File: RaciType.schema.ts

export const RaciTypeSchema = z.enum(['RESPONSIBLE', 'ACCOUNTABLE', 'CONSULTED', 'INFORMED'])

export type RaciType = z.infer<typeof RaciTypeSchema>;

// File: IntelligenceItemCategory.schema.ts

export const IntelligenceItemCategorySchema = z.enum(['MISSING_PATH', 'MISSING_ROLE', 'MISSING_EXCEPTION', 'MISSING_DECISION', 'MISSING_TRIGGER', 'MISSING_OUTPUT', 'CONTRADICTION', 'UNCLEAR_HANDOFF', 'MISSING_SLA', 'MISSING_SYSTEM', 'GENERAL_GAP'])

export type IntelligenceItemCategory = z.infer<typeof IntelligenceItemCategorySchema>;

// File: IntelligenceItemStatus.schema.ts

export const IntelligenceItemStatusSchema = z.enum(['OPEN', 'RESOLVED', 'SUPERSEDED'])

export type IntelligenceItemStatus = z.infer<typeof IntelligenceItemStatusSchema>;

// File: RiskType.schema.ts

export const RiskTypeSchema = z.enum(['OPERATIONAL', 'COMPLIANCE', 'STRATEGIC', 'FINANCIAL', 'TECHNOLOGY', 'HUMAN_RESOURCE', 'REPUTATIONAL'])

export type RiskType = z.infer<typeof RiskTypeSchema>;

// File: RiskStatus.schema.ts

export const RiskStatusSchema = z.enum(['IDENTIFIED', 'ASSESSED', 'MITIGATING', 'ACCEPTED', 'CLOSED'])

export type RiskStatus = z.infer<typeof RiskStatusSchema>;

// File: RiskSource.schema.ts

export const RiskSourceSchema = z.enum(['AI_AUDIT', 'AI_FMEA', 'INTELLIGENCE_GAP', 'MANUAL', 'CONVERSATION'])

export type RiskSource = z.infer<typeof RiskSourceSchema>;

// File: MitigationStatus.schema.ts

export const MitigationStatusSchema = z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])

export type MitigationStatus = z.infer<typeof MitigationStatusSchema>;

// File: ControlType.schema.ts

export const ControlTypeSchema = z.enum(['PREVENTIVE', 'DETECTIVE', 'CORRECTIVE'])

export type ControlType = z.infer<typeof ControlTypeSchema>;

// File: ControlEffectiveness.schema.ts

export const ControlEffectivenessSchema = z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'])

export type ControlEffectiveness = z.infer<typeof ControlEffectivenessSchema>;

// File: ValueChainType.schema.ts

export const ValueChainTypeSchema = z.enum(['PRIMARY', 'SUPPORT'])

export type ValueChainType = z.infer<typeof ValueChainTypeSchema>;

// File: ProcessLinkType.schema.ts

export const ProcessLinkTypeSchema = z.enum(['FEEDS', 'TRIGGERS', 'DEPENDS', 'HANDOFF'])

export type ProcessLinkType = z.infer<typeof ProcessLinkTypeSchema>;

// File: EnrichmentSourceType.schema.ts

export const EnrichmentSourceTypeSchema = z.enum(['SESSION', 'DOCUMENT', 'MANUAL'])

export type EnrichmentSourceType = z.infer<typeof EnrichmentSourceTypeSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseType = z.infer<typeof PurchaseTypeSchema>;

// File: User.schema.ts

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullish(),
  locale: z.string().nullish(),
  displayUsername: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
  lastActiveOrganizationId: z.string().nullish(),
});

export type UserType = z.infer<typeof UserSchema>;


// File: Session.schema.ts

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.string(),
  impersonatedBy: z.string().nullish(),
  activeOrganizationId: z.string().nullish(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionModel = z.infer<typeof SessionSchema>;

// File: Account.schema.ts

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  password: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountType = z.infer<typeof AccountSchema>;


// File: Verification.schema.ts

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export type VerificationType = z.infer<typeof VerificationSchema>;


// File: Passkey.schema.ts

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullish(),
  aaguid: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export type PasskeyType = z.infer<typeof PasskeySchema>;


// File: TwoFactor.schema.ts

export const TwoFactorSchema = z.object({
  id: z.string(),
  secret: z.string(),
  backupCodes: z.string(),
  userId: z.string(),
});

export type TwoFactorType = z.infer<typeof TwoFactorSchema>;


// File: Organization.schema.ts

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullish(),
  logo: z.string().nullish(),
  createdAt: z.date(),
  metadata: z.string().nullish(),
  paymentsCustomerId: z.string().nullish(),
  industry: z.string().nullish(),
  operationsProfile: z.string().nullish(),
  businessModel: z.string().nullish(),
  employeeCount: z.string().nullish(),
  notes: z.string().nullish(),
  aiTier: z.string().default("standard").nullish(),
  aiTokenBudget: z.number().int().nullish(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;


// File: Member.schema.ts

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export type MemberType = z.infer<typeof MemberSchema>;


// File: Invitation.schema.ts

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullish(),
  status: z.string(),
  expiresAt: z.date(),
  inviterId: z.string(),
  createdAt: z.date(),
});

export type InvitationType = z.infer<typeof InvitationSchema>;


// File: ProcessArchitecture.schema.ts

export const ProcessArchitectureSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectPlan: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProcessArchitectureType = z.infer<typeof ProcessArchitectureSchema>;


// File: ProcessDefinition.schema.ts

export const ProcessDefinitionSchema = z.object({
  id: z.string(),
  architectureId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  level: ProcessLevelSchema.default("PROCESS"),
  parentId: z.string().nullish(),
  owner: z.string().nullish(),
  goals: z.array(z.string()),
  triggers: z.array(z.string()),
  outputs: z.array(z.string()),
  processStatus: z.string().default("DRAFT"),
  category: z.string().nullish(),
  bpmnXml: z.string().nullish(),
  priority: z.number().int(),
  createdAt: z.date(),
});

export type ProcessDefinitionType = z.infer<typeof ProcessDefinitionSchema>;


// File: MeetingSession.schema.ts

export const MeetingSessionSchema = z.object({
  id: z.string(),
  type: SessionTypeSchema,
  status: SessionStatusSchema.default("SCHEDULED"),
  meetingUrl: z.string().nullish(),
  organizationId: z.string(),
  processDefinitionId: z.string().nullish(),
  userId: z.string(),
  continuationOf: z.string().nullish(),
  recallBotId: z.string().nullish(),
  recallBotStatus: z.string().nullish(),
  scheduledFor: z.date().nullish(),
  scheduledEnd: z.date().nullish(),
  sessionGoals: z.string().nullish(),
  sessionContext: z.string().nullish(),
  intakeToken: z.string().nullish(),
  intakeStatus: z.string().default("pending").nullish(),
  startedAt: z.date().nullish(),
  endedAt: z.date().nullish(),
  bpmnXml: z.string().nullish(),
  videoUrl: z.string().nullish(),
  audioUrl: z.string().nullish(),
  shareToken: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MeetingSessionType = z.infer<typeof MeetingSessionSchema>;


// File: DiagramNode.schema.ts

export const DiagramNodeSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  nodeType: NodeTypeSchema,
  label: z.string(),
  state: NodeStateSchema.default("FORMING"),
  lane: z.string().nullish(),
  confidence: z.number().nullish(),
  positionX: z.number(),
  positionY: z.number(),
  connections: z.array(z.string()),
  formedAt: z.date(),
  confirmedAt: z.date().nullish(),
  rejectedAt: z.date().nullish(),
  parentId: z.string().nullish(),
  properties: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DiagramNodeType = z.infer<typeof DiagramNodeSchema>;


// File: NodeComment.schema.ts

export const NodeCommentSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  sourceType: z.string().nullish(),
  sourceSnippet: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NodeCommentType = z.infer<typeof NodeCommentSchema>;


// File: TranscriptEntry.schema.ts

export const TranscriptEntrySchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  speaker: z.string(),
  text: z.string(),
  correctedText: z.string().nullish(),
  timestamp: z.number(),
  confidence: z.number().nullish(),
  source: z.string().default("deepgram"),
  createdAt: z.date(),
});

export type TranscriptEntryType = z.infer<typeof TranscriptEntrySchema>;


// File: CorrectionLog.schema.ts

export const CorrectionLogSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  nodeId: z.string(),
  action: z.string(),
  oldState: z.string().nullish(),
  newState: z.string().nullish(),
  oldLabel: z.string().nullish(),
  newLabel: z.string().nullish(),
  createdAt: z.date(),
});

export type CorrectionLogType = z.infer<typeof CorrectionLogSchema>;


// File: TeleprompterLog.schema.ts

export const TeleprompterLogSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  question: z.string(),
  used: z.boolean(),
  skipped: z.boolean(),
  shownAt: z.date(),
  completenessScore: z.number().int().nullish(),
  gapType: z.string().nullish(),
  sipocCoverage: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
});

export type TeleprompterLogType = z.infer<typeof TeleprompterLogSchema>;


// File: SessionSummary.schema.ts

export const SessionSummarySchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  summary: z.string(),
  actionItems: z.array(z.string()),
  emailSentAt: z.date().nullish(),
  createdAt: z.date(),
});

export type SessionSummaryType = z.infer<typeof SessionSummarySchema>;


// File: SessionDeliverable.schema.ts

export const SessionDeliverableSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  type: z.string(),
  status: z.string().default("pending"),
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  error: z.string().nullish(),
  startedAt: z.date().nullish(),
  completedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionDeliverableType = z.infer<typeof SessionDeliverableSchema>;


// File: MeetingParticipant.schema.ts

export const MeetingParticipantSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  name: z.string(),
  email: z.string().nullish(),
  role: z.string().nullish(),
  participantType: z.string().nullish(),
  talkTimeMs: z.number().int(),
  joinedAt: z.date().nullish(),
  leftAt: z.date().nullish(),
  createdAt: z.date(),
});

export type MeetingParticipantType = z.infer<typeof MeetingParticipantSchema>;


// File: DiscoveryThread.schema.ts

export const DiscoveryThreadSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  processDefinitionId: z.string().nullish(),
  createdBy: z.string(),
  rejectedProcessNames: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DiscoveryThreadType = z.infer<typeof DiscoveryThreadSchema>;


// File: DiscoveryMessage.schema.ts

export const DiscoveryMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: z.string(),
  content: z.string(),
  audioFileUrl: z.string().nullish(),
  extractedProcesses: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
});

export type DiscoveryMessageType = z.infer<typeof DiscoveryMessageSchema>;


// File: RaciEntry.schema.ts

export const RaciEntrySchema = z.object({
  id: z.string(),
  processId: z.string(),
  activityName: z.string(),
  role: z.string(),
  assignment: RaciTypeSchema,
  source: z.string().nullish(),
  createdAt: z.date(),
});

export type RaciEntryType = z.infer<typeof RaciEntrySchema>;


// File: StakeholderConflict.schema.ts

export const StakeholderConflictSchema = z.object({
  id: z.string(),
  processId: z.string(),
  nodeLabel: z.string(),
  conflictType: z.string(),
  perspectives: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  resolved: z.boolean(),
  resolution: z.string().nullish(),
  createdAt: z.date(),
});

export type StakeholderConflictType = z.infer<typeof StakeholderConflictSchema>;


// File: ProcessIntelligence.schema.ts

export const ProcessIntelligenceSchema = z.object({
  id: z.string(),
  processDefinitionId: z.string(),
  knowledgeSnapshot: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{}"),
  confidenceScores: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{}"),
  completenessScore: z.number().int(),
  shareToken: z.string().nullish(),
  shareExpiresAt: z.date().nullish(),
  riskShareToken: z.string().nullish(),
  riskShareExpiresAt: z.date().nullish(),
  version: z.number().int(),
  lastAuditAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProcessIntelligenceType = z.infer<typeof ProcessIntelligenceSchema>;


// File: IntelligenceItem.schema.ts

export const IntelligenceItemSchema = z.object({
  id: z.string(),
  intelligenceId: z.string(),
  category: IntelligenceItemCategorySchema,
  question: z.string(),
  context: z.string().nullish(),
  priority: z.number().int().default(50),
  dependsOn: z.array(z.string()),
  status: IntelligenceItemStatusSchema.default("OPEN"),
  resolution: z.string().nullish(),
  resolvedAt: z.date().nullish(),
  resolvedBy: z.string().nullish(),
  sourceType: z.string(),
  sourceId: z.string().nullish(),
  elementRef: z.string().nullish(),
  insightType: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type IntelligenceItemType = z.infer<typeof IntelligenceItemSchema>;


// File: IntelligenceAuditLog.schema.ts

export const IntelligenceAuditLogSchema = z.object({
  id: z.string(),
  intelligenceId: z.string(),
  triggerType: z.string(),
  triggerId: z.string().nullish(),
  delta: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  completenessScore: z.number().int(),
  inputTokens: z.number().int().nullish(),
  outputTokens: z.number().int().nullish(),
  createdAt: z.date(),
});

export type IntelligenceAuditLogType = z.infer<typeof IntelligenceAuditLogSchema>;


// File: ProcessRisk.schema.ts

export const ProcessRiskSchema = z.object({
  id: z.string(),
  processDefinitionId: z.string(),
  title: z.string(),
  description: z.string(),
  riskType: RiskTypeSchema,
  status: RiskStatusSchema.default("IDENTIFIED"),
  source: RiskSourceSchema,
  severity: z.number().int().default(3),
  probability: z.number().int().default(3),
  riskScore: z.number().int().default(9),
  residualSeverity: z.number().int().nullish(),
  residualProbability: z.number().int().nullish(),
  residualScore: z.number().int().nullish(),
  affectedStep: z.string().nullish(),
  affectedRole: z.string().nullish(),
  relatedItemId: z.string().nullish(),
  isOpportunity: z.boolean(),
  opportunityValue: z.string().nullish(),
  failureMode: z.string().nullish(),
  failureEffect: z.string().nullish(),
  detectionDifficulty: z.number().int().nullish(),
  rpn: z.number().int().nullish(),
  shareVisible: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProcessRiskType = z.infer<typeof ProcessRiskSchema>;


// File: RiskMitigation.schema.ts

export const RiskMitigationSchema = z.object({
  id: z.string(),
  riskId: z.string(),
  action: z.string(),
  owner: z.string().nullish(),
  deadline: z.date().nullish(),
  status: MitigationStatusSchema.default("PLANNED"),
  notes: z.string().nullish(),
  completedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RiskMitigationType = z.infer<typeof RiskMitigationSchema>;


// File: RiskControl.schema.ts

export const RiskControlSchema = z.object({
  id: z.string(),
  riskId: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  controlType: ControlTypeSchema,
  effectiveness: ControlEffectivenessSchema.default("UNKNOWN"),
  automated: z.boolean(),
  system: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type RiskControlType = z.infer<typeof RiskControlSchema>;


// File: RiskAuditLog.schema.ts

export const RiskAuditLogSchema = z.object({
  id: z.string(),
  riskId: z.string(),
  action: z.string(),
  delta: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  userId: z.string().nullish(),
  createdAt: z.date(),
});

export type RiskAuditLogType = z.infer<typeof RiskAuditLogSchema>;


// File: ProcessTemplate.schema.ts

export const ProcessTemplateSchema = z.object({
  id: z.string(),
  framework: z.string(),
  industry: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  structure: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  createdAt: z.date(),
});

export type ProcessTemplateType = z.infer<typeof ProcessTemplateSchema>;


// File: ProcessVersion.schema.ts

export const ProcessVersionSchema = z.object({
  id: z.string(),
  processDefinitionId: z.string(),
  version: z.number().int(),
  name: z.string(),
  description: z.string().nullish(),
  bpmnXml: z.string().nullish(),
  goals: z.array(z.string()),
  triggers: z.array(z.string()),
  outputs: z.array(z.string()),
  changeNote: z.string().nullish(),
  createdBy: z.string(),
  createdAt: z.date(),
});

export type ProcessVersionType = z.infer<typeof ProcessVersionSchema>;


// File: ArchitectureVersion.schema.ts

export const ArchitectureVersionSchema = z.object({
  id: z.string(),
  architectureId: z.string(),
  version: z.number().int(),
  snapshot: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  changeNote: z.string().nullish(),
  createdBy: z.string(),
  createdAt: z.date(),
});

export type ArchitectureVersionType = z.infer<typeof ArchitectureVersionSchema>;


// File: Document.schema.ts

export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  mimeType: z.string(),
  filePath: z.string(),
  fileSize: z.number().int(),
  organizationId: z.string(),
  processDefinitionId: z.string().nullish(),
  extractedText: z.string().nullish(),
  isProcessed: z.boolean(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DocumentType = z.infer<typeof DocumentSchema>;


// File: DocumentVersion.schema.ts

export const DocumentVersionSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  version: z.number().int(),
  filePath: z.string(),
  fileSize: z.number().int(),
  changeNote: z.string().nullish(),
  createdBy: z.string(),
  createdAt: z.date(),
});

export type DocumentVersionType = z.infer<typeof DocumentVersionSchema>;


// File: ToolLead.schema.ts

export const ToolLeadSchema = z.object({
  id: z.string(),
  email: z.string(),
  toolUsed: z.string(),
  outputData: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  ipAddress: z.string().nullish(),
  source: z.string().default("tool"),
  nurture1At: z.date().nullish(),
  nurture2At: z.date().nullish(),
  createdAt: z.date(),
});

export type ToolLeadType = z.infer<typeof ToolLeadSchema>;


// File: CompanyBrain.schema.ts

export const CompanyBrainSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  lastEnrichedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyBrainType = z.infer<typeof CompanyBrainSchema>;


// File: OrgContext.schema.ts

export const OrgContextSchema = z.object({
  id: z.string(),
  companyBrainId: z.string(),
  mission: z.string().nullish(),
  missionConfidence: z.number().nullish(),
  missionSources: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  vision: z.string().nullish(),
  visionConfidence: z.number().nullish(),
  visionSources: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  values: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  valuesConfidence: z.number().nullish(),
  valuesSources: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  industrySector: z.string().nullish(),
  industrySubsector: z.string().nullish(),
  companySize: z.string().nullish(),
  geography: z.string().nullish(),
  orgStructure: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  businessModel: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrgContextType = z.infer<typeof OrgContextSchema>;


// File: ValueChainActivity.schema.ts

export const ValueChainActivitySchema = z.object({
  id: z.string(),
  companyBrainId: z.string(),
  name: z.string(),
  type: ValueChainTypeSchema,
  description: z.string().nullish(),
  orderIndex: z.number().int(),
  linkedProcessIds: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ValueChainActivityType = z.infer<typeof ValueChainActivitySchema>;


// File: ProcessLink.schema.ts

export const ProcessLinkSchema = z.object({
  id: z.string(),
  companyBrainId: z.string(),
  fromProcessId: z.string(),
  toProcessId: z.string(),
  linkType: ProcessLinkTypeSchema,
  description: z.string().nullish(),
  confidence: z.number().default(0.5),
  source: z.string().default("ai"),
  createdAt: z.date(),
});

export type ProcessLinkModel = z.infer<typeof ProcessLinkSchema>;

// File: GlobalRole.schema.ts

export const GlobalRoleSchema = z.object({
  id: z.string(),
  companyBrainId: z.string(),
  name: z.string(),
  department: z.string().nullish(),
  title: z.string().nullish(),
  appearsInProcessIds: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GlobalRoleType = z.infer<typeof GlobalRoleSchema>;


// File: GlobalSystem.schema.ts

export const GlobalSystemSchema = z.object({
  id: z.string(),
  companyBrainId: z.string(),
  name: z.string(),
  vendor: z.string().nullish(),
  description: z.string().nullish(),
  usedInProcessIds: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GlobalSystemType = z.infer<typeof GlobalSystemSchema>;


// File: EnrichmentHistory.schema.ts

export const EnrichmentHistorySchema = z.object({
  id: z.string(),
  companyBrainId: z.string(),
  sourceType: EnrichmentSourceTypeSchema,
  sourceId: z.string(),
  field: z.string(),
  oldValue: z.string().nullish(),
  newValue: z.string().nullish(),
  confidence: z.number().nullish(),
  action: z.string().default("update"),
  createdAt: z.date(),
});

export type EnrichmentHistoryType = z.infer<typeof EnrichmentHistorySchema>;


// File: OrgDeliverable.schema.ts

export const OrgDeliverableSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  type: z.string(),
  status: z.string().default("pending"),
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  error: z.string().nullish(),
  confidence: z.number().nullish(),
  processDefinitionId: z.string().nullish(),
  startedAt: z.date().nullish(),
  completedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrgDeliverableType = z.infer<typeof OrgDeliverableSchema>;


// File: ClientIntakeResponse.schema.ts

export const ClientIntakeResponseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  questionKey: z.string(),
  questionText: z.string(),
  response: z.string().nullish(),
  respondedAt: z.date().nullish(),
  createdAt: z.date(),
});

export type ClientIntakeResponseType = z.infer<typeof ClientIntakeResponseSchema>;


// File: Purchase.schema.ts

export const PurchaseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  type: PurchaseTypeSchema,
  customerId: z.string(),
  subscriptionId: z.string().nullish(),
  priceId: z.string(),
  status: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseModel = z.infer<typeof PurchaseSchema>;

// File: AiUsageLog.schema.ts

export const AiUsageLogSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  pipeline: z.string(),
  model: z.string(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  durationMs: z.number().int().nullish(),
  success: z.boolean().default(true),
  error: z.string().nullish(),
  metadata: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
});

export type AiUsageLogType = z.infer<typeof AiUsageLogSchema>;

