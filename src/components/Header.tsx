import React from 'react';
import { StoreSettings, Language } from '../types';
import { UI_STRINGS, SUPPORTED_LANGUAGES } from '../data/translations';
import { ShieldAlert, Globe, Sliders, BarChart3, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  settings: StoreSettings;
  onOpenSettings: () => void;
  onOpenMetrics: () => void;
  onOpenLanguagePicker: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  onOpenMetrics,
  onOpenLanguagePicker,
}) => {
  const ui = UI_STRINGS[settings.uiLanguage] || UI_STRINGS.hinglish;
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === settings.uiLanguage);

  return (
    <header className="border-b border-amber-900/10 bg-[#FAF7F0] sticky top-0 z-30 shadow-xs">
      {/* Mandatory Paytm Simulator Label Badge */}
      <div className="bg-slate-900 text-slate-200 text-xs px-3 py-1.5 flex items-center justify-between font-mono tracking-tight">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-amber-300">
            Paytm-compatible simulator · sample data
          </span>
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
          <span>Fail-closed deterministic guardrails active</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Shop identity */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 text-lg">
            W
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Wapas
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                AI Teammate
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {ui.shopName} · <span className="text-slate-500">Autonomous UPI Recovery</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Language Selector Chip */}
          <button
            onClick={onOpenLanguagePicker}
            type="button"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300/80 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs transition-colors"
            title="Change UI language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="max-w-[100px] truncate">{currentLang?.nativeName || 'Language'}</span>
          </button>

          {/* Metrics & Pilot Results */}
          <button
            onClick={onOpenMetrics}
            type="button"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300/80 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Metrics & ROI</span>
          </button>

          {/* Policy Settings */}
          <button
            onClick={onOpenSettings}
            type="button"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300/80 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-700" />
            <span className="hidden sm:inline">{ui.settings}</span>
          </button>
        </div>
      </div>

      {/* Visible Core Principle Banner */}
      <div className="bg-amber-50/90 border-t border-amber-200/60 px-4 py-1.5 text-center">
        <p className="text-xs sm:text-[13px] font-semibold text-amber-950 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 inline flex-shrink-0" />
          <span>
            <strong className="text-blue-900 font-bold">CORE PRINCIPLE:</strong> "AI proposes. Policy authorizes. Code executes. Paytm confirms."
          </span>
        </p>
      </div>
    </header>
  );
};
