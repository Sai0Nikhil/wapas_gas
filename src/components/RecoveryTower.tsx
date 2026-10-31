import React, { useState } from 'react';
import { PaymentCase, StoreSettings, CaseStatus, PolicyVerdict } from '../types';
import { UI_STRINGS } from '../data/translations';
import { 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  PhoneCall, 
  Clock, 
  ChevronRight, 
  ExternalLink,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface RecoveryTowerProps {
  cases: PaymentCase[];
  settings: StoreSettings;
  onSimulateBurst: () => void;
  onResetDemo: () => void;
  onSelectCase: (caseId: string) => void;
  onOpenSimulator: (caseId: string) => void;
  onApproveCase: (caseId: string) => void;
}

export const RecoveryTower: React.FC<RecoveryTowerProps> = ({
  cases,
  settings,
  onSimulateBurst,
  onResetDemo,
  onSelectCase,
  onOpenSimulator,
  onApproveCase,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AUTO' | 'WAITING' | 'BLOCKED' | 'RECOVERED'>('ALL');
  const ui = UI_STRINGS[settings.uiLanguage] || UI_STRINGS.hinglish;

  // Key Aggregations
  const flaggedCount = cases.length;
  const contactedCount = cases.filter((c) => c.status === 'CONTACTED' || c.status === 'RECOVERED').length;
  const recoveredCount = cases.filter((c) => c.status === 'RECOVERED').length;
  const waitingCount = cases.filter((c) => c.status === 'WAITING_APPROVAL').length;
  const blockedCount = cases.filter((c) => c.status === 'BLOCKED').length;

  const totalRupeesRecoveredPaise = cases
    .filter((c) => c.status === 'RECOVERED')
    .reduce((sum, c) => sum + c.amountPaise, 0);

  // Filter cases
  const filteredCases = cases.filter((c) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'AUTO') return c.policyResult.verdict === 'ALLOW';
    if (activeFilter === 'WAITING') return c.status === 'WAITING_APPROVAL';
    if (activeFilter === 'BLOCKED') return c.status === 'BLOCKED';
    if (activeFilter === 'RECOVERED') return c.status === 'RECOVERED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Action Bar with Burst & Reset Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Failed UPI Payment Stream
          </h2>
          <p className="text-xs text-slate-500">
            Simulate realistic UPI gateway failure spikes and observe autonomous resolution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetDemo}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>{ui.resetDemo}</span>
          </button>

          <button
            type="button"
            onClick={onSimulateBurst}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{ui.simulateBurst}</span>
          </button>
        </div>
      </div>

      {/* Summary Card "Tonight's recovery run" */}
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl p-5 sm:p-6 text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-lg font-bold tracking-tight text-white">
                {ui.tonightRun}
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                14 cases seeded
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous loop actively listening on NPCI bank switches & UPI gateways
            </p>
          </div>

          {/* Rupees Recovered KPI */}
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-xl flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
              ₹
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                {ui.rupeesRecovered}
              </span>
              <div className="text-2xl font-extrabold text-blue-400 tracking-tight">
                ₹{(totalRupeesRecoveredPaise / 100).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* 5 Main Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              {ui.flagged}
            </span>
            <div className="text-2xl font-bold text-white mt-1">
              {flaggedCount}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              100% evaluated
            </span>
          </div>

          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              {ui.contacted}
            </span>
            <div className="text-2xl font-bold text-indigo-300 mt-1">
              {contactedCount}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Zero duplicate messages
            </span>
          </div>

          <div className="bg-blue-950/40 p-3.5 rounded-xl border border-blue-500/30">
            <span className="text-xs text-blue-300 font-medium block">
              {ui.recovered}
            </span>
            <div className="text-2xl font-bold text-blue-400 mt-1 flex items-center gap-1.5">
              <span>{recoveredCount}</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-[11px] text-blue-200/70 block mt-0.5">
              Confirmed by simulator
            </span>
          </div>

          <div className="bg-amber-950/30 p-3.5 rounded-xl border border-amber-500/30">
            <span className="text-xs text-amber-300 font-medium block">
              {ui.waitingForYou}
            </span>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {waitingCount}
            </div>
            <span className="text-[11px] text-amber-200/70 block mt-0.5">
              Needs your approval
            </span>
          </div>

          <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">
              {ui.stoppedByPolicy}
            </span>
            <div className="text-2xl font-bold text-slate-300 mt-1">
              {blockedCount}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Fail-closed guardrails
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Cases ({cases.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('AUTO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'AUTO'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            Auto Allowed ({cases.filter((c) => c.policyResult.verdict === 'ALLOW').length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('WAITING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'WAITING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            Needs Approval ({waitingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('BLOCKED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'BLOCKED'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Blocked by Policy ({blockedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('RECOVERED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeFilter === 'RECOVERED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            Confirmed Recovered ({recoveredCount})
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          Showing {filteredCases.length} records
        </div>
      </div>

      {/* Case List Rows */}
      <div className="space-y-2.5">
        {filteredCases.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            No transactions match the selected filter.
          </div>
        ) : (
          filteredCases.map((c) => {
            const amountRupees = (c.amountPaise / 100).toLocaleString('en-IN');
            const isRecovered = c.status === 'RECOVERED';
            const isWaiting = c.status === 'WAITING_APPROVAL';
            const isBlocked = c.status === 'BLOCKED';

            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className={`group p-4 rounded-xl border bg-white transition-all cursor-pointer hover:shadow-md hover:border-blue-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 relative ${
                  isRecovered 
                    ? 'border-l-4 border-l-blue-600 border-slate-200/90' 
                    : (isWaiting 
                        ? 'border-l-4 border-l-amber-500 border-amber-200/80 bg-amber-50/20' 
                        : (isBlocked 
                            ? 'border-l-4 border-l-slate-400 border-slate-200 opacity-80' 
                            : 'border-slate-200'))
                }`}
              >
                {/* Left: Customer, Bank, Cause, Amount */}
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    isRecovered ? 'bg-blue-600 text-white' :
                    isWaiting ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    isBlocked ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {isRecovered ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : c.customerName[0]}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {c.customerName}
                      </span>
                      <span className="text-base font-extrabold text-blue-900">
                        ₹{amountRupees}
                      </span>
                      <span className="text-xs text-slate-500">
                        · {c.bank}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                      <span className="font-semibold text-slate-700">Cause: </span>
                      {c.aiProposal.cause} · <span className="text-slate-500">{c.failureMessage}</span>
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-mono">
                      <span>Language: {c.language.toUpperCase()}</span>
                      <span>·</span>
                      <span>AI Conf: {(c.aiProposal.confidence * 100).toFixed(0)}%</span>
                      <span>·</span>
                      <span>ID: {c.id}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Verdict chip, Status chip, Quick buttons */}
                <div className="flex items-center flex-wrap gap-2 self-start sm:self-center" onClick={(e) => e.stopPropagation()}>
                  {/* Verdict Chip */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    c.policyResult.verdict === 'ALLOW' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    c.policyResult.verdict === 'ASK_OWNER' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {c.policyResult.verdict === 'ALLOW' ? 'Auto Allowed' :
                     c.policyResult.verdict === 'ASK_OWNER' ? 'Ask Owner' : 'Blocked'}
                  </span>

                  {/* Status Chip */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isRecovered ? 'bg-blue-600 text-white shadow-2xs' :
                    c.status === 'CONTACTED' ? 'bg-indigo-100 text-indigo-800' :
                    isWaiting ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {isRecovered ? 'Confirmed by simulator' : c.status}
                  </span>

                  {/* Contextual Action Button */}
                  {c.paymentLink && !isRecovered && (
                    <button
                      type="button"
                      onClick={() => onOpenSimulator(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      title="Open payment link in Paytm simulator"
                    >
                      <span>Pay in Sim</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}

                  {isWaiting && (
                    <button
                      type="button"
                      onClick={() => onApproveCase(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      title="Approve recovery link for this customer"
                    >
                      <span>Approve</span>
                      <CheckCircle className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectCase(c.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="View case evidence & audit timeline"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
