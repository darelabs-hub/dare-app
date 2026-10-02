import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal, Home } from 'lucide-react';
import { captureException } from '../utils/analytics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by DARE Error Boundary:', error, errorInfo);
    captureException(error, {
      componentStack: errorInfo.componentStack,
      boundary: 'DARE_App_Root_ErrorBoundary',
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30 font-sans">
          <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/40 bg-[#0c1017] p-8 shadow-[0_0_50px_rgba(244,63,94,0.15)] text-center">
            {/* Glow backdrop */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-rose-500/10 via-purple-500/5 to-transparent pointer-events-none" />

            {/* Error Icon */}
            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-950/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h1 className="relative text-2xl font-bold tracking-tight text-white">
              Something Went Wrong
            </h1>
            
            <p className="relative mt-2 text-xs text-rose-200/90 max-w-sm mx-auto">
              An unexpected error occurred. DARE caught the issue so your data is safe.
            </p>

            {this.state.error?.message && (
              <div className="relative mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-left">
                <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-400 mb-1">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Error Details</span>
                </div>
                <p className="font-mono text-xs text-rose-300 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload App</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
              >
                <Home className="h-4 w-4" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
