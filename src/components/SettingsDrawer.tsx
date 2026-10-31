import React from 'react';
import { StoreSettings, Language } from '../types';
import { SUPPORTED_LANGUAGES, UI_STRINGS } from '../data/translations';
import { X, Sliders, Shield, AlertTriangle, Bell, DollarSign, Brain, Globe, RotateCcw } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onResetSettings: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  if (!isOpen) return null;

  const ui = UI_STRINGS[settings.uiLanguage] || UI_STRINGS.hinglish;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#FAF8F5] h-full shadow-2xl border-l border-amber-900/10 flex flex-col overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Policy Guardrails & Settings
              </h2>
              <p className="text-xs text-slate-600">
                Configure deterministic limits for Sharma Electronics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Shop Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Store / Business Name
            </label>
            <input
              type="text"
              value={settings.shopName}
              onChange={(e) => onUpdateSettings({ ...settings, shopName: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
            />
          </div>

          {/* 1. Owner Auto-Approve Limit */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>Auto-Approve Limit (₹)</span>
              </label>
              <span className="text-sm font-bold text-blue-700">
                ₹{(settings.ownerLimitPaise / 100).toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Payments above this amount are automatically halted and routed to the owner approval queue.
            </p>
            <input
              type="range"
              min="1000"
              max="25000"
              step="500"
              value={settings.ownerLimitPaise / 100}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  ownerLimitPaise: parseInt(e.target.value, 10) * 100,
                })
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹1,000</span>
              <span className="text-blue-600 font-bold">Default: ₹5,000</span>
              <span>₹25,000</span>
            </div>
          </div>

          {/* 2. Max Reminders Cap */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Max Reminders Cap</span>
              </label>
              <span className="text-sm font-bold text-indigo-700">
                {settings.maxReminders} message{settings.maxReminders > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Customer outreach permanently halts once this reminder count is reached to prevent harassment.
            </p>
            <div className="flex gap-2">
              {[1, 2, 3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, maxReminders: val })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    settings.maxReminders === val
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {val} {val === 2 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Min Diagnostic Confidence */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-emerald-600" />
                <span>Min Diagnostic Confidence</span>
              </label>
              <span className="text-sm font-bold text-emerald-700">
                {Math.round(settings.minConfidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              If AI diagnostic confidence drops below this threshold, the case is escalated to human review.
            </p>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={settings.minConfidence}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  minConfidence: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>50%</span>
              <span className="text-emerald-600 font-bold">Default: 70%</span>
              <span>95%</span>
            </div>
          </div>

          {/* 4. Dashboard UI Language Picker */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-600" />
              <span>Merchant Dashboard Language</span>
            </label>
            <select
              value={settings.uiLanguage}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  uiLanguage: e.target.value as Language,
                })
              }
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-900"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Customer outbound messages remain localized to each individual customer's recorded language.
            </p>
          </div>

          {/* 5. Global Paytm API Error Circuit Breaker Toggle */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Simulate Global Paytm API Degradation</span>
              </label>
              <input
                type="checkbox"
                checked={settings.simulateGlobalPaytmError}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    simulateGlobalPaytmError: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
            <p className="text-xs text-amber-900">
              When checked, the policy engine activates Rule 2 circuit breaker: all cases are paused and zero messages can be sent.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetSettings}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
