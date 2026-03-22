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

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId'])

export type OrganizationScalarFieldEnum = z.infer<typeof OrganizationScalarFieldEnumSchema>;

// File: MemberScalarFieldEnum.schema.ts

export const MemberScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'role', 'createdAt'])

export type MemberScalarFieldEnum = z.infer<typeof MemberScalarFieldEnumSchema>;

// File: InvitationScalarFieldEnum.schema.ts

export const InvitationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'email', 'role', 'status', 'expiresAt', 'inviterId', 'createdAt'])

export type InvitationScalarFieldEnum = z.infer<typeof InvitationScalarFieldEnumSchema>;

// File: ClientScalarFieldEnum.schema.ts

export const ClientScalarFieldEnumSchema = z.enum(['id', 'name', 'organizationId', 'createdAt', 'updatedAt'])

export type ClientScalarFieldEnum = z.infer<typeof ClientScalarFieldEnumSchema>;

// File: ProjectScalarFieldEnum.schema.ts

export const ProjectScalarFieldEnumSchema = z.enum(['id', 'name', 'clientId', 'createdAt', 'updatedAt'])

export type ProjectScalarFieldEnum = z.infer<typeof ProjectScalarFieldEnumSchema>;

// File: ProcessArchitectureScalarFieldEnum.schema.ts

export const ProcessArchitectureScalarFieldEnumSchema = z.enum(['id', 'projectId', 'createdAt', 'updatedAt'])

export type ProcessArchitectureScalarFieldEnum = z.infer<typeof ProcessArchitectureScalarFieldEnumSchema>;

// File: ProcessDefinitionScalarFieldEnum.schema.ts

export const ProcessDefinitionScalarFieldEnumSchema = z.enum(['id', 'architectureId', 'name', 'description', 'priority', 'createdAt'])

export type ProcessDefinitionScalarFieldEnum = z.infer<typeof ProcessDefinitionScalarFieldEnumSchema>;

// File: MeetingSessionScalarFieldEnum.schema.ts

export const MeetingSessionScalarFieldEnumSchema = z.enum(['id', 'type', 'status', 'meetingUrl', 'projectId', 'processDefinitionId', 'userId', 'recallBotId', 'recallBotStatus', 'startedAt', 'endedAt', 'bpmnXml', 'shareToken', 'createdAt', 'updatedAt'])

export type MeetingSessionScalarFieldEnum = z.infer<typeof MeetingSessionScalarFieldEnumSchema>;

// File: DiagramNodeScalarFieldEnum.schema.ts

export const DiagramNodeScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'nodeType', 'label', 'state', 'lane', 'positionX', 'positionY', 'connections', 'formedAt', 'confirmedAt', 'rejectedAt', 'parentId', 'createdAt', 'updatedAt'])

export type DiagramNodeScalarFieldEnum = z.infer<typeof DiagramNodeScalarFieldEnumSchema>;

// File: TranscriptEntryScalarFieldEnum.schema.ts

export const TranscriptEntryScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'speaker', 'text', 'timestamp', 'confidence', 'createdAt'])

export type TranscriptEntryScalarFieldEnum = z.infer<typeof TranscriptEntryScalarFieldEnumSchema>;

// File: CorrectionLogScalarFieldEnum.schema.ts

export const CorrectionLogScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'nodeId', 'action', 'oldState', 'newState', 'oldLabel', 'newLabel', 'createdAt'])

export type CorrectionLogScalarFieldEnum = z.infer<typeof CorrectionLogScalarFieldEnumSchema>;

// File: TeleprompterLogScalarFieldEnum.schema.ts

export const TeleprompterLogScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'question', 'used', 'skipped', 'shownAt'])

export type TeleprompterLogScalarFieldEnum = z.infer<typeof TeleprompterLogScalarFieldEnumSchema>;

// File: SessionSummaryScalarFieldEnum.schema.ts

export const SessionSummaryScalarFieldEnumSchema = z.enum(['id', 'sessionId', 'summary', 'actionItems', 'emailSentAt', 'createdAt'])

export type SessionSummaryScalarFieldEnum = z.infer<typeof SessionSummaryScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'customerId', 'subscriptionId', 'priceId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: SessionType.schema.ts

export const SessionTypeSchema = z.enum(['DISCOVERY', 'DEEP_DIVE'])

export type SessionType = z.infer<typeof SessionTypeSchema>;

// File: SessionStatus.schema.ts

export const SessionStatusSchema = z.enum(['SCHEDULED', 'CONNECTING', 'ACTIVE', 'ENDED', 'FAILED'])

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

// File: NodeType.schema.ts

export const NodeTypeSchema = z.enum(['START_EVENT', 'END_EVENT', 'TASK', 'EXCLUSIVE_GATEWAY', 'PARALLEL_GATEWAY'])

export type NodeType = z.infer<typeof NodeTypeSchema>;

// File: NodeState.schema.ts

export const NodeStateSchema = z.enum(['FORMING', 'CONFIRMED', 'REJECTED', 'ARCHIVED'])

export type NodeState = z.infer<typeof NodeStateSchema>;

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


// File: Client.schema.ts

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  organizationId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClientType = z.infer<typeof ClientSchema>;


// File: Project.schema.ts

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  clientId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectType = z.infer<typeof ProjectSchema>;


// File: ProcessArchitecture.schema.ts

export const ProcessArchitectureSchema = z.object({
  id: z.string(),
  projectId: z.string(),
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
  priority: z.number().int(),
  createdAt: z.date(),
});

export type ProcessDefinitionType = z.infer<typeof ProcessDefinitionSchema>;


// File: MeetingSession.schema.ts

export const MeetingSessionSchema = z.object({
  id: z.string(),
  type: SessionTypeSchema,
  status: SessionStatusSchema.default("SCHEDULED"),
  meetingUrl: z.string(),
  projectId: z.string(),
  processDefinitionId: z.string().nullish(),
  userId: z.string(),
  recallBotId: z.string().nullish(),
  recallBotStatus: z.string().nullish(),
  startedAt: z.date().nullish(),
  endedAt: z.date().nullish(),
  bpmnXml: z.string().nullish(),
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
  positionX: z.number(),
  positionY: z.number(),
  connections: z.array(z.string()),
  formedAt: z.date(),
  confirmedAt: z.date().nullish(),
  rejectedAt: z.date().nullish(),
  parentId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DiagramNodeType = z.infer<typeof DiagramNodeSchema>;


// File: TranscriptEntry.schema.ts

export const TranscriptEntrySchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  speaker: z.string(),
  text: z.string(),
  timestamp: z.number(),
  confidence: z.number().nullish(),
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
