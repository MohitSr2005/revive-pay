import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  Code, 
  ChevronDown, 
  ChevronUp,
  Target,
  Sparkles
} from 'lucide-react';
import { PredictionInputPayload, PredictionResponse } from '../types/prediction';

interface ResultCardProps {
  result: PredictionResponse | null;
  inputData: PredictionInputPayload | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  inputData,
  isLoading,
  error,
  onRetry,
}) => {
  const [showJson, setShowJson] = useState(false);

  // Default threshold in RevivePay is 0.40 (40%)
  const THRESHOLD = 0.40;

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-md relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-indigo-500/5" />
        <div className="relative z-10 flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
          <h3 className="text-xl font-bold text-white tracking-tight">Evaluating Recovery Opportunity...</h3>
          <p className="text-sm text-slate-400 max-w-md">
            RevivePay XGBoost pipeline is preprocessing 19 numerical & categorical features and calculating risk scores.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-1.5">
                API Prediction Error
              </span>
              <h3 className="text-lg font-bold text-white">Prediction Request Failed</h3>
              <p className="text-sm text-rose-200/80 mt-1 max-w-xl">
                {error}
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 shrink-0"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center backdrop-blur-sm">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-300">Ready for Opportunity Prediction</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fill in the transaction details above or select one of the demonstration presets, then click <strong className="text-emerald-400">"Predict Recovery Opportunity"</strong> to view real-time ML classification.
          </p>
        </div>
      </div>
    );
  }

  const isOpportunity = result.recovery_opportunity === 1;
  const probabilityPercent = (result.recovery_probability * 100).toFixed(2);
  const thresholdPercent = (THRESHOLD * 100).toFixed(0);

  return (
    <div className={`rounded-3xl border transition-all duration-300 shadow-2xl overflow-hidden backdrop-blur-md ${
      isOpportunity 
        ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-950 shadow-glow-emerald' 
        : 'border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950'
    }`}>
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 border-b border-slate-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Recovery Opportunity YES/NO Display */}
          <div className="flex items-start space-x-5">
            <div className={`p-4 rounded-2xl border shrink-0 ${
              isOpportunity
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isOpportunity ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2.5 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ML Prediction Result
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                  isOpportunity
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {isOpportunity ? 'Target Action Recommended' : 'Standard Routine'}
                </span>
              </div>

              <div className="flex items-baseline space-x-3">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Recovery Opportunity:
                </h2>
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  isOpportunity ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {isOpportunity ? 'YES' : 'NO'}
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1 max-w-md">
                {isOpportunity
                  ? 'High probability of revenue recovery through targeted payment re-try or automated customer re-engagement.'
                  : 'Transaction does not meet recovery intervention threshold. Standard processing recommended.'}
              </p>
            </div>
          </div>

          {/* Probability Gauge & Metric */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Recovery Probability
              </div>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className={`text-4xl font-black tracking-tight font-mono ${
                  isOpportunity ? 'text-emerald-400' : 'text-slate-200'
                }`}>
                  {probabilityPercent}%
                </span>
                <span className="text-xs text-slate-500">
                  ({result.recovery_probability.toFixed(4)})
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>Decision Threshold: <strong className="text-white font-mono">{thresholdPercent}% (0.40)</strong></span>
            </div>
          </div>

        </div>

        {/* Visual Probability Meter & Threshold Marker */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>0% (Low Probability)</span>
            <span className="text-indigo-300 flex items-center gap-1 font-mono">
              <Target className="w-3 h-3 text-indigo-400" /> Threshold (40.0%)
            </span>
            <span>100% (High Probability)</span>
          </div>

          <div className="relative h-4 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
            {/* 40% Threshold Marker Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 z-20 shadow-glow-indigo"
              style={{ left: `${THRESHOLD * 100}%` }}
              title="Decision Threshold (40%)"
            />
            
            {/* Probability Bar Fill */}
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isOpportunity
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-glow-emerald'
                  : 'bg-gradient-to-r from-slate-600 to-slate-400'
              }`}
              style={{ width: `${Math.max(2, Math.min(100, result.recovery_probability * 100))}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Non-Recovery Zone (&lt; 40%)</span>
            <span className="text-emerald-400 font-medium">Recovery Intervention Zone (&ge; 40%)</span>
          </div>
        </div>

      </div>

      {/* Actionable Next Steps & Insights */}
      <div className="p-6 sm:p-8 bg-slate-950/40">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Recommended Fintech Interventions</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isOpportunity ? (
            <>
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1.5">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  1. Instant Payment Re-try
                </div>
                <p className="text-[11px] text-slate-300">
                  Trigger smart gateway re-routing or secondary acquirer retry for soft-declined authorization.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1.5">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  2. Automated Re-engagement
                </div>
                <p className="text-[11px] text-slate-300">
                  Send proactive 1-click payment links via WhatsApp / SMS / Email with preferred fallback payment methods.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1.5">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  3. Logistics & Escalation
                </div>
                <p className="text-[11px] text-slate-300">
                  Alert merchant logistics for delayed delivery gap resolution to prevent dispute or chargeback.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Standard Fulfillment
                </div>
                <p className="text-[11px] text-slate-400">
                  Transaction parameters are within normal healthy thresholds. Standard carrier fulfillment pipeline is active.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  No Intervention Needed
                </div>
                <p className="text-[11px] text-slate-400">
                  Recovery probability is below the 0.40 trigger boundary. No re-engagement actions necessary.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Continuous Monitoring
                </div>
                <p className="text-[11px] text-slate-400">
                  Subsequent lifecycle updates will be scored dynamically as carrier tracking events progress.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Technical JSON Drawer Toggle */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showJson ? 'Hide Raw API Payload & Response' : 'Inspect Raw API Payload & Response (JSON)'}</span>
            {showJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showJson && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] overflow-x-auto">
                <div className="text-slate-400 font-bold mb-2">// Request Payload (19 features)</div>
                <pre className="text-emerald-300">{JSON.stringify(inputData, null, 2)}</pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] overflow-x-auto">
                <div className="text-slate-400 font-bold mb-2">// FastAPI Response</div>
                <pre className="text-indigo-300">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
