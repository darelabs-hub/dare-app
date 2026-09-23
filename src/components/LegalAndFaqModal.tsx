import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  FileText,
  ShieldCheck,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
  Mail,
  Scale,
  ExternalLink
} from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export type LegalTab = 'faq' | 'terms' | 'safety' | 'privacy';

interface LegalAndFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: LegalTab;
}

interface FaqItem {
  id: string;
  category: 'general' | 'dares' | 'ai' | 'streaks' | 'safety';
  question: string;
  answer: string;
  badge?: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'what-is-dare',
    category: 'general',
    question: 'What is DARE and how does the platform work?',
    answer:
      'DARE is a social challenge and bounty protocol. Netrunners can deploy dares to the public grid or challenge rivals directly, earn virtual Cred rewards, level up their consecutive streak, and have their video/photo proof audited by our automated Oracle AI engine.',
    badge: 'Basics',
  },
  {
    id: 'how-to-accept',
    category: 'dares',
    question: 'How do I accept a dare and submit proof?',
    answer:
      'Find any Open challenge on the Feed or Filter view and click "Accept Dare". You will have a countdown timer (typically 24 to 48 hours) to execute the task. Once completed, click "Submit Proof", upload your photo/video evidence or paste a verifiable link, add field notes, and submit for verification.',
    badge: 'Workflow',
  },
  {
    id: 'how-neural-arbiter-works',
    category: 'ai',
    question: 'How does the Oracle AI verify submissions?',
    answer:
      'Our Oracle uses multimodal Gemini intelligence to inspect submitted media against the specific criteria set by the challenge creator. It evaluates authenticity, effort, and completion. When approved, you instantly receive the bounty Cred plus any bonus Cred awarded for exceptional performance.',
    badge: 'AI Engine',
  },
  {
    id: 'streaks-and-milestones',
    category: 'streaks',
    question: 'How do Streaks and Milestone Badges work?',
    answer:
      'Participating in at least one dare action each day (deploying a challenge, accepting a task, or submitting proof) keeps your consecutive Streak alive. Reaching key milestones (3-Day, 5-Day, 7-Day, 14-Day, 30-Day) upgrades your profile badge with custom cyber neon glows, bonus Cred bonuses, and elevated Hall of Fame rank.',
    badge: 'Gamification',
  },
  {
    id: 'what-is-cred',
    category: 'streaks',
    question: 'What is Cred and can it be converted to real money?',
    answer:
      'Cred is DARE’s native in-app reputation score and virtual bounty currency. It measures your standing and credibility within the Netrunner community. Cred is strictly a virtual utility point system for leaderboards, dare stakes, and badge unlocking, and has no cash redemption value.',
    badge: 'Economy',
  },
  {
    id: 'prohibited-dares',
    category: 'safety',
    question: 'What types of dares are strictly forbidden?',
    answer:
      'We enforce a zero-tolerance policy against any dare involving physical danger or self-harm, illegal acts, property vandalism, harassment, hate speech, non-consensual pranking, or exposure of private personal information. Any dare violating these standards is immediately neutralized and the creator penalized.',
    badge: 'Safety First',
  },
  {
    id: 'dispute-resolution',
    category: 'ai',
    question: 'What happens if the Oracle rejects my proof unfairly?',
    answer:
      'The Oracle provides detailed audit reasoning with every verdict. If you feel your submission met all criteria, the community can review your proof on the Proof Viewer and vote up your authenticity score. You can also re-submit improved evidence before the timer expires.',
    badge: 'Audit',
  },
  {
    id: 'direct-challenge-rules',
    category: 'dares',
    question: 'How do Direct Rivalry dares work?',
    answer:
      'When creating a dare, choose "Target: Direct Rival" and pick a target user handle. The dare is locked exclusively to that user. The recipient gets an urgent prompt on their HUD to either accept the challenge or concede.',
    badge: 'Rivalry',
  },
];

export const LegalAndFaqModal: React.FC<LegalAndFaqModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'faq',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('what-is-dare');

  if (!isOpen) return null;

  // Filter FAQs based on search and category
  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    playSound('click');
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  const handleTabChange = (tab: LegalTab) => {
    playSound('click');
    setActiveTab(tab);
  };

  return (
    <div
      id="legal-faq-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="legal-faq-modal-container"
        className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-cyan-500/40 bg-[#0a0d14] text-slate-200 shadow-2xl glow-cyan overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0d121c] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 text-cyan-400 glow-cyan">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-tech text-xl font-bold uppercase tracking-wider text-white">
                  DARE Protocol & Legal Codex
                </h2>
                <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  v2.6 SECURE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Official FAQ, Terms of Service, Community Safety & Privacy Architecture
              </p>
            </div>
          </div>

          <button
            id="close-legal-modal-btn"
            type="button"
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-[#080b12] px-4 overflow-x-auto scrollbar-none">
          <button
            id="tab-faq"
            type="button"
            onClick={() => handleTabChange('faq')}
            className={`flex items-center gap-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Frequently Asked Questions</span>
          </button>

          <button
            id="tab-terms"
            type="button"
            onClick={() => handleTabChange('terms')}
            className={`flex items-center gap-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Terms of Service</span>
          </button>

          <button
            id="tab-safety"
            type="button"
            onClick={() => handleTabChange('safety')}
            className={`flex items-center gap-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'safety'
                ? 'border-rose-400 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-rose-400" />
            <span>Safety Protocol</span>
          </button>

          <button
            id="tab-privacy"
            type="button"
            onClick={() => handleTabChange('privacy')}
            className={`flex items-center gap-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Search and Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="faq-search-input"
                    type="text"
                    placeholder="Search questions (e.g. proof, cred, streak, arbiter)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-[#070a10] pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'general', label: 'General' },
                    { id: 'dares', label: 'Dares' },
                    { id: 'ai', label: 'AI Arbiter' },
                    { id: 'streaks', label: 'Streaks' },
                    { id: 'safety', label: 'Safety' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        playSound('click');
                        setSelectedCategory(cat.id);
                      }}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FAQ Accordion List */}
              <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-8 text-center">
                    <p className="font-mono text-sm text-slate-400">No matching questions found.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="mt-2 text-xs font-mono text-cyan-400 hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isOpen = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-xl border transition-all ${
                          isOpen
                            ? 'border-cyan-500/50 bg-[#0d131f]/90 glow-cyan'
                            : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(faq.id)}
                          className="flex w-full items-center justify-between p-4 text-left font-mono"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-950 text-xs font-bold text-cyan-400">
                              Q
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {faq.question}
                            </span>
                            {faq.badge && (
                              <span className="hidden sm:inline-block rounded bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                                {faq.badge}
                              </span>
                            )}
                          </div>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 text-cyan-400 shrink-0 ml-2" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-800/60 px-4 pb-4 pt-3 font-sans text-xs leading-relaxed text-slate-300">
                            <p>{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Need direct assistance banner */}
              <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/60 to-slate-950 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Mail className="h-5 w-5 text-cyan-400 shrink-0" />
                  <span>Still have questions or need to dispute an AI Arbiter ruling?</span>
                </div>
                <a
                  href="mailto:daredaylabs@gmail.com?subject=DARE%20Support%20Inquiry"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/50 px-3 py-1.5 font-mono text-xs font-bold text-cyan-300 hover:bg-cyan-900/50 transition-all"
                >
                  <span>Contact Support</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans animate-in fade-in duration-150">
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-tech text-sm font-bold text-amber-300 uppercase tracking-wide">
                      Notice: Voluntary Assumption of Risk & Personal Responsibility
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1">
                      DARE is a platform for creative, mental, athletic, and fun social dares. By
                      using DARE, you explicitly acknowledge that all challenges are undertaken
                      voluntarily at your own risk. Never attempt any challenge that compromises your
                      physical health, safety, or legal compliance.
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>1. Acceptance of Terms & Protocol</span>
                </h3>
                <p>
                  By accessing, browsing, deploying challenges, or submitting proof on DARE, you agree to be bound by these Terms of Service and all related community directives. If you do not agree to these terms in their entirety, you must cease interaction with the platform immediately.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>2. Eligibility & Node Conduct</span>
                </h3>
                <p>
                  Users must be at least 13 years of age (or the minimum legal age of digital consent in your jurisdiction). You agree to provide authentic representations in your profile and refrain from manipulating automated telemetry, botting challenge proofs, or fabricating deceptive multimedia evidence.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>3. Dare Creation & Prohibited Content</span>
                </h3>
                <p>
                  You retain responsibility for all challenges created under your handle. You may not deploy any dare that encourages:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
                  <li>Physical bodily harm, self-injury, or reckless endangerment</li>
                  <li>Violations of municipal, state, national, or international law</li>
                  <li>Harassment, stalking, doxxing, or defamation of any person</li>
                  <li>Trespassing on private property, destruction of infrastructure, or vandalism</li>
                  <li>Sexual explicit material, non-consensual imagery, or hate speech</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>4. Oracle AI Analysis & Disclaimers</span>
                </h3>
                <p>
                  Proofs are analyzed using algorithmic and artificial intelligence evaluation engines (the Oracle). While engineered for objective criteria matching, AI evaluations are provided "as-is". Platform operators reserve the right to review, overturn, or adjust verification scores in cases of reported system discrepancies or malicious evasion.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>5. Virtual Currency ("Cred") & Digital Badges</span>
                </h3>
                <p>
                  Cred points, streak tallies, and unlockable badges are non-transferable digital assets intended solely for interactive gamification. Cred has no monetary cash value, cannot be redeemed for fiat currency, and does not constitute a financial investment or security.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>6. Intellectual Property & Media License</span>
                </h3>
                <p>
                  By submitting challenge proof (including images, video recordings, or field notes), you grant DARE a worldwide, royalty-free license to display, index, and verify your submission on the platform feed, proof viewer, and community hall of fame. You affirm that you hold all necessary rights and third-party consents for uploaded content.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>7. Limitation of Liability</span>
                </h3>
                <p>
                  Under no circumstances shall DARE, its creators, or affiliated entities be liable for any direct, indirect, incidental, punitive, or consequential damages resulting from your participation in dares, interactions with other users, or reliance on AI verification results.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: SAFETY PROTOCOL */}
          {activeTab === 'safety' && (
            <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans animate-in fade-in duration-150">
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-5 glow-magenta">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-rose-400 shrink-0" />
                  <div>
                    <h3 className="font-tech text-base font-bold uppercase text-white tracking-wide">
                      DARE Netrunner Safety Charter
                    </h3>
                    <p className="text-xs text-rose-300/80 font-mono mt-0.5">
                      Fun is mandatory. Harm is strictly neutralized. Zero tolerance protocol.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2 font-mono font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>ACCEPTABLE & ENCOURAGED</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                    <li>Creative arts (street art sketches, coding sprints, beatmaking)</li>
                    <li>Athletic & fitness challenges (calisthenics, cold plunge, speed runs)</li>
                    <li>Wholesome public pranks (wearing humorous cyberpunk costumes in public)</li>
                    <li>Skill-building & brain teasers (memory feats, speed solving)</li>
                    <li>Acts of kindness or community service</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4">
                  <div className="flex items-center gap-2 mb-2 font-mono font-bold text-rose-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>STRICTLY PROHIBITED & BANNED</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                    <li>Consumption of toxic or dangerous non-food items</li>
                    <li>High-altitude or rooftop stunts without certified equipment</li>
                    <li>Harassing non-consenting strangers or retail staff</li>
                    <li>Dangerous driving, traffic obstruction, or vehicle tampering</li>
                    <li>Hate speech, intimidation, or privacy violations</li>
                  </ul>
                </div>
              </div>

              <section className="space-y-2">
                <h4 className="font-tech text-sm font-bold uppercase text-white tracking-wider flex items-center gap-2">
                  <Flame className="h-4 w-4 text-cyan-400" />
                  <span>The 3 Pillars of Safe Challenge Design</span>
                </h4>
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="font-mono font-bold text-cyan-300 text-xs">1. Attainable & Specific</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Clear instructions prevent misunderstandings and unsafe improvisations. State exactly what proof is expected.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="font-mono font-bold text-cyan-300 text-xs">2. Respectful of Surroundings</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dares must not damage public or private property or cause distress to bystanders.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                    <span className="font-mono font-bold text-cyan-300 text-xs">3. Consent & Dignity</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Direct rival dares can always be declined by the recipient with no penalty to their standing.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-[#07090e] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    Encountered an Unsafe Dare?
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Help keep the grid safe. Report violations directly to our moderation team.
                  </p>
                </div>
                <a
                  href="mailto:daredaylabs@gmail.com?subject=Urgent%20Safety%20Report%20-%20DARE"
                  className="rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold px-3 py-1.5 transition-all shadow-md shrink-0"
                >
                  Report Violation
                </a>
              </section>
            </div>
          )}

          {/* TAB 4: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans animate-in fade-in duration-150">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div>
                    <h4 className="font-tech text-sm font-bold text-cyan-300 uppercase tracking-wide">
                      Privacy & Data Telemetry Architecture
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Your privacy is protected by end-to-end node architecture and ethical AI telemetry.
                    </p>
                  </div>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400">
                  1. Information We Collect
                </h3>
                <p>
                  We collect user handle identifiers, avatar links, streak metrics, active dare participation records, and proof media uploaded during challenge submissions. We do not sell or monetize personal data to third-party data brokers.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400">
                  2. Multimodal AI Processing (Oracle)
                </h3>
                <p>
                  When you submit proof for verification, submitted images and video metadata are processed transiently through Google Gemini multimodal models exclusively to assess challenge criteria completion. Uploaded media is not used to train generic foundation models without consent.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400">
                  3. Media Storage & Public Feed
                </h3>
                <p>
                  Proof submitted for public challenges is visible to members of the community on the Proof Viewer and public feed. Users have the right to request deletion of their proof submissions at any time by contacting support.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-cyan-400">
                  4. Your Rights & Data Inquiries
                </h3>
                <p>
                  You have the right to request access to your stored records, rectify incorrect metadata, or request complete account erasure from the DARE node registry. For all inquiries, reach out to our privacy desk at{' '}
                  <span className="font-mono text-cyan-300">daredaylabs@gmail.com</span>.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#080b12] px-5 py-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>DARE Codex • Last Updated September 2026</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-bold text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
