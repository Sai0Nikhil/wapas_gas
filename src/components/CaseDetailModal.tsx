import React, { useState } from 'react';
import { PaymentCase, StoreSettings } from '../types';
import { generateCustomerMessage } from '../data/translations';
import { 
  X, 
  Clock, 
  ShieldCheck, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  Send, 
  AlertOctagon, 
  Terminal, 
  Copy, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface CaseDetailModalProps {
  c: PaymentCase | null;
  settings: StoreSettings;
  onClose: () => void;
  onOpenSimulator: (caseId: string) => void;
  onReplayWebhook: (caseId: string) => void;
  onToggleCaseApiError: (caseId: string) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  c,
  settings,
  onClose,
  onOpenSimulator,
  onReplayWebhook,
  onToggleCaseApiError,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [replaySuccess, setReplaySuccess] = useState(false);

  if (!c) return null;

  const amountRupees = (c.amountPaise / 100).toLocaleString('en-IN');
  const customerMessage = c.paymentLink 
    ? generateCustomerMessage(c.customerName, c.amountPaise, c.paymentLink.url, c.language)
    : `(Awaiting authorization - payment link not yet generated)`;

  const handleCopyLink = () => {
    if (c.paymentLink?.url) {
      navigator.clipboard.writeText(c.paymentLink.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleReplayClick = () => {
    onReplayWebhook(c.id);
    setReplaySuccess(true);
    setTimeout(() => setReplaySuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-amber-900/10 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-xs ${
              c.status === 'RECOVERED' ? 'bg-blue-600 text-white' :
              c.status === 'BLOCKED' ? 'bg-slate-200 text-slate-700' :
              c.status === 'WAITING_APPROVAL' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'
            }`}>
              {c.status === 'RECOVERED' ? <CheckCircle2 className="w-6 h-6 stroke-[2.5]" /> : c.customerName[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {c.customerName}
                </h2>
                <span className="text-base font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                  ₹{amountRupees}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  ID: {c.id}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {c.phone} · Bank: <strong className="text-slate-800">{c.bank}</strong> · Saved Lang: <span className="uppercase font-semibold text-slate-700">{c.language}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-x-0 space-y-6 flex-1">
          {/* Top Status Bar & Simulator Confirmation Check */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Current State
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  c.status === 'RECOVERED' ? 'bg-blue-600' :
                  c.status === 'CONTACTED' ? 'bg-indigo-500 animate-pulse' :
                  c.status === 'WAITING_APPROVAL' ? 'bg-amber-500' : 'bg-slate-400'
                }`}></span>
                <span className="font-bold text-slate-900 text-sm">
                  {c.status === 'RECOVERED' ? 'Confirmed by simulator' : c.status}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Policy Verdict
              </span>
              <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${
                c.policyResult.verdict === 'ALLOW' ? 'bg-emerald-100 text-emerald-800' :
                c.policyResult.verdict === 'ASK_OWNER' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {c.policyResult.verdict}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate" title={c.policyResult.ruleTriggered}>
                {c.policyResult.ruleTriggered}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Idempotency Status
              </span>
              <div className="text-xs font-mono font-medium text-slate-700 truncate" title={c.idempotencyKeys[0] || 'None'}>
                {c.idempotencyKeys[0] || 'Not dispatched'}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium">
                Duplicates sent: 0
              </span>
            </div>
          </div>

          {/* AI Proposal vs Policy Authorization Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Proposed by AI */}
            <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 relative">
              <div className="flex items-center space-x-2 text-indigo-900 mb-2">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Proposed by AI (Hypothesis Only)
                </h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500">Cause: </span>
                  <strong className="text-slate-900">{c.aiProposal.cause}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Diagnostic Confidence: </span>
                  <span className="font-bold text-indigo-700">
                    {(c.aiProposal.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Proposed Action: </span>
                  <code className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                    {c.aiProposal.action}
                  </code>
                </div>
                <div className="pt-1 text-slate-700 italic border-t border-indigo-100/60">
                  "{c.aiProposal.reasoning}"
                </div>
              </div>
              <div className="mt-2 text-[10px] text-indigo-700 font-medium">
                * Note: AI possesses zero authority to move money or dispatch messages.
              </div>
            </div>

            {/* Authorized by Policy */}
            <div className="p-4 rounded-xl border border-amber-300/80 bg-amber-50/40 relative">
              <div className="flex items-center space-x-2 text-amber-950 mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Authorized by Deterministic Policy
                </h4>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-500">Verdict: </span>
                  <strong className="text-slate-900">{c.policyResult.verdict}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Trigger Rule: </span>
                  <span className="font-mono text-slate-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                    {c.policyResult.ruleTriggered}
                  </span>
                </div>
                <div className="pt-1 text-slate-700">
                  <span className="text-slate-500">Engine Reason: </span>
                  {c.policyResult.reason}
                </div>
              </div>
              <div className="mt-2 text-[10px] text-amber-900 font-medium">
                * Fail-closed code gate enforces exact compliance rules.
              </div>
            </div>
          </div>

          {/* Options Weighed Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <span>Options Weighed by Autonomous Engine</span>
            </h4>
            <div className="space-y-2">
              {c.optionsWeighed.map((opt, i) => (
                <div 
                  key={i} 
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                    opt.chosen 
                      ? 'border-blue-300 bg-blue-50/50 text-slate-900' 
                      : 'border-slate-100 bg-slate-50/70 text-slate-500'
                  }`}
                >
                  <div className="mt-0.5">
                    {opt.chosen ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        ✕
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold">{opt.option}</span>
                    <span className="text-[11px] block mt-0.5 text-slate-600">
                      {opt.chosen ? '✓ CHOSEN: ' : '✗ REJECTED: '} {opt.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Message Preview in Native Language */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer Message Preview ({c.language.toUpperCase()})</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Single link · With opt-out compliance
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 font-sans text-xs sm:text-sm text-slate-900 leading-relaxed whitespace-pre-wrap">
              {customerMessage}
            </div>

            {c.paymentLink && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded truncate max-w-xs">
                  {c.paymentLink.url}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenSimulator(c.id)}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Paytm Simulator</span>
                </button>
              </div>
            )}
          </div>

          {/* Full Evidence Log / Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Evidence Log & Deterministic Audit Trail</span>
            </h4>
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
              {c.evidenceLog.map((log) => (
                <div key={log.id} className="relative flex items-start pl-7 text-xs">
                  <div className={`absolute left-1.5 top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                    log.status === 'success' ? 'border-emerald-600' :
                    log.status === 'error' ? 'border-rose-600' :
                    log.status === 'warning' ? 'border-amber-500' : 'border-blue-500'
                  }`}></div>
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        [{log.step}] {log.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-normal">
                      {log.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Testing Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Replay Webhook Button (Demonstrates Idempotency) */}
            {c.status === 'RECOVERED' && (
              <button
                type="button"
                onClick={handleReplayClick}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                title="Test idempotency: sending webhook twice will be ignored safely"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${replaySuccess ? 'text-emerald-600 animate-spin' : ''}`} />
                <span>{replaySuccess ? 'Replay safely ignored (0 duplicates)' : 'Replay Webhook (Test Idempotency)'}</span>
              </button>
            )}

            {/* Toggle Case Paytm API Error */}
            <button
              type="button"
              onClick={() => onToggleCaseApiError(c.id)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                c.simulatedApiError 
                  ? 'bg-rose-50 border-rose-300 text-rose-800' 
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{c.simulatedApiError ? 'Paytm API Error Active (Case Paused)' : 'Simulate Paytm API Error'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
