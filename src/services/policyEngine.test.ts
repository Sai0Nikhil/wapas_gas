import { evaluatePolicy } from './policyEngine';
import { PaymentCase, StoreSettings } from '../types';

export interface TestCaseResult {
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  reason: string;
}

const mockSettings: StoreSettings = {
  shopName: 'Sharma Electronics',
  ownerLimitPaise: 500000, // ₹5,000
  maxReminders: 2,
  minConfidence: 0.70,
  uiLanguage: 'en',
  simulateGlobalPaytmError: false,
};

function createMockCase(overrides: Partial<PaymentCase> = {}): PaymentCase {
  return {
    id: 'test_case_01',
    customerName: 'Test Customer',
    phone: '+91 99999 88888',
    amountPaise: 150000, // ₹1,500 (under 5000)
    language: 'en',
    bank: 'HDFC Bank',
    failureMessage: 'Transient bank timeout',
    failureTimestamp: new Date().toISOString(),
    remindersSent: 0,
    isOptedOut: false,
    isDispute: false,
    isLoyalHighValue: false,
    customerHistory: { onTimeCount: 3, failedCount: 0, totalSpentPaise: 450000 },
    bankOutageDetected: false,
    aiProposal: {
      cause: 'Bank switch timeout',
      confidence: 0.90,
      action: 'SEND_PAYMENT_LINK',
      language: 'en',
      reasoning: 'HDFC gateway response delay',
    },
    policyResult: { verdict: 'ALLOW', reason: '', ruleTriggered: '', timestamp: '' },
    optionsWeighed: [],
    status: 'FLAGGED',
    paymentLink: null,
    outboundSent: false,
    idempotencyKeys: [],
    evidenceLog: [],
    ...overrides,
  };
}

export function runPolicyEngineTests(): {
  allPassed: boolean;
  total: number;
  passedCount: number;
  results: TestCaseResult[];
} {
  const tests: { name: string; case: PaymentCase; settings?: StoreSettings; expected: string }[] = [
    {
      name: 'Rule 1: Payment dispute must immediately BLOCK',
      case: createMockCase({ isDispute: true }),
      expected: 'BLOCK',
    },
    {
      name: 'Rule 2: Simulated Paytm API error must BLOCK & pause case',
      case: createMockCase({ simulatedApiError: true }),
      expected: 'BLOCK',
    },
    {
      name: 'Rule 3: Opted-out customer (STOP sent) must BLOCK',
      case: createMockCase({ isOptedOut: true }),
      expected: 'BLOCK',
    },
    {
      name: 'Rule 4: Reminders reached maximum cap (2/2) must BLOCK',
      case: createMockCase({ remindersSent: 2 }),
      expected: 'BLOCK',
    },
    {
      name: 'Rule 5: Amount > owner limit (₹8,400 > ₹5,000) must ASK_OWNER',
      case: createMockCase({ amountPaise: 840000 }),
      expected: 'ASK_OWNER',
    },
    {
      name: 'Rule 6: Low AI diagnostic confidence (0.55 < 0.70) must ASK_OWNER',
      case: createMockCase({
        aiProposal: {
          cause: 'Unknown gateway code',
          confidence: 0.55,
          action: 'ASK_MERCHANT',
          language: 'en',
          reasoning: 'Ambiguous bank status code',
        },
      }),
      expected: 'ASK_OWNER',
    },
    {
      name: 'Rule 7: Loyal high-value repeat customer must ASK_OWNER',
      case: createMockCase({
        isLoyalHighValue: true,
        customerHistory: { onTimeCount: 11, failedCount: 2, totalSpentPaise: 9240000 },
      }),
      expected: 'ASK_OWNER',
    },
    {
      name: 'Rule 8: Standard eligible bank timeout payment must ALLOW',
      case: createMockCase({
        amountPaise: 234000, // ₹2,340
        aiProposal: {
          cause: 'Bank timeout',
          confidence: 0.92,
          action: 'SEND_PAYMENT_LINK',
          language: 'hi',
          reasoning: 'Transient SBI timeout',
        },
      }),
      expected: 'ALLOW',
    },
    {
      name: 'Fail-Closed: Null case or invalid payload must default to BLOCK',
      case: null as any,
      expected: 'BLOCK',
    },
  ];

  const results: TestCaseResult[] = tests.map((t) => {
    const verdictResult = evaluatePolicy(t.case, t.settings || mockSettings);
    const passed = verdictResult.verdict === t.expected;
    return {
      name: t.name,
      expected: t.expected,
      actual: verdictResult.verdict,
      passed,
      reason: verdictResult.reason,
    };
  });

  const passedCount = results.filter((r) => r.passed).length;

  return {
    allPassed: passedCount === results.length,
    total: results.length,
    passedCount,
    results,
  };
}
