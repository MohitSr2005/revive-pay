import React from 'react';
import { 
  X, 
  History, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { PredictionHistoryItem } from '../types/prediction';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: PredictionHistoryItem[];
  onSelectHistoryItem: (item: PredictionHistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 p-6 flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Session History Log</h3>
              <p className="text-xs text-slate-400">
                {history.length} {history.length === 1 ? 'prediction' : 'predictions'} evaluated
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No Predictions Yet</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Submit a prediction or pick a preset to log transaction evaluations here.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isOpportunity = item.result.recovery_opportunity === 1;
              const probPercent = (item.result.recovery_probability * 100).toFixed(2);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                    isOpportunity
                      ? 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50'
                      : 'border-slate-800/90 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                      isOpportunity
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {isOpportunity ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> YES ({probPercent}%)
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> NO ({probPercent}%)
                        </>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      ${item.input.total_payment_value.toFixed(2)} • {item.input.primary_payment_type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase">
                      {item.input.customer_city}, {item.input.customer_state}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-indigo-300/80 flex items-center gap-1 hover:text-indigo-200">
                    <RotateCcw className="w-3 h-3" />
                    <span>Click to reload into form</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={onClearHistory}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
