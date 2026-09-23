import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Search, 
  Image as ImageIcon,
  Trophy
} from 'lucide-react';
import { DareProof, UserProfile, DareItem } from '../types';

interface ProofGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectProofDare?: (dare: DareItem) => void;
}

export const ProofGalleryModal: React.FC<ProofGalleryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectProofDare,
}) => {
  const [proofs, setProofs] = useState<(DareProof & { dareTitle: string; dareId: string; rewardCred?: number })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserProofs();
    }
  }, [isOpen, currentUser.id]);

  const fetchUserProofs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}/proofs`);
      if (res.ok) {
        const data = await res.json();
        setProofs(data);
      }
    } catch (e) {
      console.error('Error fetching proofs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDareProof = async (proofItem: DareProof & { dareTitle: string; dareId: string; rewardCred?: number }) => {
    if (onSelectProofDare) {
      try {
        const res = await fetch(`/api/dares`);
        if (res.ok) {
          const allDares: DareItem[] = await res.json();
          const target = allDares.find(d => d.id === proofItem.dareId);
          if (target) {
            onClose();
            onSelectProofDare(target);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      }
      
      // Fallback synthetic dare wrapper to view telemetry
      const fallbackDare: DareItem = {
        id: proofItem.dareId,
        title: proofItem.dareTitle,
        description: proofItem.caption,
        proofRequirement: 'Verified execution telemetry',
        category: 'creative',
        difficulty: 'Level 2 - Moderate',
        rewardCred: proofItem.rewardCred || 50,
        creator: { id: 'sys', handle: '@daredaylabs', name: 'DARE Ops', avatar: '' },
        targetType: 'public',
        status: 'verified',
        createdAt: proofItem.submittedAt,
        likes: 0,
        likedUserIds: [],
        comments: [],
        proof: proofItem,
      };
      onClose();
      onSelectProofDare(fallbackDare);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div id="proof-gallery-modal-container" className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-[#0f172a] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">My Proof Vault</h2>
              <p className="text-[11px] font-mono text-slate-400">Authenticated telemetry & Neural Arbiter records</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-20 text-slate-400 font-mono">Loading telemetry...</div>
          ) : proofs.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-mono">No proofs submitted yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proofs.map((proof, index) => (
                <div 
                  key={index} 
                  onClick={() => handleOpenDareProof(proof)}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-cyan-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    {proof.mediaUrl ? (
                      proof.mediaUrl.includes('mp4') || proof.mediaUrl.includes('webm') ? (
                        <div className="h-20 w-20 rounded-lg bg-black flex items-center justify-center relative overflow-hidden border border-slate-700">
                          <video src={proof.mediaUrl} className="h-full w-full object-cover" muted />
                          <span className="absolute bottom-1 right-1 text-[9px] font-mono text-cyan-300 bg-black/80 px-1 rounded">VID</span>
                        </div>
                      ) : (
                        <img src={proof.mediaUrl} alt="Proof" className="h-20 w-20 rounded-lg object-cover border border-slate-800 group-hover:border-cyan-500/40" />
                      )
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-slate-800 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-slate-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">{proof.dareTitle}</h3>
                      <p className="text-xs text-slate-400 mt-1 truncate">{proof.caption}</p>
                      
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {proof.aiJudgement && (
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            proof.aiJudgement.verdict === 'LEGIT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                            proof.aiJudgement.verdict === 'LEGENDARY' ? 'bg-amber-950 text-amber-400 border border-amber-500/40' :
                            'bg-rose-950 text-rose-400 border border-rose-500/40'
                          }`}>
                            {proof.aiJudgement.verdict === 'LEGIT' ? <CheckCircle2 className="h-3 w-3" /> :
                             proof.aiJudgement.verdict === 'LEGENDARY' ? <Trophy className="h-3 w-3" /> :
                             <AlertTriangle className="h-3 w-3" />}
                            {proof.aiJudgement.verdict}
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
                          Inspect Verdict →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
