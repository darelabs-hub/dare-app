import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Search, 
  Plus, 
  Smile, 
  Flame, 
  Target, 
  Check, 
  CheckCheck, 
  ArrowLeft, 
  Sparkles, 
  User, 
  BadgeCheck, 
  Minimize2, 
  Maximize2,
  Swords,
  ChevronDown
} from 'lucide-react';
import { UserProfile, DareItem } from '../types';
import { playSound } from '../utils/soundEffects';

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderHandle?: string;
  senderAvatar?: string;
  recipientId?: string;
  recipientHandle?: string;
  content?: string;
  text?: string;
  createdAt?: string;
  timestamp?: string;
  status?: string;
  read?: boolean;
  dareAttachment?: any;
  reactions?: Record<string, string[]>;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isPro?: boolean;
  isOnline?: boolean;
}

export interface Conversation {
  id: string;
  type?: string;
  title?: string;
  participants: ConversationParticipant[];
  lastMessage?: DirectMessage;
  unreadCount?: number;
  updatedAt: string;
}

interface TwitterChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers?: UserProfile[];
  initialRecipientId?: string;
  initialDareAttachment?: DareItem;
  onAcceptDare?: (dare: DareItem) => void;
  onViewDare?: (dareId: string) => void;
  onOpenProfile?: (userId: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

const QUICK_REPLIES = [
  'Challenge accepted! 🔥',
  'You’re on! ⚔️',
  'Check out my proof 📸',
  'Let’s wager some Cred 💰',
  'Nice one! 👏',
];

const EMOJI_LIST = ['🔥', '❤️', '😂', '🎯', '👑', '👏', '⚡', '💯', '🚀', '👀'];

export const TwitterChatModal: React.FC<TwitterChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers = [],
  initialRecipientId,
  initialDareAttachment,
  onAcceptDare,
  onViewDare,
  onOpenProfile,
  onUnreadCountChange,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [attachedDare, setAttachedDare] = useState<DareItem | null>(initialDareAttachment || null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all conversation threads
  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/dm/conversations?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const convList: Conversation[] = data.conversations || [];
        setConversations(convList);
        
        // Calculate total unread count
        const totalUnread = convList.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        if (onUnreadCountChange) onUnreadCountChange(totalUnread);

        // Select initial conversation or first if none selected
        if (!activeConvId && convList.length > 0) {
          if (initialRecipientId) {
            const found = convList.find(c => 
              c.participants.some((p: any) => p.id === initialRecipientId)
            );
            if (found) {
              setActiveConvId(found.id);
            } else {
              // Open new conversation with initialRecipientId
              handleStartNewChatWithId(initialRecipientId);
            }
          } else {
            // On larger screens, auto-select first conversation
            if (window.innerWidth >= 768) {
              setActiveConvId(convList[0].id);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching conversations:', e);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/dm/messages?conversationId=${convId}&userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Initial load & polling
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
      pollIntervalRef.current = setInterval(() => {
        fetchConversations();
        if (activeConvId) {
          fetchMessages(activeConvId, true);
        }
      }, 3500);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, activeConvId, currentUser.id]);

  // When active conversation changes, load its messages
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId]);

  // Handle incoming initial dare attachment
  useEffect(() => {
    if (initialDareAttachment) {
      setAttachedDare(initialDareAttachment);
    }
  }, [initialDareAttachment]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find(c => c.id === activeConvId);
  const activeRecipient = activeConversation?.participants.find((p: any) => p.id !== currentUser.id) || activeConversation?.participants[0];

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedDare) || sending || !activeConvId) return;

    setSending(true);
    playSound('pop');

    try {
      const payload: any = {
        conversationId: activeConvId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderHandle: currentUser.handle,
        senderAvatar: currentUser.avatar,
        recipientId: activeRecipient?.id,
        recipientHandle: activeRecipient?.handle,
        text: inputText.trim(),
      };

      if (attachedDare) {
        payload.dareAttachment = {
          id: attachedDare.id,
          title: attachedDare.title,
          credReward: attachedDare.rewardCred,
          category: attachedDare.category,
        };
      }

      const res = await fetch('/api/dm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setInputText('');
        setAttachedDare(null);
        setIsEmojiPickerOpen(false);
        fetchConversations();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    playSound('click');
    try {
      const res = await fetch('/api/dm/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
          userId: currentUser.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: data.reactions } : m));
      }
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  const handleStartNewChatWithId = (recipientId: string) => {
    const existing = conversations.find(c => c.participants.some((p: any) => p.id === recipientId));
    if (existing) {
      setActiveConvId(existing.id);
      setIsNewChatOpen(false);
      return;
    }

    const targetUser = allUsers.find(u => u.id === recipientId);
    if (!targetUser) return;

    const newConvId = `conv_${targetUser.id.substring(0, 10)}`;
    const newConv: Conversation = {
      id: newConvId,
      type: 'direct',
      title: targetUser.name,
      participants: [{
        id: targetUser.id,
        name: targetUser.name,
        handle: targetUser.handle,
        avatar: targetUser.avatar,
        isPro: targetUser.isPro,
        isOnline: true,
      }],
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConvId(newConvId);
    setIsNewChatOpen(false);
  };

  if (!isOpen) return null;

  // Filtered conversations based on search
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = c.participants.find((p: any) => p.id !== currentUser.id) || c.participants[0];
    const matchName = other?.name?.toLowerCase().includes(q) || false;
    const matchHandle = other?.handle?.toLowerCase().includes(q) || false;
    const matchLast = c.lastMessage?.text?.toLowerCase().includes(q) || false;
    return matchName || matchHandle || matchLast;
  });

  // Filtered users for New Chat composer
  const availableUsersForNewChat = allUsers
    .filter(u => u.id !== currentUser.id)
    .filter(u => {
      if (!newChatSearch.trim()) return true;
      const q = newChatSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q);
    });

  // Minimized dock view (Twitter Web style floating at bottom right)
  if (isMinimized) {
    const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
        <button
          onClick={() => {
            playSound('pop');
            setIsMinimized(false);
          }}
          className="flex items-center gap-3 rounded-full bg-slate-900 border-2 border-sky-500/50 px-4 py-2.5 shadow-[0_0_25px_rgba(14,165,233,0.3)] text-white hover:border-sky-400 hover:bg-slate-800 transition-all cursor-pointer font-bold text-xs"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-slate-950 font-black">
            ✉
          </div>
          <span>Messages</span>
          {totalUnread > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-500 px-1.5 text-[10px] font-black text-slate-950">
              {totalUnread}
            </span>
          )}
          <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="flex h-full sm:h-[680px] w-full max-w-4xl flex-col sm:rounded-3xl border border-slate-800 bg-[#070a12] shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Main 2-Column Responsive Layout */}
        <div className="flex flex-1 overflow-hidden h-full">

          {/* ======================================================== */}
          {/* LEFT COLUMN: Messages Inbox / Conversations List */}
          {/* ======================================================== */}
          <div className={`w-full md:w-[340px] lg:w-[380px] flex flex-col border-r border-slate-800 bg-[#060910] ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Header: Title & New Message Button */}
            <div className="flex items-center justify-between p-3.5 px-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <span className="text-sky-400">✦</span> Messages
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 hover:border-sky-400 transition-all cursor-pointer"
                  title="New message"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer md:hidden"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Twitter-style Search Bar */}
            <div className="p-3 border-b border-slate-800/60">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Direct Messages..."
                  className="w-full rounded-full border border-slate-800 bg-[#0d121d] pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:bg-[#070b13] focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Threads List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
                  <div className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-2">
                    ✉
                  </div>
                  <p className="text-xs font-semibold text-slate-400">No messages found</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                    Start a chat with any challenger on the platform!
                  </p>
                  <button
                    onClick={() => setIsNewChatOpen(true)}
                    className="mt-4 rounded-full bg-sky-500 hover:bg-sky-400 px-4 py-1.5 text-xs font-bold text-slate-950 transition-all shadow-md"
                  >
                    Compose Message
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = conv.participants.find((p: any) => p.id !== currentUser.id) || conv.participants[0];
                  const isSelected = conv.id === activeConvId;
                  const lastMsg = conv.lastMessage;
                  const isSentByMe = lastMsg?.senderId === currentUser.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        playSound('click');
                        setActiveConvId(conv.id);
                      }}
                      className={`flex w-full items-start gap-3 p-3.5 text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-sky-950/30 border-l-4 border-sky-400 shadow-inner' 
                          : 'hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Avatar with Online Badge */}
                      <div className="relative shrink-0">
                        <img
                          src={other.avatar}
                          alt={other.name}
                          className="h-11 w-11 rounded-full object-cover border border-slate-700"
                        />
                        {other.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#060910]" />
                        )}
                      </div>

                      {/* Info & Snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-bold text-white truncate">
                              {other.name}
                            </span>
                            {other.isPro && (
                              <BadgeCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                            )}
                            <span className="text-[11px] text-slate-500 truncate">
                              {other.handle}
                            </span>
                          </div>
                          {lastMsg && (
                            <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                              {new Date(lastMsg.timestamp || lastMsg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {/* Last message preview */}
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate ${(conv.unreadCount || 0) > 0 ? 'font-bold text-white' : 'text-slate-400'}`}>
                            {isSentByMe && <span className="text-slate-500">You: </span>}
                            {lastMsg?.dareAttachment ? (
                              <span className="text-amber-400 flex items-center gap-1 inline-flex">
                                🎯 Dare: {lastMsg.dareAttachment.title}
                              </span>
                            ) : (
                              lastMsg?.text || 'No messages yet'
                            )}
                          </p>

                          {(conv.unreadCount || 0) > 0 && (
                            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-black text-slate-950 shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Active Chat Conversation Thread */}
          {/* ======================================================== */}
          <div className={`flex-1 flex-col bg-[#070b13] relative ${
            activeConvId ? 'flex' : 'hidden md:flex'
          }`}>
            
            {activeConvId && activeRecipient ? (
              <>
                {/* Active Chat Header */}
                <div className="flex items-center justify-between p-3.5 px-4 border-b border-slate-800 bg-[#080d17]/90 backdrop-blur-md z-10">
                  <div className="flex items-center gap-3">
                    {/* Back arrow on mobile to return to conversations inbox */}
                    <button
                      type="button"
                      onClick={() => setActiveConvId(null)}
                      className="md:hidden flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    <div className="relative cursor-pointer" onClick={() => onOpenProfile && onOpenProfile(activeRecipient.id)}>
                      <img
                        src={activeRecipient.avatar}
                        alt={activeRecipient.name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-700 hover:ring-2 hover:ring-sky-400 transition-all"
                      />
                      {activeRecipient.isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#080d17]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span 
                          onClick={() => onOpenProfile && onOpenProfile(activeRecipient.id)}
                          className="text-xs font-bold text-white hover:text-sky-300 transition-colors cursor-pointer"
                        >
                          {activeRecipient.name}
                        </span>
                        {activeRecipient.isPro && (
                          <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {activeRecipient.handle}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playSound('laser');
                        setAttachedDare({
                          id: `quick_dare_${Date.now()}`,
                          title: `1-on-1 Challenge with ${activeRecipient.name}`,
                          credReward: 50,
                          category: 'physical',
                        } as any);
                      }}
                      className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 hover:border-amber-400 transition-all cursor-pointer shadow-sm"
                      title="Attach a dare challenge to this chat"
                    >
                      <Target className="h-3.5 w-3.5 text-amber-400" />
                      <span className="hidden sm:inline">Send Dare</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMinimized(true)}
                      className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Minimize"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                  
                  {/* Twitter-style Conversation Starter Profile Card */}
                  <div className="flex flex-col items-center justify-center py-6 text-center border-b border-slate-800/60 pb-6 mb-4">
                    <img
                      src={activeRecipient.avatar}
                      alt={activeRecipient.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-sky-500/40 shadow-lg mb-2"
                    />
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-white text-sm">{activeRecipient.name}</h3>
                      {activeRecipient.isPro && <BadgeCheck className="h-4 w-4 text-sky-400" />}
                    </div>
                    <span className="text-xs text-slate-500 font-mono mb-2">{activeRecipient.handle}</span>
                    <p className="text-xs text-slate-400 max-w-sm mb-3">
                      Connected on DARE. Send peer dares, wager Cred on live battles, and celebrate proofs!
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                      🔒 End-to-end encrypted direct telemetry
                    </span>
                  </div>

                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Sparkles className="h-5 w-5 text-sky-400 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No messages yet. Send a greeting or dare challenge below!
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === currentUser.id;
                      const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isMe && (
                            <img
                              src={msg.senderAvatar}
                              alt={msg.senderName}
                              className="h-7 w-7 rounded-full object-cover shrink-0 mb-1"
                            />
                          )}

                          <div className={`relative max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            
                            {/* Message Bubble */}
                            <div className={`rounded-2xl px-4 py-2.5 text-xs shadow-md break-words relative ${
                              isMe 
                                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-br-xs shadow-[0_2px_10px_rgba(14,165,233,0.3)]' 
                                : 'bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/60'
                            }`}>
                              
                              {/* Attached Dare Card in Chat Bubble */}
                              {msg.dareAttachment && (
                                <div className="mb-2 rounded-xl border border-amber-500/40 bg-slate-950/60 p-3 text-left">
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                                    <span className="flex items-center gap-1">
                                      <Target className="h-3 w-3" /> Dare Challenge
                                    </span>
                                    <span className="text-amber-300">+{msg.dareAttachment.credReward || msg.dareAttachment.rewardCred || 100} CR</span>
                                  </div>
                                  <p className="font-bold text-white text-xs mb-2">
                                    {msg.dareAttachment.title}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onViewDare && msg.dareAttachment) {
                                        onViewDare(msg.dareAttachment.id);
                                        onClose();
                                      }
                                    }}
                                    className="w-full py-1 rounded bg-amber-500 text-slate-950 font-black text-[10px] hover:bg-amber-400 transition-colors uppercase cursor-pointer"
                                  >
                                    View Challenge →
                                  </button>
                                </div>
                              )}

                              {/* Message Text */}
                              {msg.text && (
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              )}

                              {/* Time & Read Receipts */}
                              <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                                isMe ? 'text-sky-200/80' : 'text-slate-400'
                              }`}>
                                <span>
                                  {new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  msg.status === 'read' ? (
                                    <CheckCheck className="h-3 w-3 text-white" />
                                  ) : (
                                    <Check className="h-3 w-3 text-sky-200" />
                                  )
                                )}
                              </div>
                            </div>

                            {/* Emoji Reaction Display on Bubble */}
                            {hasReactions && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(msg.reactions!).map(([emoji, userIds]) => {
                                  const ids = (Array.isArray(userIds) ? userIds : []) as string[];
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReactToMessage(msg.id, emoji)}
                                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono border transition-all ${
                                        ids.includes(currentUser.id)
                                          ? 'bg-sky-950/80 border-sky-400 text-sky-300'
                                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span>{ids.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Quick Hover Reactions Bar */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-0 bg-slate-900/90 border border-slate-700 rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-lg backdrop-blur-sm z-10">
                              {['❤️', '🔥', '😂', '🎯'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReactToMessage(msg.id, emoji)}
                                  className="hover:scale-125 transition-transform text-xs p-0.5 cursor-pointer"
                                  title={`React ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer Area */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#080d17]/95">
                  
                  {/* Quick Reply Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                    {QUICK_REPLIES.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputText(reply);
                          playSound('pop');
                        }}
                        className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-sky-500 hover:text-white transition-all whitespace-nowrap cursor-pointer"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>

                  {/* Attached Dare Preview Chip */}
                  {attachedDare && (
                    <div className="mb-2 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-1.5 text-xs text-amber-200">
                      <div className="flex items-center gap-2 truncate">
                        <Target className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="font-bold truncate">Attached Dare: {attachedDare.title}</span>
                        <span className="text-[10px] text-amber-400 font-mono">+{attachedDare.rewardCred} CR</span>
                      </div>
                      <button
                        onClick={() => setAttachedDare(null)}
                        className="text-slate-400 hover:text-white ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Emoji Quick Picker Row */}
                  {isEmojiPickerOpen && (
                    <div className="mb-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 overflow-x-auto">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setInputText(prev => prev + emoji);
                            playSound('pop');
                          }}
                          className="text-base hover:scale-125 transition-transform p-1 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer ${
                        isEmojiPickerOpen ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Emojis"
                    >
                      <Smile className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playSound('laser');
                        setAttachedDare({
                          id: `dare_custom_${Date.now()}`,
                          title: inputText.trim() || 'Custom Direct Dare',
                          credReward: 50,
                          category: 'physical',
                        } as any);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      title="Attach Challenge"
                    >
                      <Target className="h-4 w-4" />
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Start a new message..."
                      className="flex-1 rounded-full border border-slate-700/80 bg-[#0d121e] px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
                    />

                    <button
                      type="submit"
                      disabled={(!inputText.trim() && !attachedDare) || sending}
                      className={`flex h-9 w-9 items-center justify-center rounded-full font-bold transition-all shadow-md cursor-pointer ${
                        inputText.trim() || attachedDare
                          ? 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* No Conversation Selected Placeholder */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 text-2xl mb-3 shadow-inner">
                  ✉
                </div>
                <h3 className="font-bold text-white text-base">Select a conversation</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Choose an existing message thread on the left, or compose a new direct message to start daring players!
                </p>
                <button
                  onClick={() => setIsNewChatOpen(true)}
                  className="mt-4 rounded-full bg-sky-500 hover:bg-sky-400 px-5 py-2 text-xs font-bold text-slate-950 transition-all shadow-md cursor-pointer"
                >
                  New Message
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* NEW MESSAGE COMPOSER MODAL (Twitter style) */}
      {/* ======================================================== */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in zoom-in-95 duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl flex flex-col max-h-[500px]">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">New Message</h3>
              <button
                onClick={() => setIsNewChatOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-3 border-b border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="Search people by name or @handle..."
                  className="w-full rounded-full border border-slate-700 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 py-2">
              {availableUsersForNewChat.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No users found matching search
                </div>
              ) : (
                availableUsersForNewChat.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleStartNewChatWithId(user.id)}
                    className="flex w-full items-center gap-3 p-2.5 hover:bg-slate-800/80 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate">{user.name}</span>
                        {user.isPro && <BadgeCheck className="h-3 w-3 text-sky-400" />}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{user.handle}</span>
                    </div>
                    <span className="text-xs font-bold text-sky-400">Chat →</span>
                  </button>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
