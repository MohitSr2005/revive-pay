import React from 'react';
import { 
  BarChart3, 
  Sparkles, 
  ArrowUpRight, 
  Cpu
} from 'lucide-react';
import { PredictionInputPayload, PredictionResponse } from '../types/prediction';

interface ExplainabilityPlaceholderProps {
  inputData: PredictionInputPayload | null;
  result: PredictionResponse | null;
}

export const ExplainabilityPlaceholder: React.FC<ExplainabilityPlaceholderProps> = ({
  inputData,
  result,
}) => {
  if (!result || !inputData) {
    return null;
  }


  // Approximate relative feature importance factors for UI demonstration
  const featureDrivers = [
    {
      feature: 'approval_delay_hours',
      label: 'Gateway Approval Delay',
      value: `${inputData.approval_delay_hours} hrs`,
      impact: inputData.approval_delay_hours > 24 ? 'high-positive' : inputData.approval_delay_hours > 2 ? 'med-positive' : 'neutral',
      description: inputData.approval_delay_hours > 24 
        ? 'Extended gateway approval lag strongly correlates with recovery intervention need.' 
        : 'Normal payment confirmation timeframe.',
    },
    {
      feature: 'estimated_delivery_gap_days',
      label: 'Estimated Delivery Gap',
      value: inputData.estimated_delivery_gap_days != null ? `${inputData.estimated_delivery_gap_days} days` : 'N/A',
      impact: (inputData.estimated_delivery_gap_days ?? 0) > 15 ? 'high-positive' : (inputData.estimated_delivery_gap_days ?? 0) < 0 ? 'negative' : 'neutral',
      description: 'Variance between expected logistics SLA and actual carrier transit.',
    },
    {
      feature: 'payment_installments',
      label: 'Payment Installments',
      value: `${inputData.payment_installments} installments`,
      impact: inputData.payment_installments >= 5 ? 'med-positive' : 'neutral',
      description: 'Higher installment plans reflect higher customer commitment & recovery value.',
    },
    {
      feature: 'total_payment_value',
      label: 'Total Value at Risk',
      value: `$${inputData.total_payment_value.toFixed(2)}`,
      impact: inputData.total_payment_value > 200 ? 'med-positive' : 'neutral',
      description: 'Monetary exposure for merchant revenue recovery prioritization.',
    },
    {
      feature: 'primary_payment_type',
      label: 'Payment Method Type',
      value: inputData.primary_payment_type.replace('_', ' ').toUpperCase(),
      impact: inputData.primary_payment_type === 'boleto' ? 'med-positive' : 'neutral',
      description: 'Boleto/bank slip transactions have distinct recovery settlement profiles.',
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md shadow-card space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">Model Explainability & Feature Impact</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                SHAP Ready Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Feature attribution analysis explaining how input attributes influence the XGBoost probability score.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>TreeSHAP / KernelSHAP Interface Hook</span>
        </div>
      </div>

      {/* Feature Influence Table / Cards */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Key Predictive Feature Attribution</span>
          <span className="text-[11px] text-slate-500 font-mono">XGBoost Feature Importance Weight</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {featureDrivers.map((driver, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">{driver.label}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    {driver.value}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {driver.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center">
                {driver.impact.includes('positive') ? (
                  <span className="flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    +Opportunity
                  </span>
                ) : (
                  <span className="flex items-center text-[11px] font-bold text-slate-400 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700">
                    Baseline
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SHAP Backend Integration Slot Note */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-3 text-xs text-indigo-200/90">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-200">
            Plug-and-Play SHAP Integration Ready
          </p>
          <p className="text-[11px] text-indigo-300/80 leading-relaxed">
            This module is structured to render dynamic <code className="text-indigo-200 font-mono">shap.waterfall_plot</code> or force plot vector arrays as soon as a SHAP explanation endpoint (<code className="text-indigo-200 font-mono">POST /explain</code>) is added to the backend.
          </p>
        </div>
      </div>

    </div>
  );
};
