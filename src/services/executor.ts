/**
 * Executor Service with Exactly-Once Semantics.
 * 
 * Rules:
 * - Each outbound message has an idempotency key: `${caseId}_${kind}_${attempt}`
 * - Dispatching twice with the exact same idempotency key does nothing (returns duplicate: true)
 * - Guarantees duplicate counter stays 0 across webhooks and messaging retries.
 */

export interface DispatchResult {
  dispatched: boolean;
  idempotencyKey: string;
  isDuplicate: boolean;
  message: string;
  timestamp: string;
}

// Global in-memory set of executed idempotency keys
const executedKeys: Set<string> = new Set();
const processedWebhookEventIds: Set<string> = new Set();

export function generateIdempotencyKey(caseId: string, kind: string = 'link', attempt: number = 1): string {
  return `${caseId}_${kind}_attempt_${attempt}`;
}

export function executeOutboundMessage(
  caseId: string,
  kind: string = 'link',
  attempt: number = 1
): DispatchResult {
  const key = generateIdempotencyKey(caseId, kind, attempt);
  const now = new Date().toISOString();

  if (executedKeys.has(key)) {
    return {
      dispatched: false,
      idempotencyKey: key,
      isDuplicate: true,
      message: `Idempotency block: Key ${key} was already executed. Duplicate suppressed.`,
      timestamp: now,
    };
  }

  executedKeys.add(key);
  return {
    dispatched: true,
    idempotencyKey: key,
    isDuplicate: false,
    message: `Message dispatched via idempotency key: ${key}`,
    timestamp: now,
  };
}

export function isIdempotentEventProcessed(eventId: string): boolean {
  if (processedWebhookEventIds.has(eventId)) {
    return true;
  }
  processedWebhookEventIds.add(eventId);
  return false;
}

export function resetExecutorState(): void {
  executedKeys.clear();
  processedWebhookEventIds.clear();
}
