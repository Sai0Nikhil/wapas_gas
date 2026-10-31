import React, { useState } from 'react';
import { PaymentCase, Language } from '../types';
import { UI_STRINGS } from '../data/translations';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, ShieldCheck, IndianRupee, Edit3 } from 'lucide-react';

interface OwnerApprovalCardProps {
  pendingCases: PaymentCase[];
  onApprove: (caseId: string, customAmountPaise?: number) => void;
  onSkip: (caseId: string) => void;
  onViewDetails: (caseId: string) => void;
  uiLanguage: Language;
}

export const OwnerApprovalCard: React.FC<OwnerApprovalCardProps> = ({
  pendingCases,
  onApprove,
  onSkip,
  onViewDetails,
  uiLanguage,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingAmount, setEditingAmount] = useState<string | null>(null);

  if (!pendingCases || pendingCases.length === 0) {
    return null;
  }

  // Ensure current index is within bounds
  const validIndex = Math.min(currentIndex, pendingCases.length - 1);
  const currentCase = pendingCases[validIndex];
  const ui = UI_STRINGS[uiLanguage] || UI_STRINGS.hinglish;

  const handleApprove = () => {
    if (isProcessing) return; // One-time action guarantee
    setIsProcessing(true);

    const customPaise = editingAmount ? Math.round(parseFloat(editingAmount) * 100) : undefined;
    onApprove(currentCase.id, customPaise);
    setEditingAmount(null);

    // Reset processing state after animation
    setTimeout(() => {
      setIsProcessing(false);
      if (validIndex >= pendingCases.length - 1) {
        setCurrentIndex(0);
      }
    }, 300);
  };

  const handleSkip = () => {
    if (isProcessing) return; // One-time action guarantee
    setIsProcessing(true);

    onSkip(currentCase.id);
    setEditingAmount(null);

    setTimeout(() => {
      setIsProcessing(false);
      if (validIndex >= pendingCases.length - 1) {
        setCurrentIndex(0);
      }
    }, 300);
  };

  const amountRupees = (currentCase.amountPaise / 100).toLocaleString('en-IN');

  return (
    <div className="w-full bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm transition-all mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Indicator & Case info */}
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                {ui.needsApproval} · {validIndex + 1} of {pendingCases.length}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {currentCase.id}
              </span>
            </div>
            
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {currentCase.customerName}
              </h3>
              <span className="text-base font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                ₹{amountRupees}
              </span>
              <span className="text-xs text-slate-600">
                ({currentCase.bank})
              </span>
            </div>

            <p className="mt-1 text-xs sm:text-sm text-amber-950 font-medium">
              <span className="font-semibold text-amber-900">Escalation Trigger: </span>
              {currentCase.policyResult.reason}
            </p>

            <p className="mt-0.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Proposed Plan: </span>
              Send single recovery link via WhatsApp in {currentCase.language.toUpperCase()}. Customer paid on-time {currentCase.customerHistory.onTimeCount}x previously.
            </p>

            {editingAmount !== null && (
              <div className="mt-2.5 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-300 w-fit">
                <IndianRupee className="w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={editingAmount}
                  onChange={(e) => setEditingAmount(e.target.value)}
                  className="w-28 text-sm font-semibold outline-hidden"
                  placeholder="New amount"
                />
                <button
                  type="button"
                  onClick={() => setEditingAmount(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 md:self-center">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onViewDetails(currentCase.id)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1.5"
          >
            Inspect Evidence
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setEditingAmount(editingAmount === null ? (currentCase.amountPaise / 100).toString() : null)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm transition-colors flex items-center gap-1"
            title="Edit recovery amount"
          >
            <Edit3 className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">{ui.edit}</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleSkip}
            className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>{ui.skip}</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleApprove}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{ui.approve}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
