import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-950/90 backdrop-blur-md px-3.5 py-2 text-xs font-mono font-medium text-amber-200 shadow-2xl animate-bounce">
      <WifiOff className="h-4 w-4 text-amber-400" />
      <span>Offline Protocol Active — Using cached offline assets</span>
    </div>
  );
};
