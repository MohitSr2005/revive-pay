import React from 'react';
import { 
  RefreshCw, 
  Zap, 
  Database,
  History
} from 'lucide-react';
import { ApiStatus } from '../services/api';

interface HeaderProps {
  apiStatus: ApiStatus;
  isCheckingStatus: boolean;
  onRefreshStatus: () => void;
  historyCount: number;
  onToggleHistory: () => void;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiStatus,
  isCheckingStatus,
  onRefreshStatus,
  historyCount,
  onToggleHistory,
  onOpenInfo,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 text-white font-bold text-xl">
              <Zap className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white font-sans">
                  Revive<span className="text-emerald-400">Pay</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  ML Engine v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Payment Recovery Opportunity Detection Platform
              </p>
            </div>
          </div>

          {/* Right Action Bar & Connection Status */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Backend Health Status Badge */}
            <div 
              className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                apiStatus.online 
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
              title={`FastAPI Endpoint: http://127.0.0.1:8000 ${apiStatus.latencyMs ? `(${apiStatus.latencyMs}ms)` : ''}`}
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  apiStatus.online ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  apiStatus.online ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </span>
              <span>
                {apiStatus.online ? `API Online (${apiStatus.latencyMs ?? 15}ms)` : 'API Offline'}
              </span>
              <button
                onClick={onRefreshStatus}
                disabled={isCheckingStatus}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded transition-colors"
                title="Refresh API Connection Status"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* Model Info Button */}
            <button
              onClick={onOpenInfo}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Model Info</span>
            </button>

            {/* Session History Drawer Button */}
            <button
              onClick={onToggleHistory}
              className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Session Log</span>
              {historyCount > 0 && (
                <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
