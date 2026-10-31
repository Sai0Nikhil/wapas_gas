import { PaymentCase, StoreSettings } from '../types';
import { evaluatePolicy, calculateOptionsWeighed } from '../services/policyEngine';
import { createPaymentLink } from '../services/paytmSimulator';
import { executeOutboundMessage } from '../services/executor';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  shopName: 'Sharma Electronics',
  ownerLimitPaise: 500000, // ₹5,000 (5,000 * 100 paise)
  maxReminders: 2,
  minConfidence: 0.70,
  uiLanguage: 'hinglish',
  simulateGlobalPaytmError: false,
};

interface SeedItem {
  id: string;
  name: string;
  phone: string;
  amountPaise: number;
  lang: 'hi' | 'kn' | 'ta' | 'te' | 'en' | 'hinglish';
  bank: string;
  failureMessage: string;
  confidence: number;
  reasoning: string;
  isOptedOut?: boolean;
  isDispute?: boolean;
  isLoyalHighValue?: boolean;
  onTimeCount?: number;
  failedCount?: number;
  remindersSent?: number;
  bankOutageDetected?: boolean;
}

const RAW_SEEDS: SeedItem[] = [
  // 9 Auto-Allowed Cases
  {
    id: 'case_01',
    name: 'Rahul',
    phone: '+91 98765 43210',
    amountPaise: 234000, // ₹2,340
    lang: 'hi',
    bank: 'State Bank of India',
    failureMessage: 'U16: Risk threshold timeout at issuing switch',
    confidence: 0.92,
    reasoning: 'Transient SBI switch timeout detected during peak UPI hours; account not debited.',
    onTimeCount: 4,
    failedCount: 0,
    remindersSent: 0,
  },
  {
    id: 'case_02',
    name: 'Manjunath',
    phone: '+91 98450 11223',
    amountPaise: 178000, // ₹1,780
    lang: 'kn',
    bank: 'Canara Bank',
    failureMessage: 'BT: Bank network timed out waiting for PSP acknowledgement',
    confidence: 0.89,
    reasoning: 'Canara Bank gateway dropped handshake; safe to re-initiate single recovery link.',
    onTimeCount: 3,
    failedCount: 0,
    remindersSent: 0,
  },
  {
    id: 'case_03',
    name: 'Karthik',
    phone: '+91 94440 98765',
    amountPaise: 125000, // ₹1,250
    lang: 'ta',
    bank: 'Indian Overseas Bank',
    failureMessage: 'ZM: Invalid response format from remitter bank switch',
    confidence: 0.88,
    reasoning: 'IOB switch intermittent packet drop; customer intent remains active.',
    onTimeCount: 2,
    failedCount: 0,
    remindersSent: 0,
  },
  {
    id: 'case_04',
    name: 'Lakshmi',
    phone: '+91 98660 55443',
    amountPaise: 86000, // ₹860
    lang: 'te',
    bank: 'Andhra Bank / Union Bank',
    failureMessage: 'XB: NPCI UPI system busy error during settlement',
    confidence: 0.94,
    reasoning: 'NPCI load balancer shedding traffic during UPI peak; immediate retry link recommended.',
    onTimeCount: 6,
    failedCount: 0,
    remindersSent: 0,
  },
  {
    id: 'case_05',
    name: 'Anil',
    phone: '+91 98110 33221',
    amountPaise: 64000, // ₹640
    lang: 'en',
    bank: 'HDFC Bank',
    failureMessage: 'U30: Gateway unresponsive within SLA timeout (15000ms)',
    confidence: 0.91,
    reasoning: 'HDFC gateway timed out at terminal checkout; micro-amount recovery safe.',
    onTimeCount: 5,
    failedCount: 0,
    remindersSent: 0,
  },
  {
    id: 'case_06',
    name: 'Farah',
    phone: '+91 99200 44889',
    amountPaise: 320000, // ₹3,200
    lang: 'hinglish',
    bank: 'ICICI Bank',
    failureMessage: 'UT: Internal timeout in remitter bank core banking system',
    confidence: 0.85,
    reasoning: 'ICICI core banking response lag; under ₹5,000 store threshold.',
    onTimeCount: 7,
    failedCount: 1,
    remindersSent: 0,
  },
  {
    id: 'case_07',
    name: 'Suresh',
    phone: '+91 99490 66778',
    amountPaise: 150000, // ₹1,500
    lang: 'te',
    bank: 'Axis Bank',
    failureMessage: 'U69: Advising bank connection timed out',
    confidence: 0.87,
    reasoning: 'Axis Bank advising queue exceeded SLA; zero debit confirmation received.',
    onTimeCount: 3,
    failedCount: 0,
    remindersSent: 0,
  },
  {
    id: 'case_08',
    name: 'Meena',
    phone: '+91 98840 22334',
    amountPaise: 210000, // ₹2,100
    lang: 'ta',
    bank: 'Bank of Baroda',
    failureMessage: 'BT: Core switch socket disconnected prematurely',
    confidence: 0.90,
    reasoning: 'BoB socket reset during UPI authorization; high likelihood of rapid conversion.',
    onTimeCount: 4,
    failedCount: 0,
    remindersSent: 0,
  },
  {
    id: 'case_09',
    name: 'Imran',
    phone: '+91 97110 88990',
    amountPaise: 98000, // ₹980
    lang: 'hi',
    bank: 'Punjab National Bank',
    failureMessage: 'U16: Switch timeout on UPI-1.0 channel',
    confidence: 0.93,
    reasoning: 'PNB UPI-1.0 channel packet timeout; low ticket size with high recovery likelihood.',
    onTimeCount: 5,
    failedCount: 0,
    remindersSent: 0,
  },

  // 2 Ask-Owner Cases
  {
    id: 'case_10',
    name: 'Priya Traders',
    phone: '+91 98201 99887',
    amountPaise: 840000, // ₹8,400 (above ₹5,000 limit, failed twice, 11 on-time payments)
    lang: 'hi',
    bank: 'HDFC Bank',
    failureMessage: 'U16: High-volume merchant transaction timeout',
    confidence: 0.91,
    reasoning: 'Large business ticket above autonomous limit; highly valuable client relationship.',
    isLoyalHighValue: true,
    onTimeCount: 11,
    failedCount: 2,
    remindersSent: 0,
  },
  {
    id: 'case_11',
    name: 'Venkat',
    phone: '+91 98402 77665',
    amountPaise: 420000, // ₹4,200 (confidence 0.55, unclear cause)
    lang: 'en',
    bank: 'Kotak Mahindra Bank',
    failureMessage: 'E09: Cryptic upstream switch condition returned without sub-code',
    confidence: 0.55,
    reasoning: 'Unclear error code from bank; confidence (55%) below 70% safety minimum.',
    onTimeCount: 2,
    failedCount: 1,
    remindersSent: 0,
  },

  // 3 Blocked Cases
  {
    id: 'case_12',
    name: 'Rajesh',
    phone: '+91 98101 23456',
    amountPaise: 110000, // ₹1,100 (Opted out)
    lang: 'hi',
    bank: 'State Bank of India',
    failureMessage: 'BT: Transient bank timeout',
    confidence: 0.90,
    reasoning: 'Customer previously sent STOP; anti-harassment policy blocks automated outreach.',
    isOptedOut: true,
    onTimeCount: 2,
    failedCount: 0,
    remindersSent: 0,
  },
  {
    id: 'case_13',
    name: 'Sunita',
    phone: '+91 98711 55667',
    amountPaise: 250000, // ₹2,500 (Dispute case)
    lang: 'en',
    bank: 'ICICI Bank',
    failureMessage: 'U72: Transaction flagged under chargeback / customer dispute claim',
    confidence: 0.95,
    reasoning: 'Active dispute on order; automated recovery strictly disallowed to protect merchant.',
    isDispute: true,
    onTimeCount: 1,
    failedCount: 1,
    remindersSent: 0,
  },
  {
    id: 'case_14',
    name: 'Vikram',
    phone: '+91 98212 34567',
    amountPaise: 190000, // ₹1,900 (already at 2 reminders)
    lang: 'hinglish',
    bank: 'Axis Bank',
    failureMessage: 'BT: Remitter bank switch timeout',
    confidence: 0.88,
    reasoning: 'Maximum reminders cap (2) already delivered; blocking further outreach.',
    remindersSent: 2,
    onTimeCount: 3,
    failedCount: 2,
  },
];

/**
 * Initializes the full dataset of 14 cases, running each through the deterministic
 * policy engine and generating simulated Paytm payment links for auto-allowed cases.
 */
export function generateSeedCases(settings: StoreSettings = DEFAULT_STORE_SETTINGS): PaymentCase[] {
  const baseTime = Date.now() - 42 * 60 * 1000; // 42 minutes ago

  return RAW_SEEDS.map((seed, idx) => {
    const caseTimestamp = new Date(baseTime + idx * 2.5 * 60 * 1000).toISOString();
    
    // Construct base case
    const baseCase: PaymentCase = {
      id: seed.id,
      customerName: seed.name,
      phone: seed.phone,
      amountPaise: seed.amountPaise,
      language: seed.lang,
      bank: seed.bank,
      failureMessage: seed.failureMessage,
      failureTimestamp: caseTimestamp,
      remindersSent: seed.remindersSent ?? 0,
      isOptedOut: !!seed.isOptedOut,
      isDispute: !!seed.isDispute,
      isLoyalHighValue: !!seed.isLoyalHighValue,
      customerHistory: {
        onTimeCount: seed.onTimeCount ?? 0,
        failedCount: seed.failedCount ?? 0,
        totalSpentPaise: (seed.onTimeCount ?? 0) * seed.amountPaise,
      },
      bankOutageDetected: !!seed.bankOutageDetected,
      
      aiProposal: {
        cause: seed.failureMessage.split(':')[0].trim(),
        confidence: seed.confidence,
        action: seed.confidence < 0.70 ? 'ASK_MERCHANT' : (seed.isDispute ? 'DO_NOTHING' : 'SEND_PAYMENT_LINK'),
        language: seed.lang,
        reasoning: seed.reasoning,
        isAiGenerated: false,
      },
      
      policyResult: {
        verdict: 'BLOCK',
        reason: 'Pending policy evaluation',
        ruleTriggered: 'INIT',
        timestamp: caseTimestamp,
      },
      optionsWeighed: [],
      status: 'FLAGGED',
      paymentLink: null,
      outboundSent: false,
      idempotencyKeys: [],
      evidenceLog: [
        {
          id: `ev_${seed.id}_1`,
          timestamp: caseTimestamp,
          step: 'Signal',
          title: `UPI Payment Failure Ingested`,
          detail: `Amount ₹${(seed.amountPaise / 100).toLocaleString('en-IN')} on ${seed.bank}. Raw gateway code: "${seed.failureMessage}".`,
          status: 'info',
        },
        {
          id: `ev_${seed.id}_2`,
          timestamp: new Date(new Date(caseTimestamp).getTime() + 1200).toISOString(),
          step: 'Diagnosis',
          title: `AI Proposes: ${seed.failureMessage.split(':')[0]}`,
          detail: `Confidence ${(seed.confidence * 100).toFixed(0)}%. ${seed.reasoning}`,
          status: seed.confidence >= 0.7 ? 'success' : 'warning',
        },
      ],
    };

    // Run deterministic policy engine
    const policy = evaluatePolicy(baseCase, settings);
    baseCase.policyResult = policy;
    baseCase.optionsWeighed = calculateOptionsWeighed(baseCase, settings, policy);

    const policyTime = new Date(new Date(caseTimestamp).getTime() + 2400).toISOString();
    baseCase.evidenceLog.push({
      id: `ev_${seed.id}_3`,
      timestamp: policyTime,
      step: 'Policy',
      title: `Policy Verdict: ${policy.verdict}`,
      detail: `${policy.reason} [${policy.ruleTriggered}]`,
      status: policy.verdict === 'ALLOW' ? 'success' : (policy.verdict === 'ASK_OWNER' ? 'warning' : 'error'),
    });

    // Execute state transition based on policy verdict
    if (policy.verdict === 'ALLOW') {
      // Auto-sent flow
      const link = createPaymentLink(baseCase.id, baseCase.amountPaise);
      baseCase.paymentLink = {
        linkId: link.linkId,
        url: link.url,
        orderId: link.orderId,
        amountPaise: baseCase.amountPaise,
        createdAt: policyTime,
      };

      const dispatch = executeOutboundMessage(baseCase.id, 'link', 1);
      baseCase.outboundSent = dispatch.dispatched;
      baseCase.idempotencyKeys.push(dispatch.idempotencyKey);
      baseCase.status = 'CONTACTED';

      const actionTime = new Date(new Date(caseTimestamp).getTime() + 3800).toISOString();
      baseCase.evidenceLog.push({
        id: `ev_${seed.id}_4`,
        timestamp: actionTime,
        step: 'Action',
        title: `Outbound WhatsApp Recovery Link Dispatched`,
        detail: `Sent in ${seed.lang.toUpperCase()} via idempotency key: ${dispatch.idempotencyKey}. Order: ${link.orderId}. Exactly-once guarantee active.`,
        status: 'success',
      });
    } else if (policy.verdict === 'ASK_OWNER') {
      baseCase.status = 'WAITING_APPROVAL';
      const planTime = new Date(new Date(caseTimestamp).getTime() + 2900).toISOString();
      baseCase.evidenceLog.push({
        id: `ev_${seed.id}_plan`,
        timestamp: planTime,
        step: 'Plan',
        title: `Escalated to Merchant Review Queue`,
        detail: `Autonomous dispatch halted. Reason: ${policy.reason}. Awaiting shop owner one-click authorization.`,
        status: 'warning',
      });
    } else {
      // BLOCK
      baseCase.status = 'BLOCKED';
      const blockTime = new Date(new Date(caseTimestamp).getTime() + 2900).toISOString();
      baseCase.evidenceLog.push({
        id: `ev_${seed.id}_plan`,
        timestamp: blockTime,
        step: 'Plan',
        title: `Outreach Permanently Halted by Policy`,
        detail: `Zero outbound messages permitted. Compliance rule triggered: ${policy.ruleTriggered}.`,
        status: 'error',
      });
    }

    return baseCase;
  });
}
