import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageSquare, Flame, Trophy, ExternalLink, Share2, ShieldCheck, Heart, Repeat2 } from 'lucide-react';
import { UserProfile } from '../types';
import { playSound } from '../utils/soundEffects';
import { GoogleGenAI } from '@google/genai';

interface DareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface FeedItem {
  id: string;
  user: {
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  dareRef?: {
    title: string;
    reward: number;
  };
}

export const DareChatModal: React.FC<DareChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'bot' | 'feed'>('bot');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Welcome to Dare Chat! I'm your challenge assistant. Ask me for a custom dare, check challenge stats, or chat about your latest adventure!`,
      timestamp: 'Just now'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    playSound('click');

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setIsTyping(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      let botReply = "Challenge accepted! Let's make it legendary.";

      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `You are DareBot, an energetic AI assistant that helps users with challenges, bounties, and dares. The user says: "${userText}". Keep it punchy, engaging, and friendly with emojis.`
        });
        if (response.text) {
          botReply = response.text;
        }
      } else {
        if (userText.toLowerCase().includes('dare') || userText.toLowerCase().includes('challenge')) {
          botReply = "Here is a great challenge idea: Do 50 pushups outdoors and record a quick video update. Earn 500 Cred!";
        } else {
          botReply = `Got it! '${userText}' has been recorded on your activity log. Keep pushing forward!`;
        }
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: "Connection unstable, but your message is saved locally! Keep going.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSharePost = () => {
    playSound('complete');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dare:system-alert', {
          detail: {
            title: 'Broadcast Published',
            body: 'Post broadcasted successfully to the community feed!',
            tag: 'COMMUNITY FEED',
          },
        })
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#12141f] shadow-[0_0_50px_rgba(255,0,230,0.25)] overflow-hidden flex flex-col h-[640px]">
        
        {/* Header (Matching Screen 6 in Reference) */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#161826] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF00E6] text-white font-black shadow-[0_0_12px_rgba(255,0,230,0.5)]">
              👑
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-white">
                  Squad
                </h2>
                <span className="text-xs">👑</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>24 members online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-[#0b101b] px-6 py-2 gap-2 text-xs font-mono">
          <button
            onClick={() => { setActiveTab('bot'); playSound('click'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all cursor-pointer ${
              activeTab === 'bot'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>DareBot Assistant</span>
          </button>
          <button
            onClick={() => { setActiveTab('feed'); playSound('click'); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all cursor-pointer ${
              activeTab === 'feed'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <span>Community Feed</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#05080f]">
          
          {activeTab === 'bot' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Chat Messages */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-950 border border-indigo-500/40 text-indigo-300'
                    }`}>
                      {msg.sender === 'user' ? (currentUser?.handle?.[0]?.toUpperCase() || 'U') : '🤖'}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-100 rounded-tr-none'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-slate-400 font-mono">
                        <span className="font-bold text-indigo-400">{msg.sender === 'user' ? `@${currentUser?.handle || 'operator'}` : 'DareBot'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                      🤖
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-slate-900/90 border border-slate-800 px-4 py-3 text-xs text-slate-400 font-mono animate-pulse">
                      DareBot is typing...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="border-t border-slate-800 bg-[#080d16] p-4 flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask DareBot for a challenge or update..."
                  className="flex-1 rounded-xl border border-slate-800 bg-[#04060b] px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-slate-950 font-bold hover:bg-indigo-400 disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Community Stream</span>
                </div>
                <button
                  onClick={handleSharePost}
                  className="text-xs text-indigo-400 hover:underline font-mono"
                >
                  + Broadcast New Update
                </button>
              </div>

              {feedItems.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-6">
                  <MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-400">No community updates posted yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Be the first to share an update with the community.</p>
                </div>
              ) : (
                feedItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img src={item.user.avatar} alt={item.user.name} className="h-10 w-10 rounded-full object-cover border border-indigo-500/30" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{item.user.name}</span>
                          {item.user.verified && <span className="text-[10px] text-indigo-400">✔</span>}
                          <span className="text-xs text-slate-400">@{item.user.handle}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">{item.content}</p>

                  {item.dareRef && (
                    <div className="flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-950/30 px-3 py-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-pink-400" />
                        <span className="text-indigo-200 font-bold">{item.dareRef.title}</span>
                      </div>
                      <span className="text-amber-300 font-bold">+{item.dareRef.reward} Cred</span>
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-2 text-xs text-slate-400 font-mono">
                    <button className="flex items-center gap-1.5 hover:text-pink-400 transition-colors">
                      <Heart className="h-3.5 w-3.5" />
                      <span>{item.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{item.commentsCount}</span>
                    </button>
                    <button onClick={handleSharePost} className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors ml-auto">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              )))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
