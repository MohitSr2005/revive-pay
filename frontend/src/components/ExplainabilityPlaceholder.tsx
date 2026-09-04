import React from 'react';
import { 
  BarChart3, 
  Sparkles, 
  Cpu
} from 'lucide-react';
import { PredictionInputPayload, PredictionResponse } from '../types/prediction';
import { ShapExplanation } from '../services/api';

interface ExplainabilityPlaceholderProps {
  inputData: PredictionInputPayload | null;
  result: PredictionResponse | null;
  explanations: ShapExplanation[];
}

export const ExplainabilityPlaceholder: React.FC<ExplainabilityPlaceholderProps> = ({
  inputData,
  result,
  explanations,
}) => {
  if (!result || !inputData || explanations.length === 0) {
    return null;
  }


 // Convert real SHAP explanations into UI feature drivers
const featureLabels: Record<string, string> = {
  delivery_time_days: 'Delivery Time',
  total_freight_value: 'Freight Value',
  total_item_price: 'Item Price',
  purchase_day: 'Purchase Day',
  purchase_hour: 'Purchase Hour',
  estimated_delivery_gap_days: 'Estimated Delivery Gap',
  purchase_year: 'Purchase Year',
  purchase_month: 'Purchase Month',
  customer_state: 'Customer State',
  customer_city: 'Customer City',
  approval_delay_hours: 'Approval Delay',
  payment_installments: 'Payment Installments',
  total_payment_value: 'Total Payment Value',
  payment_count: 'Payment Count',
  item_count: 'Item Count',
  unique_products: 'Unique Products',
  unique_sellers: 'Unique Sellers',
  purchase_dayofweek: 'Purchase Day of Week',
  primary_payment_type: 'Payment Type',
};

const featureDrivers = explanations.map((explanation) => ({
  feature: explanation.feature,
  label: featureLabels[explanation.feature] || explanation.feature,
  shapValue: explanation.shap_value,
  impact: explanation.impact,
}));

const maxShap = Math.max(
  ...featureDrivers.map((driver) => Math.abs(driver.shapValue)),
  1
);

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
              <h3 className="text-base font-bold text-white tracking-tight">Agent Explainability & Feature Impact</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                LIVE SHAP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Feature attribution analysis explaining how input attributes influence the XGBoost probability score within the RevivePay recovery agent.
            </p>
          </div>
        </div>
        <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-indigo-500/20 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-indigo-300">How to read this:</span>{' '}
          SHAP values explain how each feature influenced this specific prediction.
          Positive values push the prediction toward a recovery opportunity,
          while negative values push it away. Larger absolute values indicate
          stronger influence.
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>TreeSHAP . Local Explanation</span>
        </div>
      </div>

      {/* Feature Influence Table / Cards */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Key Predictive Feature Attribution</span>
          <span className="text-[11px] text-slate-500 font-mono">LOCAL SHAP ATTRIBUTION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {featureDrivers.map((driver, idx) => {
            const impactWidth = Math.min(
              (Math.abs(driver.shapValue) / maxShap) * 100,
              100
            );
            const isPositive = driver.shapValue > 0;
            return  (
              <div
                key={`${driver.feature}-${idx}`}
                className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:border-slate-700 transition-colors"
              >
                {/* Feature name + SHAP value */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">
                      {driver.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                      SHAP: {driver.shapValue > 0 ? '+' : ''}
                      {driver.shapValue.toFixed(4)}
                    </span>
                  </div>
                  {isPositive ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                      + Opportunity
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700">
                      - Impact
                    </span>
                  )}
                </div>
                {/* SHAP Impact Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {isPositive ? 'Positive influence' : 'Negative influence'}
                    </span>

                    <span>
                      {impactWidth.toFixed(0)}% relative impact
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPositive
                        ? 'bg-emerald-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${impactWidth}%` }}
                  />
                  </div>
                </div>
                {/* Explanation */}
                <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
                  {isPositive
                    ? 'This feature pushes the prediction toward a recovery opportunity.'
                    : 'This feature pushes the prediction away from a recovery opportunity.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent SHAP Integration Note */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-3 text-xs text-indigo-200/90">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-200">
            Live Agent Explanability
          </p>
          <p className="text-[11px] text-indigo-300/80 leading-relaxed">
            Feature impacts are generated by the trained XGBoost model and
            returned through the RevivePay LangGraph recovery agent.
            Positive values push the prediction toward a recovery opportunity,
            while negative values push it away.
          </p>
        </div>
      </div>

    </div>
  );
};
