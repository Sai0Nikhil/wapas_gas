import React, { useState } from 'react';
import { PaymentCase } from '../types';
import { generateSimulatorSignature } from '../services/paytmSimulator';
import { 
  X, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  QrCode, 
  Lock, 
  AlertTriangle,
  ArrowRight,
  Fingerprint,
  Building
} from 'lucide-react';

interface PaytmSimulatorModalProps {
  c: PaymentCase | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulatePayment: (orderId: string, status: 'TXN_SUCCESS' | 'TXN_FAILURE', amountPaise: number) => void;
}

export const PaytmSimulatorModal: React.FC<PaytmSimulatorModalProps> = ({
  c,
  isOpen,
  onClose,
  onSimulatePayment,
}) => {
  const [selectedUpiApp, setSelectedUpiApp] = useState<'paytm' | 'gpay' | 'phonepe'>('paytm');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTamperAmount, setCustomTamperAmount] = useState(false);

  if (!isOpen || !c || !c.paymentLink) return null;

  const orderId = c.paymentLink.orderId;
  const originalPaise = c.amountPaise;
  const paidPaise = customTamperAmount ? originalPaise - 10000 : originalPaise; // ₹100 less if tampered
  const displayRupees = (originalPaise / 100).toLocaleString('en-IN');
  const tamperedDisplayRupees = (paidPaise / 100).toLocaleString('en-IN');

  const signaturePreview = generateSimulatorSignature(orderId, paidPaise, 'TXN_SUCCESS');

  const handlePay = (status: 'TXN_SUCCESS' | 'TXN_FAILURE') => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSimulatePayment(orderId, status, paidPaise);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-slate-900 overflow-hidden relative my-auto">
        {/* Mock Smartphone Top Notch */}
        <div className="bg-slate-900 text-slate-300 py-2 px-6 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-[11px] font-semibold tracking-wider text-slate-200">PAYTM SIMULATOR</span>
          </div>
          <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto"></div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simulator Warning Banner */}
        <div className="bg-amber-100/90 border-b border-amber-300 px-4 py-1.5 text-center text-[11px] text-amber-900 font-semibold tracking-tight">
          PAYTM-COMPATIBLE SIMULATOR · SAMPLE TEST RUNTIME ONLY
        </div>

        {/* Merchant & Order Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md mb-2">
            P
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Sharma Electronics
          </h3>
          <p className="text-xs text-slate-500">
            Order Ref: <span className="font-mono font-semibold text-slate-700">{orderId}</span>
          </p>
          <div className="mt-3">
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">Amount to Pay</span>
            <div className="text-3xl font-extrabold text-slate-950 mt-0.5">
              ₹{customTamperAmount ? tamperedDisplayRupees : displayRupees}
            </div>
            {customTamperAmount && (
              <span className="text-xs text-rose-600 font-bold block mt-1 animate-bounce">
                ⚠️ TAMPER SIMULATION: Paying ₹100 less than invoice!
              </span>
            )}
          </div>
        </div>

        {/* Mock UPI Apps Picker */}
        <div className="p-5 space-y-4">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Choose Payment App
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedUpiApp('paytm')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                selectedUpiApp === 'paytm' 
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-xs mb-1">
                P
              </div>
              <span className="text-[11px]">Paytm UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedUpiApp('gpay')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                selectedUpiApp === 'gpay' 
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs mb-1">
                G
              </div>
              <span className="text-[11px]">Google Pay</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedUpiApp('phonepe')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                selectedUpiApp === 'phonepe' 
                  ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-bold' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs mb-1">
                Pe
              </div>
              <span className="text-[11px]">PhonePe</span>
            </button>
          </div>

          {/* Webhook Signature Preview info */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="font-semibold text-slate-800">Simulated Signature:</span>
              <span className="text-slate-500 truncate max-w-[170px]">{signaturePreview}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              On button tap, a cryptographically signed webhook is dispatched to the engine.
            </div>
          </div>

          {/* Tamper Test Toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={customTamperAmount}
                onChange={(e) => setCustomTamperAmount(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Test Amount Mismatch (Pay ₹100 less)</span>
            </label>
          </div>

          {/* Big Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePay('TXN_SUCCESS')}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    Pay ₹{customTamperAmount ? tamperedDisplayRupees : displayRupees} (Simulate Success)
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePay('TXN_FAILURE')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Simulate Customer Bank Failure (Keep Open)</span>
            </button>
          </div>
        </div>

        {/* Security watermark */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          <span>Paytm Mock Webhook Gateway · Fail-Closed Audit Enabled</span>
        </div>
      </div>
    </div>
  );
};
