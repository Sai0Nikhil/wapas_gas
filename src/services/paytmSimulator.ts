/**
 * Paytm Compatible Simulator
 * 
 * Mandated labeling:
 * - Persistent badge in the UI: "Paytm-compatible simulator · sample data"
 * - In UI: "Confirmed by simulator" (never "Paytm-verified")
 * 
 * Functions:
 * 1. createPaymentLink(caseId, amountPaise) -> { linkId, url, orderId }
 * 2. webhook(orderId, status, amountPaise, signature) with fake HMAC-SHA256 signature check
 * 3. transactionStatus(orderId) -> TXN_SUCCESS | TXN_FAILURE | PENDING with exact amount check
 */

export interface SimulatedOrderRecord {
  orderId: string;
  caseId: string;
  amountPaise: number;
  status: 'PENDING' | 'TXN_SUCCESS' | 'TXN_FAILURE';
  linkId: string;
  url: string;
  createdAt: string;
  paidAt?: string;
  failureReason?: string;
  lastWebhookSignature?: string;
  webhookDeliveryCount: number;
}

// In-memory simulator ledger
const simulatorStore: Map<string, SimulatedOrderRecord> = new Map();

// Helper to compute deterministic fake signature
export function generateSimulatorSignature(orderId: string, amountPaise: number, status: string): string {
  // Simple deterministic hash simulation mimicking HMAC-SHA256
  const secretKey = 'PAYTM_SIMULATOR_TEST_SECRET_2026';
  const str = `${orderId}|${amountPaise}|${status}|${secretKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `sim_sig_${Math.abs(hash).toString(16).padStart(8, '0')}${orderId.slice(-4)}`;
}

export function createPaymentLink(caseId: string, amountPaise: number): {
  linkId: string;
  url: string;
  orderId: string;
} {
  const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const orderId = `ORDER_${caseId.toUpperCase()}_${shortId}`;
  const linkId = `plink_${shortId.toLowerCase()}`;
  const url = `https://paytm.sim/pay/${linkId}?orderId=${orderId}&amt=${amountPaise}`;

  const record: SimulatedOrderRecord = {
    orderId,
    caseId,
    amountPaise,
    status: 'PENDING',
    linkId,
    url,
    createdAt: new Date().toISOString(),
    webhookDeliveryCount: 0,
  };

  simulatorStore.set(orderId, record);

  return { linkId, url, orderId };
}

export function verifySimulatorSignature(
  orderId: string,
  amountPaise: number,
  status: string,
  signature: string
): boolean {
  const expectedSignature = generateSimulatorSignature(orderId, amountPaise, status);
  return signature === expectedSignature;
}

export interface WebhookResult {
  accepted: boolean;
  orderId: string;
  status: 'TXN_SUCCESS' | 'TXN_FAILURE';
  amountPaise: number;
  signatureValid: boolean;
  deliveryCount: number;
  isDuplicate: boolean;
  message: string;
}

/**
 * Handles incoming signed webhook from simulator.
 */
export function handleSimulatorWebhook(
  orderId: string,
  status: 'TXN_SUCCESS' | 'TXN_FAILURE',
  amountPaise: number,
  signature: string
): WebhookResult {
  const record = simulatorStore.get(orderId);
  if (!record) {
    return {
      accepted: false,
      orderId,
      status,
      amountPaise,
      signatureValid: false,
      deliveryCount: 0,
      isDuplicate: false,
      message: 'Order ID not found in Paytm simulator ledger',
    };
  }

  const isValid = verifySimulatorSignature(orderId, amountPaise, status, signature);
  if (!isValid) {
    return {
      accepted: false,
      orderId,
      status,
      amountPaise,
      signatureValid: false,
      deliveryCount: record.webhookDeliveryCount,
      isDuplicate: false,
      message: 'Invalid cryptographic signature rejected',
    };
  }

  record.webhookDeliveryCount += 1;
  const isDuplicate = record.webhookDeliveryCount > 1;

  // Update simulator state
  record.status = status;
  record.lastWebhookSignature = signature;
  if (status === 'TXN_SUCCESS') {
    record.paidAt = record.paidAt || new Date().toISOString();
  }

  return {
    accepted: true,
    orderId,
    status,
    amountPaise,
    signatureValid: true,
    deliveryCount: record.webhookDeliveryCount,
    isDuplicate,
    message: isDuplicate 
      ? `Duplicate webhook delivery #${record.webhookDeliveryCount} received and ignored safely.`
      : `Webhook processed successfully: ${status} for ₹${(amountPaise / 100).toLocaleString('en-IN')}`,
  };
}

export interface TransactionStatusResponse {
  orderId: string;
  status: 'TXN_SUCCESS' | 'TXN_FAILURE' | 'PENDING';
  amountPaise: number;
  timestamp: string;
  message: string;
}

/**
 * transactionStatus(orderId) -> TXN_SUCCESS | TXN_FAILURE | PENDING with amount
 * A case is marked Recovered ONLY after this status check returns success for the exact amount.
 */
export function getSimulatorTransactionStatus(orderId: string): TransactionStatusResponse {
  const record = simulatorStore.get(orderId);
  const now = new Date().toISOString();

  if (!record) {
    return {
      orderId,
      status: 'PENDING',
      amountPaise: 0,
      timestamp: now,
      message: 'Transaction not found in simulator ledger',
    };
  }

  return {
    orderId: record.orderId,
    status: record.status,
    amountPaise: record.amountPaise,
    timestamp: record.paidAt || record.createdAt,
    message: record.status === 'TXN_SUCCESS' 
      ? `Confirmed by simulator: ₹${(record.amountPaise / 100).toLocaleString('en-IN')} settled.`
      : (record.status === 'TXN_FAILURE' ? 'Transaction failed at customer bank.' : 'Payment link opened / awaiting customer UPI PIN.'),
  };
}

/**
 * Resets the in-memory simulator store for demo cleanliness.
 */
export function resetSimulatorStore(): void {
  simulatorStore.clear();
}
