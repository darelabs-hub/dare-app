import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, MessageSquare, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';

interface ChatMessage {
  id: string;
  senderId: string;
  senderHandle: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

interface SquadChatProps {
  currentUser: UserProfile;
}

const TACTICAL_PHRASES = [
  'Protocol accepted! 🦾',
  'On site, initiating proof sync. 📸',
  'Need help with Sector 3 telemetry! 🛰️',
  'Total legend! LEGENDARY verdict loading. 🔥',
  'Oracle briefed me. Solid blueprint. 🔮',
  'Hacking completed. Overclocked! ⚡'
];

export const SquadChat: React.FC<SquadChatProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/squad/chat');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setError(null);
      } else {
        throw new Error('Failed to retrieve comms feed');
      }
    } catch (e) {
      console.error(e);
      setError('Telemetry offline. Reconnecting to comms...');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Poll for new messages every 4 seconds to simulate active feed
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto Scroll to Bottom is disabled to allow users to keep historical messages in view

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;
    setSending(true);
    playSound('laser');
    try {
      const res = await fetch('/api/squad/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, text: textToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setInputValue('');
      } else {
        throw new Error('Unable to transmit chat packet');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to transmit message. Retrying...');
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div id="squad-chat-section" className="flex flex-col h-[420px] rounded-2xl border border-indigo-500/30 bg-[#070b13] overflow-hidden">
      {/* Comms Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-indigo-950/40 via-[#0a0e1a] to-slate-900 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400 shrink-0" />
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-slate-200">
            SQUAD FEED SECURE LINK
          </span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <button 
          onClick={() => fetchMessages()}
          title="Refresh Comms Feed"
          className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Messages Scroll Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-indigo-500/20"
      >
        {loading && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-[10px] font-mono">ESTABLISHING CRYPTO PROTOCOL...</span>
          </div>
        ) : error && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-2 text-rose-400/80 p-4 text-center">
            <AlertCircle className="h-5 w-5" />
            <span className="text-[10px] font-mono">{error}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-1.5 text-slate-500 p-4 text-center">
            <MessageSquare className="h-6 w-6 text-slate-600 mb-1" />
            <span className="text-xs font-semibold text-slate-400">Silent Frequency</span>
            <span className="text-[10px] font-mono text-slate-600 max-w-[180px]">No messages transmitted. Be the first to deploy intelligence.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 items-start max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <img 
                  src={msg.senderAvatar} 
                  alt={msg.senderName} 
                  className="h-7 w-7 rounded-full object-cover border border-slate-800"
                />
                
                {/* Bubble Container */}
                <div>
                  <div className={`flex items-center gap-1.5 text-[9px] font-mono mb-0.5 ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-bold text-slate-300 truncate max-w-[100px]">{msg.senderName}</span>
                    <span className="text-indigo-400">{msg.senderHandle}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500">{formatTime(msg.timestamp)}</span>
                  </div>
                  
                  <div className={`p-2.5 rounded-xl text-xs leading-relaxed break-words shadow-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Tactical Phrases Row */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-900 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none items-center">
        <span className="text-[8px] font-mono font-bold text-indigo-400 shrink-0 uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5 text-indigo-400 animate-pulse" /> MACROS:
        </span>
        {TACTICAL_PHRASES.map((phrase, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(phrase)}
            className="px-2 py-0.5 bg-indigo-950/40 border border-indigo-900/30 text-indigo-300 hover:bg-indigo-900/30 hover:border-indigo-400/50 text-[9px] font-mono rounded transition-colors shrink-0 cursor-pointer"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form 
        onSubmit={handleFormSubmit}
        className="p-3 bg-slate-950/40 border-t border-slate-900 flex gap-2"
      >
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Transmit intelligence to squad..."
          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-colors font-mono"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || sending}
          className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl transition-all cursor-pointer ${
            inputValue.trim() && !sending
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105'
              : 'bg-slate-900 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
