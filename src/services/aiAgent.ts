import { AiProposal, Language } from '../types';

/**
 * Isolated AI Diagnostic Agent module.
 * 
 * CORE PRINCIPLE:
 * "AI proposes. Policy authorizes. Code executes. Paytm confirms."
 * 
 * The AI generates a hypothesis and proposal ONLY. It has ZERO authority
 * to send messages, move money, or mark cases recovered.
 * 
 * Easily swappable for Sarvam-105B or other providers.
 */

export interface CaseDiagnosisContext {
  customerName: string;
  amountRupees: number;
  bank: string;
  failureMessage: string;
  bankOutageDetected: boolean;
  customerHistory: {
    onTimeCount: number;
    failedCount: number;
  };
  preferredLanguage: Language;
}

// Fallback deterministic proposal in case of API failure or offline mode
export function getDeterministicFallbackProposal(ctx: CaseDiagnosisContext): AiProposal {
  const isTimeout = ctx.failureMessage.toLowerCase().includes('timeout') || 
                    ctx.failureMessage.toLowerCase().includes('connectivity') ||
                    ctx.failureMessage.toLowerCase().includes('switch');
  
  const isCustomerError = ctx.failureMessage.toLowerCase().includes('pin') || 
                          ctx.failureMessage.toLowerCase().includes('limit') ||
                          ctx.failureMessage.toLowerCase().includes('insufficient');

  let cause = 'Transient bank switch timeout';
  let confidence = 0.91;
  let action: AiProposal['action'] = 'SEND_PAYMENT_LINK';
  let reasoning = `${ctx.bank} experienced an inter-bank UPI switch timeout; transaction aborted before customer account debit.`;

  if (ctx.failureMessage.toLowerCase().includes('dispute')) {
    cause = 'Customer initiated chargeback / dispute';
    confidence = 0.99;
    action = 'DO_NOTHING';
    reasoning = 'Payment is flagged under active banking dispute; automated collection disallowed.';
  } else if (ctx.bankOutageDetected) {
    cause = `Active NPCI/PSP outage at ${ctx.bank}`;
    confidence = 0.88;
    action = 'SEND_PAYMENT_LINK';
    reasoning = `${ctx.bank} UPI server is recovering after a clustered node outage; retry via alternative UPI VPA link recommended.`;
  } else if (isCustomerError) {
    cause = 'Customer UPI auth/limit error';
    confidence = 0.82;
    action = 'SEND_PAYMENT_LINK';
    reasoning = 'UPI authorization failed at bank gateway; sending fresh payment link enables instant one-tap completion.';
  } else if (!isTimeout) {
    cause = 'Unclear network transmission error';
    confidence = 0.55;
    action = 'ASK_MERCHANT';
    reasoning = 'Ambiguous error code received from issuing bank; recommend merchant verification before customer contact.';
  }

  return {
    cause,
    confidence,
    action,
    language: ctx.preferredLanguage,
    reasoning,
    isAiGenerated: false,
  };
}

/**
 * Diagnoses a failed payment case. Calls Gemini API when available,
 * retries once on schema error, and falls back gracefully.
 */
export async function diagnoseFailedPayment(
  ctx: CaseDiagnosisContext,
  apiKey?: string
): Promise<AiProposal> {
  // If no Gemini key is injected or in client demo environment, use verified deterministic proposal
  const activeKey = apiKey || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
  
  if (!activeKey) {
    return getDeterministicFallbackProposal(ctx);
  }

  const prompt = `You are Wapas AI, an autonomous payment recovery teammate for Indian merchants.
Analyze this failed UPI transaction and output strict JSON matching the schema:
{
  "cause": "string - concise technical cause (e.g. Bank timeout, NPCI switch delay, Unclear network error)",
  "confidence": number between 0.0 and 1.0,
  "action": "SEND_PAYMENT_LINK" | "WAIT_BANK_RECOVERY" | "ASK_MERCHANT" | "DO_NOTHING",
  "language": "${ctx.preferredLanguage}",
  "reasoning": "string - exactly one crisp sentence explaining the diagnostic rationale"
}

Context:
- Customer: ${ctx.customerName}
- Amount: ₹${ctx.amountRupees}
- Issuing Bank: ${ctx.bank}
- Gateway Raw Failure: "${ctx.failureMessage}"
- Cluster Bank Outage Active: ${ctx.bankOutageDetected ? "YES (multiple users affected)" : "NO"}
- Prior History: ${ctx.customerHistory.onTimeCount} on-time payments, ${ctx.customerHistory.failedCount} failures.
- Preferred Language: ${ctx.preferredLanguage}

Remember: You only propose. A deterministic policy engine will authorize or block your proposal.`;

  // Attempt with one retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Dynamic import to prevent client bundle breakage if SDK not configured in browser
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.cause && typeof parsed.confidence === 'number' && parsed.reasoning) {
          return {
            cause: String(parsed.cause),
            confidence: Math.max(0.1, Math.min(1.0, parsed.confidence)),
            action: parsed.action || 'SEND_PAYMENT_LINK',
            language: ctx.preferredLanguage,
            reasoning: String(parsed.reasoning),
            isAiGenerated: true,
          };
        }
      }
    } catch (err) {
      if (attempt === 2) {
        console.warn('Gemini diagnosis fallback used after retry:', err);
      }
    }
  }

  return getDeterministicFallbackProposal(ctx);
}
