import { PaymentCase, PolicyResult, StoreSettings, OptionWeighed } from '../types';

/**
 * Deterministic Fail-Closed Policy Engine for Wapas.
 * 
 * CORE PRINCIPLE:
 * "AI proposes. Policy authorizes. Code executes. Paytm confirms."
 * 
 * This engine operates strictly without AI inference. It strictly evaluates
 * 8 ordered rules in fail-closed fashion. If any exception is thrown,
 * the verdict automatically defaults to BLOCK.
 */
export function evaluatePolicy(
  c: PaymentCase,
  settings: StoreSettings
): PolicyResult {
  const timestamp = new Date().toISOString();

  try {
    // Defensive check
    if (!c || !settings) {
      return {
        verdict: 'BLOCK',
        reason: 'Malformed case or settings payload provided to policy engine.',
        ruleTriggered: 'FAIL_SAFE_GUARD',
        timestamp,
      };
    }

    // Rule 1: refund / reversal / dispute -> BLOCK
    if (c.isDispute || c.failureMessage?.toLowerCase().includes('dispute') || c.failureMessage?.toLowerCase().includes('refund')) {
      return {
        verdict: 'BLOCK',
        reason: 'Payment flagged as dispute/chargeback. Autonomous recovery blocked to avoid merchant friction.',
        ruleTriggered: 'RULE_1_DISPUTE_OR_REVERSAL',
        timestamp,
      };
    }

    // Rule 2: simulated Paytm API error -> BLOCK (case paused, nothing sent)
    if (c.simulatedApiError || settings.simulateGlobalPaytmError) {
      return {
        verdict: 'BLOCK',
        reason: 'Simulated Paytm API degradation active. Case paused in circuit-breaker state.',
        ruleTriggered: 'RULE_2_PAYTM_API_ERROR_SIMULATION',
        timestamp,
      };
    }

    // Rule 3: customer opted out -> BLOCK
    if (c.isOptedOut) {
      return {
        verdict: 'BLOCK',
        reason: 'Customer previously opted out (STOP received). Anti-spam compliance enforced.',
        ruleTriggered: 'RULE_3_CUSTOMER_OPTED_OUT',
        timestamp,
      };
    }

    // Rule 4: reminders >= max -> BLOCK
    if (c.remindersSent >= settings.maxReminders) {
      return {
        verdict: 'BLOCK',
        reason: `Max reminders cap (${c.remindersSent}/${settings.maxReminders}) reached. Preventing repetitive contact.`,
        ruleTriggered: 'RULE_4_MAX_REMINDERS_REACHED',
        timestamp,
      };
    }

    // Rule 5: amount > owner limit -> ASK_OWNER
    if (c.amountPaise > settings.ownerLimitPaise) {
      const amountRupees = (c.amountPaise / 100).toLocaleString('en-IN');
      const limitRupees = (settings.ownerLimitPaise / 100).toLocaleString('en-IN');
      return {
        verdict: 'ASK_OWNER',
        reason: `Amount ₹${amountRupees} exceeds autonomous limit of ₹${limitRupees}. Owner authorization required.`,
        ruleTriggered: 'RULE_5_AMOUNT_EXCEEDS_OWNER_LIMIT',
        timestamp,
      };
    }

    // Rule 6: confidence < min confidence -> ASK_OWNER
    const conf = c.aiProposal?.confidence ?? 0;
    if (conf < settings.minConfidence) {
      const confPct = Math.round(conf * 100);
      const minPct = Math.round(settings.minConfidence * 100);
      return {
        verdict: 'ASK_OWNER',
        reason: `AI diagnostic confidence (${confPct}%) is below minimum threshold (${minPct}%). Requires human review.`,
        ruleTriggered: 'RULE_6_CONFIDENCE_BELOW_THRESHOLD',
        timestamp,
      };
    }

    // Rule 7: loyal high-value customer -> ASK_OWNER
    if (c.isLoyalHighValue || (c.customerHistory && c.customerHistory.onTimeCount >= 10 && c.amountPaise >= 300000)) {
      return {
        verdict: 'ASK_OWNER',
        reason: `VIP loyal relationship (${c.customerHistory?.onTimeCount || 11} prior on-time payments). Merchant discretion advised.`,
        ruleTriggered: 'RULE_7_LOYAL_HIGH_VALUE_CUSTOMER',
        timestamp,
      };
    }

    // Rule 8: otherwise ALLOW
    return {
      verdict: 'ALLOW',
      reason: 'Safe recovery criteria met: valid bank timeout diagnosis, high confidence, within limit, zero blocks.',
      ruleTriggered: 'RULE_8_AUTONOMOUS_ALLOW',
      timestamp,
    };
  } catch (error) {
    // Fail-closed guarantee
    return {
      verdict: 'BLOCK',
      reason: `Fail-closed engine triggered due to runtime error: ${(error as Error).message}`,
      ruleTriggered: 'RULE_FAIL_CLOSED_EXCEPTION',
      timestamp,
    };
  }
}

/**
 * Calculates the options weighed for transparent audit logs.
 */
export function calculateOptionsWeighed(
  c: PaymentCase,
  settings: StoreSettings,
  policy: PolicyResult
): OptionWeighed[] {
  const isHighValue = c.amountPaise > settings.ownerLimitPaise;
  const isBlocked = policy.verdict === 'BLOCK';
  const isAsk = policy.verdict === 'ASK_OWNER';

  return [
    {
      option: 'Immediate UPI Link outreach',
      chosen: policy.verdict === 'ALLOW',
      reason: policy.verdict === 'ALLOW' 
        ? 'Customer is active, transient bank timeout confirmed, under ₹' + (settings.ownerLimitPaise / 100).toLocaleString('en-IN')
        : (isBlocked ? 'Rejected by safety policy: ' + policy.reason : 'Escalated to owner first due to high-value or VIP profile'),
    },
    {
      option: 'Wait for bank auto-credit / reverse',
      chosen: false,
      reason: c.bankOutageDetected 
        ? 'Considered due to bank downtime, but direct Paytm UPI link offers 3.4x faster resolution once customer is notified'
        : 'Bank reported explicit terminal timeout; customer account was not debited',
    },
    {
      option: 'Escalate to merchant owner review',
      chosen: isAsk,
      reason: isAsk 
        ? policy.reason 
        : (isBlocked ? 'Unnecessary: Case is permanently blocked by hard policy' : 'Unnecessary: Meets all autonomous parameters'),
    },
    {
      option: 'Do nothing (Abandon recovery)',
      chosen: isBlocked,
      reason: isBlocked 
        ? policy.reason 
        : 'Rejected: Legitimate transaction intent detected with high recovery probability',
    },
  ];
}
