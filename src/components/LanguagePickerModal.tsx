import React from 'react';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/translations';
import { Check, Globe2, X } from 'lucide-react';

interface LanguagePickerModalProps {
  isOpen: boolean;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onClose: () => void;
  isFirstLaunch?: boolean;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  isOpen,
  currentLanguage,
  onSelectLanguage,
  onClose,
  isFirstLaunch = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] rounded-2xl shadow-2xl border border-amber-900/10 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isFirstLaunch ? 'Select Your Dashboard Language' : 'Change Dashboard Language'}
              </h2>
              <p className="text-xs text-slate-600">
                अपनी भाषा चुनें · భాష ఎంచుకోండి · மொழியைத் தேர்வுசெய்யவும்
              </p>
            </div>
          </div>
          {!isFirstLaunch && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Informative Note */}
        <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/40 text-xs text-amber-900 font-medium">
          Note: Language changes merchant UI wording only. The deterministic recovery safety policy remains identical.
        </div>

        {/* Big Native Script Tiles */}
        <div className="p-6 grid grid-cols-2 gap-3.5 sm:gap-4 max-h-[60vh] overflow-y-auto">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all min-h-[92px] justify-between relative group ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                <div className="w-full flex items-start justify-between">
                  <span className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {lang.nativeName}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {lang.name} · <span className="text-slate-400">{lang.region}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Default: Hinglish (Pan-India)
          </span>
          <button
            onClick={() => {
              if (isFirstLaunch && !currentLanguage) {
                onSelectLanguage('hinglish');
              }
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            {isFirstLaunch ? 'Continue to Wapas' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
