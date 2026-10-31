export type Language = 'en' | 'hi' | 'hinglish' | 'te' | 'ta' | 'kn';

export type PolicyVerdict = 'ALLOW' | 'ASK_OWNER' | 'BLOCK';

export type CaseStatus = 
  | 'FLAGGED'            // Initial failure ingested
  | 'CONTACTED'          // Allowed by policy, payment link sent
  | 'WAITING_APPROVAL'   // Flagged for owner review
  | 'BLOCKED'            // Halted by policy (opt-out, dispute, cap)
  | 'RECOVERED';         // Confirmed by simulator status check

export type EvidenceStep = 'Signal' | 'Diagnosis' | 'Plan' | 'Policy' | 'Action' | 'Verify';

export interface EvidenceLogEntry {
  id: string;
  timestamp: string;
  step: EvidenceStep;
  title: string;
  detail: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface OptionWeighed {
  option: string;
  chosen: boolean;
  reason: string;
}

export interface AiProposal {
  cause: string;
  confidence: number;
  action: 'SEND_PAYMENT_LINK' | 'WAIT_BANK_RECOVERY' | 'ASK_MERCHANT' | 'DO_NOTHING';
  language: Language;
  reasoning: string;
  isAiGenerated?: boolean;
}

export interface PolicyResult {
  verdict: PolicyVerdict;
  reason: string;
  ruleTriggered: string;
  timestamp: string;
}

export interface CustomerHistory {
  onTimeCount: number;
  failedCount: number;
  totalSpentPaise: number;
}

export interface PaymentLink {
  linkId: string;
  url: string;
  orderId: string;
  amountPaise: number;
  createdAt: string;
}

export interface PaymentCase {
  id: string;
  customerName: string;
  phone: string;
  amountPaise: number; // Stored in integer paise (e.g. 234000 = ₹2,340)
  language: Language;
  bank: string;
  failureMessage: string;
  failureTimestamp: string;
  remindersSent: number;
  isOptedOut: boolean;
  isDispute: boolean;
  isLoyalHighValue: boolean;
  customerHistory: CustomerHistory;
  bankOutageDetected: boolean;
  
  // AI Step
  aiProposal: AiProposal;
  
  // Policy Step
  policyResult: PolicyResult;
  optionsWeighed: OptionWeighed[];
  
  // Execution & Status
  status: CaseStatus;
  paymentLink: PaymentLink | null;
  outboundSent: boolean;
  idempotencyKeys: string[];
  evidenceLog: EvidenceLogEntry[];
  
  // Action state
  ownerApprovedAt?: string;
  ownerSkippedAt?: string;
  recoveredAt?: string;
  simulatedApiError?: boolean;
  amountMismatchFlag?: boolean;
  paidAmountPaise?: number;
  webhookReplaysCount?: number;
}

export interface StoreSettings {
  shopName: string;
  ownerLimitPaise: number; // e.g. 500000 = ₹5,000
  maxReminders: number;    // default 2
  minConfidence: number;   // default 0.70
  uiLanguage: Language;
  simulateGlobalPaytmError: boolean;
}

export interface MetricSummary {
  flaggedCount: number;
  contactedCount: number;
  recoveredCount: number;
  waitingApprovalCount: number;
  blockedCount: number;
  rupeesRecoveredPaise: number;
  duplicateOutboundCount: number;
  policyBreachesCount: number;
  totalOutreachAttempts: number;
}
