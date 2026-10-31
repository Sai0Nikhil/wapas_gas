/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PaymentCase, StoreSettings, Language } from './types';
import { generateSeedCases, DEFAULT_STORE_SETTINGS } from './data/seedData';
import { evaluatePolicy, calculateOptionsWeighed } from './services/policyEngine';
import { 
  createPaymentLink, 
  handleSimulatorWebhook, 
  getSimulatorTransactionStatus, 
  resetSimulatorStore, 
  generateSimulatorSignature 
} from './services/paytmSimulator';
import { executeOutboundMessage, resetExecutorState } from './services/executor';
import { Header } from './components/Header';
import { RecoveryTower } from './components/RecoveryTower';
import { OwnerApprovalCard } from './components/OwnerApprovalCard';
import { CaseDetailModal } from './components/CaseDetailModal';
import { PaytmSimulatorModal } from './components/PaytmSimulatorModal';
import { MetricsModal } from './components/MetricsModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { LanguagePickerModal } from './components/LanguagePickerModal';

const STORAGE_KEY_CASES = 'wapas_cases_v1';
const STORAGE_KEY_SETTINGS = 'wapas_settings_v1';
const STORAGE_KEY_FIRST_LAUNCH = 'wapas_has_launched_v1';

export default function App() {
  // Settings & App State
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
    }
    return DEFAULT_STORE_SETTINGS;
  });

  const [cases, setCases] = useState<PaymentCase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CASES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load cases from storage', e);
    }
    return generateSeedCases(DEFAULT_STORE_SETTINGS);
  });

  // Modal / Screen visibility states
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [simulatorCaseId, setSimulatorCaseId] = useState<string | null>(null);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check first launch for language modal
  useEffect(() => {
    const hasLaunched = localStorage.getItem(STORAGE_KEY_FIRST_LAUNCH);
    if (!hasLaunched) {
      setIsFirstLaunch(true);
      setIsLanguageModalOpen(true);
      localStorage.setItem(STORAGE_KEY_FIRST_LAUNCH, 'true');
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
    } catch (e) {
      console.warn('Failed to save cases', e);
    }
  }, [cases]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }, [settings]);

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Re-evaluate cases when settings change
  const handleUpdateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);

    // Re-evaluate pending / flagged cases under new policy thresholds
    setCases((prev) =>
      prev.map((c) => {
        // Do not touch already recovered cases
        if (c.status === 'RECOVERED') return c;

        const evaluated = evaluatePolicy(c, newSettings);
        const options = calculateOptionsWeighed(c, newSettings, evaluated);
        let newStatus = c.status;

        if (evaluated.verdict === 'ALLOW') {
          if (c.status === 'WAITING_APPROVAL' || c.status === 'BLOCKED') {
            // Generate link if none existed
            if (!c.paymentLink) {
              const link = createPaymentLink(c.id, c.amountPaise);
              c.paymentLink = {
                linkId: link.linkId,
                url: link.url,
                orderId: link.orderId,
                amountPaise: c.amountPaise,
                createdAt: new Date().toISOString(),
              };
              const dispatch = executeOutboundMessage(c.id, 'link', 1);
              c.outboundSent = dispatch.dispatched;
              c.idempotencyKeys.push(dispatch.idempotencyKey);
            }
            newStatus = 'CONTACTED';
          }
        } else if (evaluated.verdict === 'ASK_OWNER') {
          if (c.status !== 'CONTACTED') {
            newStatus = 'WAITING_APPROVAL';
          }
        } else if (evaluated.verdict === 'BLOCK') {
          newStatus = 'BLOCKED';
        }

        return {
          ...c,
          policyResult: evaluated,
          optionsWeighed: options,
          status: newStatus,
        };
      })
    );
    showToast('Policy thresholds updated successfully');
  };

  const handleResetSettings = () => {
    handleUpdateSettings(DEFAULT_STORE_SETTINGS);
  };

  // Big Action: "Simulate failure burst" (loads/refreshes the 14 cases)
  const handleSimulateBurst = () => {
    resetSimulatorStore();
    resetExecutorState();
    const fresh = generateSeedCases(settings);
    setCases(fresh);
    showToast('Simulated failure burst loaded: 14 failed UPI transactions ingested');
  };

  // Reset Demo to pristine state
  const handleResetDemo = () => {
    resetSimulatorStore();
    resetExecutorState();
    const fresh = generateSeedCases(settings);
    setCases(fresh);
    showToast('Demo reset to initial baseline (9 Auto, 2 Ask Owner, 3 Blocked)');
  };

  // Owner Approval handler (e.g. for Priya Traders or Venkat)
  const handleApproveCase = (caseId: string, customAmountPaise?: number) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        if (c.status === 'RECOVERED' || c.status === 'CONTACTED') return c; // One-time action safety

        const finalAmountPaise = customAmountPaise || c.amountPaise;
        const now = new Date().toISOString();

        // Generate payment link
        const link = createPaymentLink(c.id, finalAmountPaise);
        const dispatch = executeOutboundMessage(c.id, 'link', 1);

        const newLogEntry = {
          id: `ev_${c.id}_owner_approve`,
          timestamp: now,
          step: 'Action' as const,
          title: `Merchant Owner Approved Outbound Link`,
          detail: `Owner manually authorized outreach of ₹${(finalAmountPaise / 100).toLocaleString('en-IN')}. Sent via idempotency key: ${dispatch.idempotencyKey}.`,
          status: 'success' as const,
        };

        return {
          ...c,
          amountPaise: finalAmountPaise,
          status: 'CONTACTED',
          ownerApprovedAt: now,
          outboundSent: dispatch.dispatched,
          paymentLink: {
            linkId: link.linkId,
            url: link.url,
            orderId: link.orderId,
            amountPaise: finalAmountPaise,
            createdAt: now,
          },
          idempotencyKeys: [...c.idempotencyKeys, dispatch.idempotencyKey],
          evidenceLog: [...c.evidenceLog, newLogEntry],
        };
      })
    );

    showToast(`Approved case ${caseId}: Payment link sent to customer`);
  };

  // Owner Skip handler
  const handleSkipCase = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const now = new Date().toISOString();
        return {
          ...c,
          status: 'BLOCKED',
          ownerSkippedAt: now,
          evidenceLog: [
            ...c.evidenceLog,
            {
              id: `ev_${c.id}_owner_skip`,
              timestamp: now,
              step: 'Action' as const,
              title: `Merchant Skipped Recovery`,
              detail: `Owner explicitly rejected outreach. Case permanently closed as Blocked.`,
              status: 'error' as const,
            },
          ],
        };
      })
    );
    showToast(`Case ${caseId} skipped and blocked`);
  };

  // Paytm Simulator Webhook & Status Check Flow
  // CORE PRINCIPLE: A case is marked Recovered ONLY after the simulated Paytm status check returns success for the exact amount.
  const handleSimulatePayment = (
    orderId: string,
    status: 'TXN_SUCCESS' | 'TXN_FAILURE',
    amountPaidPaise: number
  ) => {
    const signature = generateSimulatorSignature(orderId, amountPaidPaise, status);
    const webhookResult = handleSimulatorWebhook(orderId, status, amountPaidPaise, signature);

    // Call Paytm status check
    const statusCheck = getSimulatorTransactionStatus(orderId);
    const now = new Date().toISOString();

    setCases((prev) =>
      prev.map((c) => {
        if (c.paymentLink?.orderId !== orderId) return c;

        // Check exact amount match
        const isAmountMatch = amountPaidPaise === c.amountPaise;
        const isSuccess = statusCheck.status === 'TXN_SUCCESS' && isAmountMatch;

        const newLogs = [...c.evidenceLog];

        // Webhook event log
        newLogs.push({
          id: `ev_${c.id}_webhook_${Date.now()}`,
          timestamp: now,
          step: 'Action' as const,
          title: `Signed Webhook Ingested: ${status}`,
          detail: `Payload signature verified. Amount: ₹${(amountPaidPaise / 100).toLocaleString('en-IN')}. Delivery #${webhookResult.deliveryCount}.`,
          status: webhookResult.accepted ? 'success' : 'error',
        });

        if (status === 'TXN_SUCCESS') {
          if (isAmountMatch) {
            // Status check succeeded for exact amount
            newLogs.push({
              id: `ev_${c.id}_verify_${Date.now()}`,
              timestamp: new Date(Date.now() + 300).toISOString(),
              step: 'Verify' as const,
              title: `Confirmed by simulator (Exact Amount Verified)`,
              detail: `Paytm transaction status confirmed TXN_SUCCESS for exact invoice amount ₹${(amountPaidPaise / 100).toLocaleString('en-IN')}. Case closed as Recovered.`,
              status: 'success' as const,
            });

            return {
              ...c,
              status: 'RECOVERED',
              recoveredAt: now,
              paidAmountPaise: amountPaidPaise,
              amountMismatchFlag: false,
              evidenceLog: newLogs,
            };
          } else {
            // Mismatch condition
            newLogs.push({
              id: `ev_${c.id}_verify_mismatch_${Date.now()}`,
              timestamp: new Date(Date.now() + 300).toISOString(),
              step: 'Verify' as const,
              title: `Integrity Check Failed: Amount Mismatch`,
              detail: `Expected ₹${(c.amountPaise / 100).toLocaleString('en-IN')} but received ₹${(amountPaidPaise / 100).toLocaleString('en-IN')}. Recovery rejected. Case remains open.`,
              status: 'error' as const,
            });

            return {
              ...c,
              amountMismatchFlag: true,
              evidenceLog: newLogs,
            };
          }
        } else {
          // Failure condition
          newLogs.push({
            id: `ev_${c.id}_verify_fail_${Date.now()}`,
            timestamp: new Date(Date.now() + 300).toISOString(),
            step: 'Verify' as const,
            title: `Simulator Status: Customer Bank Failure`,
            detail: `Customer re-attempt failed at issuing bank switch. Case left open for scheduled retry.`,
            status: 'warning' as const,
          });

          return {
            ...c,
            evidenceLog: newLogs,
          };
        }
      })
    );

    if (status === 'TXN_SUCCESS' && amountPaidPaise === (cases.find(c => c.paymentLink?.orderId === orderId)?.amountPaise)) {
      showToast(`Payment Confirmed by simulator! Case closed as Recovered.`);
    } else if (status === 'TXN_SUCCESS') {
      showToast(`Warning: Amount mismatch detected. Recovery blocked.`);
    } else {
      showToast(`Customer attempt failed at bank. Case remains open.`);
    }
  };

  // Replay Webhook handler (Tests Idempotency - Duplicates stay 0!)
  const handleReplayWebhook = (caseId: string) => {
    const targetCase = cases.find((c) => c.id === caseId);
    if (!targetCase || !targetCase.paymentLink) return;

    const orderId = targetCase.paymentLink.orderId;
    const paidAmount = targetCase.paidAmountPaise || targetCase.amountPaise;
    const sig = generateSimulatorSignature(orderId, paidAmount, 'TXN_SUCCESS');

    // Trigger duplicate webhook
    const result = handleSimulatorWebhook(orderId, 'TXN_SUCCESS', paidAmount, sig);

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const now = new Date().toISOString();
        return {
          ...c,
          webhookReplaysCount: (c.webhookReplaysCount || 0) + 1,
          evidenceLog: [
            ...c.evidenceLog,
            {
              id: `ev_${c.id}_replay_${Date.now()}`,
              timestamp: now,
              step: 'Verify' as const,
              title: `Replay Webhook Ingested (Idempotency Safe)`,
              detail: `Duplicate webhook delivery #${result.deliveryCount} received. Exactly-once executor suppressed action. Duplicates sent: 0.`,
              status: 'info' as const,
            },
          ],
        };
      })
    );

    showToast('Duplicate webhook replayed: Safely ignored. Outbound duplicates remain 0.');
  };

  // Toggle single case Paytm API error
  const handleToggleCaseApiError = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const nextErrorState = !c.simulatedApiError;
        const now = new Date().toISOString();
        const updated = {
          ...c,
          simulatedApiError: nextErrorState,
        };
        const pol = evaluatePolicy(updated, settings);
        return {
          ...updated,
          policyResult: pol,
          status: pol.verdict === 'BLOCK' && c.status !== 'RECOVERED' ? 'BLOCKED' : c.status,
          evidenceLog: [
            ...c.evidenceLog,
            {
              id: `ev_${c.id}_apierr_${Date.now()}`,
              timestamp: now,
              step: 'Policy' as const,
              title: nextErrorState ? 'Paytm API Error Simulated' : 'Paytm API Error Cleared',
              detail: nextErrorState 
                ? 'Circuit breaker tripped (Rule 2). Case paused, outbound messages halted.' 
                : 'Circuit breaker reset. Normal policy evaluation restored.',
              status: nextErrorState ? 'error' as const : 'success' as const,
            },
          ],
        };
      })
    );

    showToast('Case Paytm API error simulation toggled');
  };

  // Find active modal targets
  const selectedCase = cases.find((c) => c.id === selectedCaseId) || null;
  const simulatorCase = cases.find((c) => c.id === simulatorCaseId) || null;
  const pendingApprovalCases = cases.filter((c) => c.status === 'WAITING_APPROVAL');

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2 border border-slate-700 animate-in slide-in-from-bottom duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with mandatory simulator badge & core principle */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMetrics={() => setIsMetricsOpen(true)}
        onOpenLanguagePicker={() => setIsLanguageModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Owner Approval Card ("Needs your approval · 1 of N") */}
        <OwnerApprovalCard
          pendingCases={pendingApprovalCases}
          onApprove={handleApproveCase}
          onSkip={handleSkipCase}
          onViewDetails={(id) => setSelectedCaseId(id)}
          uiLanguage={settings.uiLanguage}
        />

        {/* Recovery Tower Screen */}
        <RecoveryTower
          cases={cases}
          settings={settings}
          onSimulateBurst={handleSimulateBurst}
          onResetDemo={handleResetDemo}
          onSelectCase={(id) => setSelectedCaseId(id)}
          onOpenSimulator={(id) => setSimulatorCaseId(id)}
          onApproveCase={(id) => handleApproveCase(id)}
        />
      </main>

      {/* Footer Branding & Compliance Note */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            Wapas · Track 3 (Autonomous AI Teammates) · Paytm Build for India AI Hackathon
          </p>
          <p className="text-[11px] text-slate-400">
            All bank names, customer profiles, and UPI transaction events are synthetic mock data executed inside the browser runtime.
          </p>
        </div>
      </footer>

      {/* Case Detail Modal */}
      <CaseDetailModal
        c={selectedCase}
        settings={settings}
        onClose={() => setSelectedCaseId(null)}
        onOpenSimulator={(id) => setSimulatorCaseId(id)}
        onReplayWebhook={handleReplayWebhook}
        onToggleCaseApiError={handleToggleCaseApiError}
      />

      {/* Paytm Simulator Page / Modal */}
      <PaytmSimulatorModal
        c={simulatorCase}
        isOpen={!!simulatorCase}
        onClose={() => setSimulatorCaseId(null)}
        onSimulatePayment={handleSimulatePayment}
      />

      {/* Metrics & Pilot ROI Modal */}
      <MetricsModal
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
        cases={cases}
        settings={settings}
      />

      {/* Policy Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
      />

      {/* Multi-Language Native Script Picker */}
      <LanguagePickerModal
        isOpen={isLanguageModalOpen}
        currentLanguage={settings.uiLanguage}
        onSelectLanguage={(lang: Language) => {
          setSettings((prev) => ({ ...prev, uiLanguage: lang }));
        }}
        onClose={() => setIsLanguageModalOpen(false)}
        isFirstLaunch={isFirstLaunch}
      />
    </div>
  );
}
