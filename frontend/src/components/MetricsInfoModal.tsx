import React from 'react';
import { 
  X, 
  Database, 
  Cpu, 
  Target, 
  Layers
} from 'lucide-react';

interface MetricsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetricsInfoModal: React.FC<MetricsInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">RevivePay Model & Architecture</h3>
              <p className="text-xs text-slate-400">Technical specifications for project demonstration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-6 space-y-6 text-xs text-slate-300">
          
          {/* Card 1: Pipeline Overview */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Machine Learning Pipeline Architecture</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              The model uses a tuned <strong>XGBoost Classifier</strong> wrapped in an end-to-end scikit-learn pipeline featuring:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 ml-1">
              <li><strong className="text-white">Numeric Features (16):</strong> Median SimpleImputer + StandardScaler</li>
              <li><strong className="text-white">Categorical Features (3):</strong> Most-Frequent SimpleImputer + OneHotEncoder (handle_unknown='ignore')</li>
              <li><strong className="text-white">Classifier:</strong> Tuned XGBoost (learning_rate: 0.03, colsample_bytree: 0.7, max_depth: 8, n_estimators: 200)</li>
            </ul>
          </div>

          {/* Card 2: Decision Threshold */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold">
              <Target className="w-4 h-4" />
              <span>0.40 Decision Threshold Rationale</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              In payment recovery and fraud operations, failing to capture a recoverable payment has a higher financial cost than false intervention. 
              The threshold is optimized at <strong className="text-white">40% (0.40)</strong> to maximize recall on recovery opportunities while minimizing unnecessary outreach.
            </p>
          </div>

          {/* Card 3: Backend API Integration */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <Layers className="w-4 h-4" />
              <span>FastAPI Integration</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-mono text-[11px]">
              POST http://127.0.0.1:8000/predict
            </p>
            <p className="text-slate-400">
              Direct REST communication strictly separates presentation from machine-learning inference.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
