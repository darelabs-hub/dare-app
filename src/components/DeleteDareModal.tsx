import React from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { DareItem } from '../types';
import { playSound } from '../utils/soundEffects';

interface DeleteDareModalProps {
  isOpen: boolean;
  onClose: () => void;
  dare: DareItem | null;
  onConfirmDelete: (dare: DareItem) => Promise<void> | void;
  isDeleting: boolean;
}

export const DeleteDareModal: React.FC<DeleteDareModalProps> = ({
  isOpen,
  onClose,
  dare,
  onConfirmDelete,
  isDeleting,
}) => {
  if (!isOpen || !dare) return null;

  const handleDelete = async () => {
    playSound('laser');
    await onConfirmDelete(dare);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl border border-rose-500/40 bg-[#0c1017] p-6 shadow-[0_0_50px_rgba(244,63,94,0.2)] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => {
            playSound('click');
            onClose();
          }}
          disabled={isDeleting}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 glow-rose">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Delete Published Dare
            </h3>
            <p className="text-xs text-rose-300/80 font-mono mt-0.5">
              Permanently remove this challenge
            </p>
          </div>
        </div>

        {/* Dare Preview Card */}
        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30">
              {dare.category}
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              +{dare.rewardCred} Cred
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-100 line-clamp-2">
            {dare.title}
          </h4>
          <p className="text-xs text-slate-400 line-clamp-2 font-sans">
            {dare.description}
          </p>
        </div>

        {/* Warning Notice */}
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200/90 font-mono">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Are you sure? This dare will be removed from the public feed and all peer feeds. This action cannot be undone.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            disabled={isDeleting}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-xs font-bold text-white hover:from-rose-500 hover:to-red-500 transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Dare</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
